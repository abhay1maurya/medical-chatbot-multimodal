
# 🩺 MedBot - Multimodal Medical Assistant

A fully functional multimodal medical chatbot built with Flask and Google's Gemini API that accepts **text, images, and audio inputs** while providing **text-based medical responses**. Perfect for analyzing prescriptions, lab reports, symptom descriptions, and medical queries.

![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.3.3-green.svg)
![Gemini](https://img.shields.io/badge/Gemini-2.0_Flash_Multimodal-orange.svg)
![Multimodal](https://img.shields.io/badge/Inputs-Text%2C%20Images%2C%20Audio-purple.svg)

## ✨ Features

- 🏥 **Medical Safety Focus** - Built-in disclaimers and emergency guidance
- 💬 **Multimodal Input** - Accepts text, images, and audio inputs
- 📷 **Image Analysis** - Extract text from medical images, prescriptions, lab reports
- 🎤 **Speech Recognition** - Convert audio descriptions to text using Google Speech API
- ⏺️ **Browser Recording** - Record audio directly in browser (no extra dependencies)
- 🔌 **REST API** - Programmatic access to all features
- 📱 **Mobile Responsive** - Works seamlessly on all devices
- 🔒 **Secure** - Environment-based API key management

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- [Gemini API Key](https://makersuite.google.com/app/apikey)

### Installation & Setup

1. **Clone and setup environment**
   ```bash
   git clone <your-repo-url>
   cd medical-chatbot-multimodal
   
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env and add your Gemini API key
   # GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - 🌐 **Web Interface**: http://localhost:8000
   - 🔧 **API Documentation**: http://localhost:8000/api/info
   - ❤️ **Health Check**: http://localhost:8000/api/health

## 🎯 Usage Examples

### Text Input
- "What are common flu symptoms?"
- "How can I manage high blood pressure naturally?"
- "When should I see a doctor for a fever?"

### Image Input (Upload or Capture)
- **Prescriptions**: Upload prescription images for explanation
- **Lab Reports**: Medical report analysis and interpretation
- **Medical Forms**: Extract information from medical documents
- **Skin Conditions**: General information from skin photos
- **Medical Devices**: Explain medical device instructions

### Audio Input (Upload or Record)
- **Symptom Descriptions**: Voice descriptions of symptoms
- **Medical Questions**: Recorded health concerns
- **Follow-up Questions**: Audio queries about previous responses
- **Accessibility**: Voice input for users who prefer speaking

## 📁 Project Structure

```
medical-chatbot-multimodal/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment template
├── .gitignore            # Git exclusion rules
├── README.md             # This documentation
├── templates/
│   └── index.html        # Web chat interface
├── static/
│   ├── style.css         # Responsive styling
│   └── script.js         # Frontend logic & audio recording
└── uploads/              # File upload directory (auto-created)
    ├── images/
    └── audio/
```

## 🔌 API Endpoints

### Chat Endpoint
```bash
POST /api/chat
Content-Type: multipart/form-data

# With file upload
file: <image_or_audio_file>
message: "Optional text context"

# Text-only
Content-Type: application/json
{"message": "Your medical question"}
```

### Response Format
```json
{
  "response": "Medical advice and information...",
  "input_type": "image|audio|text",
  "extracted_context": "Text extracted from image/audio",
  "disclaimer": "⚠️ Important: This information is for educational purposes only...",
  "success": true
}
```

### Other Endpoints
- `GET /api/health` - Service health check
- `GET /api/info` - API documentation and capabilities
- `GET /` - Web interface

### Example API Usage
```bash
# Text query
curl -X POST "http://localhost:8000/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are common cold symptoms?"}'

# File upload
curl -X POST "http://localhost:8000/api/chat" \
  -F "file=@prescription.jpg" \
  -F "message=Can you explain this prescription?"
```

## ⚠️ Medical Disclaimer

**This chatbot provides general health information only and is NOT a substitute for professional medical advice.**

### Critical Safety Information
- 🚨 **For emergencies**: Call your local emergency services immediately
- 🏥 **For medical concerns**: Always consult qualified healthcare professionals
- 📋 **For diagnoses**: See a doctor for proper medical evaluation
- 💊 **For treatments**: Follow prescribed medical treatments from your healthcare provider
- 🔍 **For prescriptions**: Always verify with your pharmacist or doctor

**The AI provides educational information but cannot diagnose, treat, or provide personalized medical advice.**

## 🔧 Technical Details

### Image Processing
- **Technology**: Google Gemini  API
- **Supported Formats**: PNG, JPG, JPEG, GIF, BMP
- **Max File Size**: 16MB
- **Capabilities**: Text extraction from medical documents, prescriptions, lab reports

### Audio Processing
- **Speech-to-Text**: Google Web Speech API
- **Supported Formats**: WAV, MP3, FLAC, M4A
- **Browser Recording**: Direct recording via MediaRecorder API
- **Max File Size**: 16MB

### AI Models Used
- **Text Generation**: `gemini-2.0-flash` for medical responses
- **Vision Analysis**: `gemini-2.0-flash` for image understanding
- **Speech Recognition**: `speech_recognition` with Google Web Speech API

### Security Features
- API keys stored in `.env` (never committed to version control)
- File upload validation and sanitization
- No persistent storage of sensitive medical data
- CORS protection and input validation

## 🐛 Troubleshooting

### Common Issues & Solutions

1. **API Key Error**
   ```bash
   # Ensure .env file exists with correct key
   cat .env
   # Should show: GEMINI_API_KEY=your_actual_key_here
   ```

2. **Audio Recording Not Working**
   - Allow microphone permissions in your browser
   - Use HTTPS in production for microphone access
   - Check browser console for errors

3. **File Upload Errors**
   - Check file size (max 16MB)
   - Verify supported formats: images (PNG, JPG, etc.) and audio (WAV, MP3, etc.)
   - Ensure uploads directory has write permissions

4. **Module Import Errors**
   ```bash
   # Reactivate virtual environment
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   
   # Reinstall dependencies
   pip install -r requirements.txt
   ```

### Health Check
Verify everything is working:
```bash
curl http://localhost:8000/api/health
```
Expected response:
```json
{
  "status": "healthy",
  "service": "Multimodal Medical Chatbot API",
  "text_model_ready": true,
  "vision_model_ready": true,
  "supported_inputs": ["text", "image", "audio"]
}
```

## 🚀 Production Deployment

### For Production Use

1. **Update Configuration**
   ```python
   # In app.py, change:
   app.run(debug=False)  # Set to False in production
   ```

2. **Use Production WSGI Server**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 app:app
   ```

3. **Environment Variables for Production**
   ```env
   FLASK_ENV=production
   SECRET_KEY=your_secure_secret_key
   MAX_FILE_SIZE=16777216
   ```

4. **HTTPS Setup** (Required for microphone access)
   - Use reverse proxy (Nginx/Apache)
   - Set up SSL certificates
   - Configure HTTPS redirects

### Docker Support (Optional)
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "app.py"]
```

## 🔒 Security Best Practices

1. **API Key Management**
   - Never commit `.env` to version control
   - Use different keys for development and production
   - Regularly rotate API keys

2. **Data Privacy**
   - No personal health information is stored
   - All file uploads are processed temporarily
   - Conversations are not persisted

3. **Input Validation**
   - File type verification
   - Size limits enforcement
   - Content sanitization

## 📊 Performance Notes

- **Image Processing**: ~2-5 seconds depending on size and complexity
- **Audio Processing**: ~1-3 seconds for typical recordings
- **Text Generation**: ~1-2 seconds for most queries
- **Memory Usage**: Minimal, with file size limits preventing overload

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Setup Development Environment**
   ```bash
   git clone <repository>
   cd medical-chatbot-multimodal
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Add your API key to .env
   ```

2. **Code Standards**
   - Follow PEP 8 guidelines
   - Add type hints for new functions
   - Include docstrings for complex logic
   - Update requirements.txt when adding dependencies

3. **Testing**
   - Test all input types (text, image, audio)
   - Verify error handling
   - Check mobile responsiveness

## 📄 License

This project is for educational and demonstration purposes. Medical chatbot applications should comply with healthcare regulations in your jurisdiction and should be reviewed by medical professionals before clinical use.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your API key is valid and has sufficient quota
3. Check browser console for frontend errors
4. Review Flask server logs for backend errors

---

<div align="center">

**Built with ❤️ using Flask & Gemini AI**

### 🎯 Perfect For
- Medical education and information
- Symptom checking guidance
- Prescription and lab report explanation
- Healthcare accessibility tools

[Report Bug](https://github.com/abhay1maurya/medical-chatbot/issues) · [Request Feature](https://github.com/abhay1maurya/medical-chatbot/issues)

</div>

---

**Remember**: This tool is for educational information only. Always consult healthcare professionals for medical advice, diagnosis, and treatment. In emergencies, call your local emergency services immediately.
```

## 🎯 Ready-to-Use Configuration Files

### .env.example
```env
# Google Gemini API Configuration
# Get your API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your_secret_key_here

# File Upload Settings
MAX_FILE_SIZE=16777216  # 16MB in bytes
ALLOWED_IMAGE_EXTENSIONS=png,jpg,jpeg,gif,bmp
ALLOWED_AUDIO_EXTENSIONS=wav,mp3,flac,m4a
```

### requirements.txt
```txt
flask==2.3.3
python-dotenv==1.0.0
google-generativeai==0.3.2
pillow==10.0.1
speechrecognition==3.10.0
pydub==0.25.1
werkzeug==2.3.7
```

pip install wheel
