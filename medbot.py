import os
import io
import google.generativeai as genai
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
import speech_recognition as sr
from PIL import Image
import tempfile

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_FILE_SIZE', 16777216))  # 16MB

# Configure file uploads
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_IMAGE_EXTENSIONS = set(os.getenv('ALLOWED_IMAGE_EXTENSIONS', 'png,jpg,jpeg,gif,bmp').split(','))
ALLOWED_AUDIO_EXTENSIONS = set(os.getenv('ALLOWED_AUDIO_EXTENSIONS', 'wav,mp3,flac,m4a').split(','))

# Create upload directories
os.makedirs(os.path.join(UPLOAD_FOLDER, 'images'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'audio'), exist_ok=True)

# Configure Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise ValueError("ERROR: Please set GEMINI_API_KEY in your .env file")

genai.configure(api_key=api_key)

# Medical system prompt for fine-tuning
MEDICAL_SYSTEM_PROMPT = """
You are MedBot, a helpful medical assistant designed to provide general health information and answer medical questions.

CRITICAL MEDICAL GUIDELINES:
1. Provide accurate, evidence-based medical information only
2. Always include a disclaimer that you are not a substitute for professional medical advice
3. For emergency symptoms (chest pain, difficulty breathing, severe bleeding, sudden weakness), advise immediate medical attention
4. Be clear about when someone should consult a healthcare professional
5. Use simple, understandable language for the general public
6. Do not provide diagnoses - only general information about conditions and symptoms
7. Encourage preventive care and healthy lifestyle choices
8. Be empathetic and supportive in your responses

EMERGENCY SITUATIONS - Always respond with:
"If you are experiencing [symptom], this could be a medical emergency. Please call emergency services or go to the nearest hospital immediately."

Remember: Always prioritize user safety and encourage professional medical consultation for specific health concerns.
"""

# Initialize Gemini models
try:
    text_model = genai.GenerativeModel('gemini-2.0-flash')
    vision_model = genai.GenerativeModel('gemini-2.0-flash')
    print("✅ Gemini models initialized successfully")
except Exception as e:
    print(f"❌ Error initializing Gemini models: {e}")
    text_model = None
    vision_model = None

def allowed_file(filename, allowed_extensions):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def extract_text_from_image(image_file):
    """Extract text from image using Gemini Vision"""
    try:
        # Read image file
        image_data = image_file.read()
        image = Image.open(io.BytesIO(image_data))
        
        # Use Gemini Vision to analyze the image
        prompt = """
        Analyze this medical image and extract any relevant text or information.
        This could include:
        - Prescription text
        - Lab report data
        - Medical form information
        - Symptom descriptions from images
        - Any visible medical text
        
        Provide a clear, concise summary of the text content found in the image.
        If this appears to be a medical document, prescription, or lab report, 
        focus on extracting the key medical information.
        """
        
        response = vision_model.generate_content([prompt, image])
        return response.text.strip()
    
    except Exception as e:
        print(f"Error processing image: {e}")
        return f"Unable to process image: {str(e)}"

def extract_text_from_audio(audio_file):
    """Convert speech to text using SpeechRecognition"""
    try:
        # Save audio file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            
            # Initialize recognizer
            recognizer = sr.Recognizer()
            
            # Load audio file
            with sr.AudioFile(temp_audio.name) as source:
                # Adjust for ambient noise and record
                recognizer.adjust_for_ambient_noise(source)
                audio_data = recognizer.record(source)
                
            # Convert speech to text using Google Web Speech API
            text = recognizer.recognize_google(audio_data)
            return text.strip()
            
    except sr.UnknownValueError:
        return "Could not understand the audio. Please try speaking more clearly or check the audio quality."
    except sr.RequestError as e:
        return f"Error with speech recognition service: {e}"
    except Exception as e:
        print(f"Audio processing error: {e}")
        return f"Error processing audio: {str(e)}"

def create_medical_prompt(user_message, extracted_context=""):
    """Create a properly formatted medical prompt with context"""
    if extracted_context:
        prompt = f"""
{MEDICAL_SYSTEM_PROMPT}

USER PROVIDED CONTEXT FROM IMAGE/AUDIO:
{extracted_context}

USER QUESTION: {user_message}

Please analyze the provided context and respond to the user's question following all medical guidelines above.

YOUR RESPONSE:
"""
    else:
        prompt = f"""
{MEDICAL_SYSTEM_PROMPT}

USER QUESTION: {user_message}

Please respond to the user's question following all medical guidelines above.

YOUR RESPONSE:
"""
    return prompt

@app.route('/')
def home():
    """Render the main chat interface"""
    return render_template('index.html')

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy", 
        "service": "Multimodal Medical Chatbot API",
        "text_model_ready": text_model is not None,
        "vision_model_ready": vision_model is not None,
        "supported_inputs": ["text", "image", "audio"]
    })

@app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    """
    Main chat API endpoint - accepts text, image, and audio inputs
    """
    try:
        # Initialize variables
        user_message = ""
        extracted_context = ""
        input_type = "text"
        
        # Check if it's a file upload
        if 'file' in request.files:
            file = request.files['file']
            if file and file.filename:
                filename = secure_filename(file.filename)
                
                # Process image file
                if allowed_file(filename, ALLOWED_IMAGE_EXTENSIONS):
                    input_type = "image"
                    extracted_context = extract_text_from_image(file)
                    user_message = request.form.get('message', 'Can you help me understand this image?')
                
                # Process audio file
                elif allowed_file(filename, ALLOWED_AUDIO_EXTENSIONS):
                    input_type = "audio"
                    extracted_context = extract_text_from_audio(file)
                    user_message = request.form.get('message', 'Can you help me with what I described?')
                
                else:
                    return jsonify({
                        "error": "Invalid file type",
                        "message": f"Please upload a valid image ({', '.join(ALLOWED_IMAGE_EXTENSIONS)}) or audio file ({', '.join(ALLOWED_AUDIO_EXTENSIONS)}).",
                        "success": False
                    }), 400
        
        # Process text-only message
        elif request.is_json:
            data = request.get_json()
            user_message = data.get('message', '').strip()
            input_type = "text"
        
        else:
            return jsonify({
                "error": "Invalid request format",
                "message": "Please provide a message or file upload.",
                "success": False
            }), 400
        
        # Validate input
        if not user_message and not extracted_context:
            return jsonify({
                "error": "Empty input",
                "message": "Please provide a message or meaningful file content.",
                "success": False
            }), 400
        
        if not text_model:
            return jsonify({
                "error": "Service unavailable",
                "message": "AI model is not available. Please check your API configuration.",
                "success": False
            }), 503
        
        # Create medical prompt
        medical_prompt = create_medical_prompt(user_message, extracted_context)
        
        # Generate response using Gemini
        response = text_model.generate_content(medical_prompt)
        
        # Return successful response
        return jsonify({
            "response": response.text,
            "input_type": input_type,
            "extracted_context": extracted_context if input_type in ["image", "audio"] else None,
            "disclaimer": "⚠️ Important: This information is for educational purposes only and is not medical advice. Always consult with a qualified healthcare professional for medical concerns.",
            "success": True
        })
        
    except Exception as e:
        # Handle errors gracefully
        error_message = f"Error generating response: {str(e)}"
        print(error_message)
        
        return jsonify({
            "error": "Internal server error",
            "message": "Sorry, I encountered an error while processing your request. Please try again.",
            "success": False
        }), 500

@app.route('/api/info')
def api_info():
    """API information endpoint"""
    return jsonify({
        "name": "Multimodal Medical Chatbot API",
        "version": "2.0.0",
        "endpoints": {
            "GET /": "Web chat interface",
            "POST /api/chat": "Chat with text, image, or audio input",
            "GET /api/health": "Service health check",
            "GET /api/info": "This information"
        },
        "supported_inputs": ["text", "image", "audio"],
        "file_limits": {
            "max_size": "16MB",
            "image_formats": list(ALLOWED_IMAGE_EXTENSIONS),
            "audio_formats": list(ALLOWED_AUDIO_EXTENSIONS)
        },
        "description": "A multimodal medical Q&A chatbot using Google Gemini AI"
    })

if __name__ == '__main__':
    print("🚀 Starting Multimodal Medical Chatbot Server...")
    print("📖 Visit http://localhost:8000 for the web interface")
    print("🔧 API docs available at http://localhost:8000/api/info")
    print("📁 Supported inputs: Text, Images, Audio")
    print("✅ No pyaudio dependency - using browser-based recording")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=8000,
        debug=True
    )