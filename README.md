markdown
# 🩺 MedBot - Multimodal Medical Assistant

A fully functional multimodal medical chatbot built with Flask and Google's Gemini API that accepts text, images, and audio inputs while providing text-based medical responses.

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash_Multimodal-orange.svg)

## ✨ Features

- 🏥 **Medical Safety Focus** - Built-in disclaimers and emergency guidance
- 💬 **Multimodal Input** - Accepts text, images, and audio
- 📷 **Image Analysis** - Extract text from medical images, prescriptions, reports
- 🎤 **Speech Recognition** - Convert audio descriptions to text
- 🔌 **REST API** - Programmatic access to all features
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- [Gemini API Key](https://makersuite.google.com/app/apikey)

### Installation

1. **Clone and setup environment**
   ```bash
   git clone <your-repo-url>
   cd medical-chatbot-multimodal
   
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
Install dependencies

bash
pip install -r requirements.txt
Configure environment

bash
cp .env.example .env
# Edit .env and add your Gemini API key
Run application

bash
python app.py
Visit: http://localhost:8000

📁 Project Structure
text
medical-chatbot-multimodal/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── templates/index.html  # Web interface
├── static/
│   ├── style.css         # Styling
│   └── script.js         # Frontend logic
└── uploads/              # File upload directory
🎯 Usage Examples
Text Input
"What are common flu symptoms?"

"How can I manage high blood pressure?"

Image Input
Upload prescription images for explanation

Medical report analysis

Skin condition photos (for general information)

Lab result interpretation

Audio Input
Voice descriptions of symptoms

Recorded medical questions

Verbal health concerns

🔌 API Endpoints
Chat Endpoint
bash
POST /api/chat
Content-Type: multipart/form-data

# With file upload
file: <image_or_audio_file>
message: "Optional text context"

# Text-only
Content-Type: application/json
{"message": "Your medical question"}
Response Format
json
{
  "response": "Medical advice...",
  "input_type": "image|audio|text",
  "extracted_context": "Text from image/audio",
  "disclaimer": "Safety notice...",
  "success": true
}
⚠️ Medical Disclaimer
This chatbot provides general health information only and is NOT a substitute for professional medical advice.

🚨 For emergencies: Call your local emergency services immediately

🏥 For medical concerns: Always consult qualified healthcare professionals

📋 For diagnoses: See a doctor for proper medical evaluation

🔧 Technical Details
Image Processing
Uses Gemini Vision API for text extraction

Supports: PNG, JPG, JPEG, GIF, BMP

Max file size: 16MB

Audio Processing
Uses Google Speech Recognition

Supports: WAV, MP3, FLAC, M4A

Real-time recording available

Max file size: 16MB

Models Used
Text: gemini-pro for medical responses

Vision: gemini-pro-vision for image analysis

Audio: speech_recognition with Google Web Speech API

🐛 Troubleshooting
Common Issues
API Key Error

Ensure .env file has correct GEMINI_API_KEY

Verify key is active in Google AI Studio

Audio Recording Issues

Allow microphone permissions in browser

Use HTTPS for microphone access in production

File Upload Errors

Check file size (max 16MB)

Verify supported file formats

Health Check
bash
curl http://localhost:8000/api/health
🚀 Deployment
For production:

Set debug=False in app.py

Use production WSGI server

Configure HTTPS for microphone access

Set proper file upload limits

bash
# With Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
🔒 Security Notes
API keys stored in .env (never committed)

File uploads sanitized and validated

No persistent storage of medical data

Use HTTPS in production

Built with ❤️ using Flask & Gemini AI

Remember: Always consult healthcare professionals for medical advice.