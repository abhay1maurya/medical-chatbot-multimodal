document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const currentTimeElement = document.getElementById('current-time');
    
    // Input method elements
    const methodCards = document.querySelectorAll('.method-card');
    const inputSections = document.querySelectorAll('.input-section');
    
    // File upload elements
    const imageUpload = document.getElementById('image-upload');
    const audioUpload = document.getElementById('audio-upload');
    const imageInfo = document.getElementById('image-info');
    const audioInfo = document.getElementById('audio-info');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const uploadAudioBtn = document.getElementById('upload-audio-btn');
    
    // Audio recording elements
    const recordBtn = document.getElementById('record-btn');
    const stopRecordBtn = document.getElementById('stop-record-btn');
    const recordingDisplay = document.getElementById('recording-display');
    const recordingTimer = document.getElementById('recording-timer');
    const audioWaveform = document.getElementById('audio-waveform');
    
    // Quick question chips
    const questionChips = document.querySelectorAll('.chip');
    
    // Loading overlay
    const loadingOverlay = document.getElementById('loading-overlay');
    
    // State variables
    let currentFileType = null;
    let mediaRecorder = null;
    let audioContext = null;
    let audioStream = null;
    let recordingStartTime = null;
    let recordingInterval = null;
    let currentInputMethod = 'text';

    // Initialize the application
    function init() {
        updateCurrentTime();
        setInterval(updateCurrentTime, 60000);
        
        checkConnectionStatus();
        setupEventListeners();
        setupDragAndDrop();
        
        switchInputMethod('text');
    }

    // Update current time display
    function updateCurrentTime() {
        const now = new Date();
        currentTimeElement.textContent = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Check API connection status
    async function checkConnectionStatus() {
        try {
            const response = await fetch('/api/health');
            const data = await response.json();
            
            if (data.status === 'healthy') {
                setConnectionStatus('connected', 'Connected');
            } else {
                setConnectionStatus('disconnected', 'Service Issues');
            }
        } catch (error) {
            setConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    function setConnectionStatus(status, text) {
        statusIndicator.className = `fas fa-circle ${status}`;
        statusText.textContent = text;
    }

    // Setup event listeners
    function setupEventListeners() {
        // Input method switching
        methodCards.forEach(card => {
            card.addEventListener('click', () => {
                const method = card.dataset.method;
                switchInputMethod(method);
            });
        });

        // Text input
        sendBtn.addEventListener('click', sendTextMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
            }
        });

        // Auto-resize textarea
        userInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });

        // File uploads
        imageUpload.addEventListener('change', handleImageUpload);
        audioUpload.addEventListener('change', handleAudioUpload);
        uploadImageBtn.addEventListener('click', sendImage);
        uploadAudioBtn.addEventListener('click', sendAudio);

        // Audio recording
        recordBtn.addEventListener('click', startRecording);
        stopRecordBtn.addEventListener('click', stopRecording);

        // Quick questions
        questionChips.forEach(chip => {
            chip.addEventListener('click', () => {
                const question = chip.dataset.question;
                userInput.value = question;
                switchInputMethod('text');
                userInput.focus();
            });
        });
    }

    // Switch between input methods
    function switchInputMethod(method) {
        currentInputMethod = method;
        
        methodCards.forEach(card => {
            card.classList.toggle('active', card.dataset.method === method);
        });
        
        inputSections.forEach(section => {
            section.classList.toggle('active', section.id === `${method}-input`);
        });
        
        if (method !== 'image') resetImageInput();
        if (method !== 'audio') resetAudioInput();
    }

    // Setup drag and drop
    function setupDragAndDrop() {
        const imageUploadArea = document.getElementById('image-upload-area');
        const audioUploadArea = document.getElementById('audio-upload-area');

        [imageUploadArea, audioUploadArea].forEach(area => {
            area.addEventListener('dragover', (e) => {
                e.preventDefault();
                area.classList.add('drag-over');
            });

            area.addEventListener('dragleave', () => {
                area.classList.remove('drag-over');
            });

            area.addEventListener('drop', (e) => {
                e.preventDefault();
                area.classList.remove('drag-over');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    if (area === imageUploadArea) {
                        handleFileSelect(files[0], 'image');
                    } else {
                        handleFileSelect(files[0], 'audio');
                    }
                }
            });
        });
    }

    // Handle file selection
    function handleFileSelect(file, type) {
        const input = type === 'image' ? imageUpload : audioUpload;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        
        if (type === 'image') {
            handleImageUpload();
        } else {
            handleAudioUpload();
        }
    }

    // Image upload handling
    function handleImageUpload() {
        if (imageUpload.files.length > 0) {
            const file = imageUpload.files[0];
            imageInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            currentFileType = 'image';
            uploadImageBtn.disabled = false;
        }
    }

    // Audio upload handling
    function handleAudioUpload() {
        if (audioUpload.files.length > 0) {
            const file = audioUpload.files[0];
            audioInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
            currentFileType = 'audio';
            uploadAudioBtn.disabled = false;
        }
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Reset inputs
    function resetImageInput() {
        imageUpload.value = '';
        imageInfo.textContent = 'No file selected';
        uploadImageBtn.disabled = true;
        document.getElementById('image-context').value = '';
    }

    function resetAudioInput() {
        audioUpload.value = '';
        audioInfo.textContent = 'No file selected';
        uploadAudioBtn.disabled = true;
        document.getElementById('audio-context').value = '';
        stopRecording();
    }

    // Add message to chat
    function addMessage(content, isUser = false, type = 'text', metadata = {}) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} ${type}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = `<i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageHeader = document.createElement('div');
        messageHeader.className = 'message-header';
        messageHeader.innerHTML = `
            <strong>${isUser ? 'You' : 'MedBot Pro'}</strong>
            <span class="message-time">${new Date().toLocaleTimeString()}</span>
        `;
        
        const messageBody = document.createElement('div');
        messageBody.innerHTML = content;
        
        messageContent.appendChild(messageHeader);
        messageContent.appendChild(messageBody);
        
        if (metadata.fileType) {
            const fileInfo = document.createElement('div');
            fileInfo.className = 'message-tip';
            fileInfo.innerHTML = `<i class="fas fa-info-circle"></i> Sent via ${metadata.fileType}`;
            messageContent.appendChild(fileInfo);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Show error message
    function showError(message) {
        addMessage(`<i class="fas fa-exclamation-triangle"></i> ${message}`, false, 'error');
    }

    // Show success message
    function showSuccess(message) {
        addMessage(`<i class="fas fa-check-circle"></i> ${message}`, false, 'success');
    }

    // Show loading state
    function showLoading(show) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Send text message
    async function sendTextMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        addMessage(message, true);
        userInput.value = '';
        userInput.style.height = 'auto';
        sendBtn.disabled = true;
        
        showLoading(true);

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
            showLoading(false);
        }
    }

    // Send image
    async function sendImage() {
        const file = imageUpload.files[0];
        const context = document.getElementById('image-context').value.trim();
        
        if (!file) return;

        addMessage(`<i class="fas fa-image"></i> Uploaded medical image: ${file.name}`, true, 'text', { fileType: 'Image' });
        if (context) {
            addMessage(context, true);
        }

        showLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', context || 'Can you help me understand this medical image?');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (data.extracted_context) {
                    addMessage(`<strong>Extracted from image:</strong> ${data.extracted_context}`, false, 'context');
                }
                addMessage(data.response);
                if (data.disclaimer) {
                    addMessage(`<em>${data.disclaimer}</em>`);
                }
                
                showSuccess('Image analysis completed successfully!');
            } else {
                showError(data.message || 'Sorry, I encountered an error processing your image.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            showLoading(false);
            resetImageInput();
        }
    }

    // Send audio
    async function sendAudio() {
        const file = audioUpload.files[0];
        const context = document.getElementById('audio-context').value.trim();
        
        if (!file) return;

        addMessage(`<i class="fas fa-microphone"></i> Uploaded audio recording`, true, 'text', { fileType: 'Audio' });
        if (context) {
            addMessage(context, true);
        }

        showLoading(true);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('message', context || 'Can you help me with what I described?');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                if (data.extracted_context) {
                    addMessage(`<strong>Transcribed from audio:</strong> ${data.extracted_context}`, false, 'context');
                }
                addMessage(data.response);
                if (data.disclaimer) {
                    addMessage(`<em>${data.disclaimer}</em>`);
                }
                
                showSuccess('Audio processing completed successfully!');
            } else {
                showError(data.message || 'Sorry, I encountered an error processing your audio.');
            }
        } catch (error) {
            showError('Network error. Please check your connection and try again.');
        } finally {
            showLoading(false);
            resetAudioInput();
        }
    }

    // Audio recording functions - UPDATED FOR WAV FORMAT
    async function startRecording() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showError('Audio recording is not supported in your browser. Please upload an audio file instead.');
                return;
            }

            // Get audio stream
            audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000, // Standard for speech recognition
                    sampleSize: 16,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            // Initialize AudioContext for processing
            audioContext = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(audioStream);
            
            // Create script processor to capture raw audio data
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            let audioBuffers = [];
            
            processor.onaudioprocess = (event) => {
                const inputData = event.inputBuffer.getChannelData(0);
                audioBuffers.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            // Update UI
            recordBtn.style.display = 'none';
            recordingDisplay.style.display = 'flex';
            audioWaveform.style.display = 'flex';
            
            recordingStartTime = Date.now();
            startRecordingTimer();
            
            showSuccess('Recording started... Speak clearly into your microphone.');

            // Store processor and buffers for later use
            mediaRecorder = {
                processor: processor,
                buffers: audioBuffers,
                stop: function() {
                    processor.disconnect();
                    audioContext.close();
                    
                    // Convert buffers to WAV
                    const wavBlob = encodeWAV(audioBuffers, 16000);
                    const audioFile = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
                    
                    // Create a fake file input for the recording
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(audioFile);
                    audioUpload.files = dataTransfer.files;
                    
                    audioInfo.textContent = `Recording (${formatFileSize(wavBlob.size)}) - Ready to send`;
                    currentFileType = 'audio';
                    uploadAudioBtn.disabled = false;
                    
                    showSuccess('Recording completed! Click "Process Audio" to analyze.');
                    
                    // Stop all tracks
                    audioStream.getTracks().forEach(track => track.stop());
                }
            };
            
        } catch (error) {
            console.error('Recording error:', error);
            showError('Microphone access denied or not available. Please allow microphone permissions and try again.');
        }
    }

    function stopRecording() {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
        
        // Reset UI
        recordBtn.style.display = 'flex';
        recordingDisplay.style.display = 'none';
        audioWaveform.style.display = 'none';
        
        // Stop timer
        stopRecordingTimer();
    }

    // WAV encoding functions
    function encodeWAV(audioBuffers, sampleRate) {
        // Combine all buffers into one
        const length = audioBuffers.reduce((total, buffer) => total + buffer.length, 0);
        const samples = new Float32Array(length);
        
        let offset = 0;
        for (const buffer of audioBuffers) {
            samples.set(buffer, offset);
            offset += buffer.length;
        }

        // Convert to 16-bit PCM
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        // WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true); // Byte rate
        view.setUint16(32, 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        writeString(view, 36, 'data');
        view.setUint32(40, samples.length * 2, true);

        // Convert to 16-bit
        floatTo16BitPCM(view, 44, samples);

        return new Blob([view], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function floatTo16BitPCM(output, offset, input) {
        for (let i = 0; i < input.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    function startRecordingTimer() {
        recordingStartTime = Date.now();
        recordingInterval = setInterval(updateRecordingTimer, 1000);
    }

    function stopRecordingTimer() {
        if (recordingInterval) {
            clearInterval(recordingInterval);
            recordingInterval = null;
        }
        recordingTimer.textContent = '00:00';
    }

    function updateRecordingTimer() {
        const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const seconds = (elapsed % 60).toString().padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
        
        // Limit recording to 2 minutes (optimal for speech recognition)
        if (elapsed >= 120) {
            stopRecording();
            showError('Recording stopped: Maximum 2 minute limit reached for optimal processing.');
        }
    }

    // Initialize the app
    init();
});