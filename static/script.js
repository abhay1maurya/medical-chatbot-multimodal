document.addEventListener('DOMContentLoaded', function() {
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const uploadBtn = document.getElementById('upload-btn');
    const recordBtn = document.getElementById('record-btn');
    const stopRecordBtn = document.getElementById('stop-record-btn');
    const recordingControls = document.getElementById('recording-controls');
    const imageUpload = document.getElementById('image-upload');
    const audioUpload = document.getElementById('audio-upload');
    const imageInfo = document.getElementById('image-info');
    const audioInfo = document.getElementById('audio-info');
    const chatMessages = document.getElementById('chat-messages');
    const exampleQuestions = document.querySelectorAll('.example');

    let mediaRecorder;
    let audioChunks = [];
    let currentFileType = null;

    // Function to add message to chat
    function addMessage(content, isUser = false, type = 'text') {
        const messageDiv = document.createElement('div');
        
        if (type === 'context') {
            messageDiv.className = 'message context-message';
        } else {
            messageDiv.className = isUser ? 'message user-message' : 'message bot-message';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        if (type === 'context') {
            messageContent.innerHTML = `<strong>Extracted Content:</strong> ${content}`;
        } else {
            messageContent.innerHTML = isUser ? 
                `<strong>You:</strong> ${content}` : 
                `<strong>MedBot:</strong> ${content}`;
        }
        
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show error message
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message error-message';
        errorDiv.innerHTML = `<div class="message-content"><strong>Error:</strong> ${message}</div>`;
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show success message
    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'message bot-message';
        successDiv.innerHTML = `<div class="message-content" style="background: #d4edda; color: #155724; border: 1px solid #c3e6cb;"><strong>Info:</strong> ${message}</div>`;
        chatMessages.appendChild(successDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to send text message
    async function sendTextMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        userInput.value = '';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: message })
            });

            const data = await response.json();

            if (data.success) {
                addMessage(data.response);
                if (data.disclaimer) {
                    addMessage(`<em>${data.disclaimer}</em>`);
                }
            } else {
                showError(data.message || 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Send Text';
        }
    }

    // Function to send file
    async function sendFile() {
        if (!currentFileType) return;

        const fileInput = currentFileType === 'image' ? imageUpload : audioUpload;
        const file = fileInput.files[0];
        const message = userInput.value.trim() || (currentFileType === 'image' ? 'Can you help me understand this image?' : 'Can you help me with what I described?');

        if (!file) return;

        addMessage(`${currentFileType === 'image' ? '📷 Image' : '🎤 Audio'} uploaded: ${file.name}`, true);
        if (message) {
            addMessage(message, true);
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', message);

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Uploading...';

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Show extracted context if available
                if (data.extracted_context) {
                    addMessage(data.extracted_context, false, 'context');
                }
                addMessage(data.response);
                if (data.disclaimer) {
                    addMessage(`<em>${data.disclaimer}</em>`);
                }
            } else {
                showError(data.message || 'Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            uploadBtn.disabled = true;
            uploadBtn.textContent = 'Send File';
            resetFileInputs();
        }
    }

    // Function to reset file inputs
    function resetFileInputs() {
        imageUpload.value = '';
        audioUpload.value = '';
        imageInfo.textContent = 'No image selected';
        audioInfo.textContent = 'No audio selected';
        uploadBtn.disabled = true;
        currentFileType = null;
    }

    // Function to start audio recording
    async function startRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showError('Audio recording is not supported in your browser. Please upload an audio file instead.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16
                } 
            });
            
            mediaRecorder = new MediaRecorder(stream, { 
                mimeType: 'audio/webm;codecs=opus' 
            });
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // Convert webm to wav for better compatibility
                try {
                    const audioContext = new AudioContext();
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    const wavBlob = await audioBufferToWav(audioBuffer);
                    const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
                    
                    // Create a fake file input for the recording
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(audioFile);
                    audioUpload.files = dataTransfer.files;
                    
                    audioInfo.textContent = 'Recording ready - Click "Send File"';
                    currentFileType = 'audio';
                    uploadBtn.disabled = false;
                    
                    showSuccess('Audio recording completed! Click "Send File" to process.');
                    
                } catch (conversionError) {
                    console.error('Audio conversion error:', conversionError);
                    showError('Failed to process recording. Please try again.');
                }
                
                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            recordBtn.style.display = 'none';
            recordingControls.style.display = 'block';
            showSuccess('Recording started... Speak now.');
            
        } catch (error) {
            console.error('Recording error:', error);
            showError('Microphone access denied or not available. Please allow microphone permissions and try again.');
        }
    }

    // Function to convert AudioBuffer to WAV Blob
    function audioBufferToWav(buffer) {
        return new Promise((resolve) => {
            const length = buffer.length;
            const sampleRate = buffer.sampleRate;
            const channels = buffer.numberOfChannels;
            const interleaved = new Float32Array(length * channels);
            
            // Interleave the channel data
            for (let channel = 0; channel < channels; channel++) {
                const channelData = buffer.getChannelData(channel);
                for (let i = 0; i < length; i++) {
                    interleaved[i * channels + channel] = channelData[i];
                }
            }
            
            // Create WAV file
            const wavBlob = encodeWAV(interleaved, channels, sampleRate);
            resolve(wavBlob);
        });
    }

    // Function to encode WAV file
    function encodeWAV(samples, numChannels, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        
        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        
        // Convert samples to 16-bit
        let offset = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }

    // Function to stop audio recording
    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
        recordBtn.style.display = 'block';
        recordingControls.style.display = 'none';
    }

    // Event listeners for text input
    sendBtn.addEventListener('click', sendTextMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendTextMessage();
        }
    });

    // Event listeners for file uploads
    imageUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            imageInfo.textContent = this.files[0].name;
            currentFileType = 'image';
            uploadBtn.disabled = false;
        }
    });

    audioUpload.addEventListener('change', function() {
        if (this.files.length > 0) {
            audioInfo.textContent = this.files[0].name;
            currentFileType = 'audio';
            uploadBtn.disabled = false;
        }
    });

    uploadBtn.addEventListener('click', sendFile);

    // Event listeners for audio recording
    recordBtn.addEventListener('click', startRecording);
    stopRecordBtn.addEventListener('click', stopRecording);

    // Event listeners for example questions
    exampleQuestions.forEach(example => {
        example.addEventListener('click', function() {
            userInput.value = this.getAttribute('data-question');
            userInput.focus();
        });
    });

    // Click handlers for upload labels
    document.querySelector('label[for="image-upload"]').addEventListener('click', function() {
        resetFileInputs();
    });

    document.querySelector('label[for="audio-upload"]').addEventListener('click', function() {
        resetFileInputs();
    });

    // Focus on input field
    userInput.focus();

    // Check for recording support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        recordBtn.disabled = true;
        recordBtn.title = 'Audio recording not supported in your browser';
        showError('Audio recording is not supported in your browser. Please use audio file upload instead.');
    }
});