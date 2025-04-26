// DOM elements
const notesTextarea = document.getElementById('notes');
const recordBtn = document.getElementById('recordBtn');
const insertBtn = document.getElementById('insertBtn');
const statusDiv = document.getElementById('status');

// Vosk variables
let model;
let recognizer;
let audioChunks = [];
let mediaRecorder;
let isRecording = false;

// Initialize Vosk model (Spanish)
async function initVosk() {
    statusDiv.textContent = "Loading Spanish model...";
    
    try {
        // Wait for Vosk to be ready
        await new Promise(resolve => {
            if (window.Vosk) resolve();
            window.onVoskReady = resolve;
        });

        console.log("Vosk exists?", typeof Vosk);  // Should print "function"
        console.log("Model path:", "https://pablogaravito.github.io/voice-notes/models/vosk-model-small-es-0.42");
        
        model = await Vosk.createModel("https://pablogaravito.github.io/voice-notes/models/vosk-model-small-es-0.42");
        recognizer = new model.KaldiRecognizer();
        recognizer.setWords(true); 
        statusDiv.textContent = "Model loaded! Click 'Start Recording'.";
        recordBtn.disabled = false;
    } catch (error) {
        statusDiv.textContent = `Error: ${error.message}. Check console (F12)`;
        console.error(error);
    }
}

// Start/stop recording
recordBtn.addEventListener('click', async () => {
    if (!isRecording) {
        // Start recording
        audioChunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
        mediaRecorder.start(100); // Collect data every 100ms
        
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            processAudio(audioBlob);
        };
        
        recordBtn.textContent = "Stop Recording";
        statusDiv.textContent = "Recording... (click again to stop)";
    } else {
        // Stop recording
        mediaRecorder.stop();
        recordBtn.textContent = "Start Recording";
        statusDiv.textContent = "Processing audio...";
    }
    isRecording = !isRecording;
});

// Process recorded audio
async function processAudio(audioBlob) {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Convert to 16kHz mono (Vosk requirement)
    const offlineCtx = new OfflineAudioContext(1, audioBuffer.duration * 16000, 16000);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start();
    
    const renderedBuffer = await offlineCtx.startRendering();
    const audioData = renderedBuffer.getChannelData(0);
    
    // Feed to Vosk
    recognizer.acceptWaveform(audioData);
    const result = JSON.parse(recognizer.result()).text;
    
    statusDiv.textContent = `Transcription ready: "${result}"`;
    insertBtn.disabled = false;
    
    // Click "Insert" to add to textarea
    insertBtn.onclick = () => {
        const cursorPos = notesTextarea.selectionStart;
        const textBefore = notesTextarea.value.substring(0, cursorPos);
        const textAfter = notesTextarea.value.substring(cursorPos);
        notesTextarea.value = textBefore + result + " " + textAfter;
        insertBtn.disabled = true;
    };
}

const themeToggle = document.querySelector('.theme-toggle');
themeToggle.addEventListener('click', () => {
  document.body.setAttribute('data-theme', 
    document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'
  );
  themeToggle.textContent = document.body.getAttribute('data-theme') === 'dark' ? '🌞' : '🌒';
});

// Initialize on page load
window.onload = initVosk;