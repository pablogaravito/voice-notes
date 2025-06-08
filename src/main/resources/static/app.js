document.addEventListener("DOMContentLoaded", function () {
  const recordButton = document.getElementById("recordButton");
  const statusMessage = document.getElementById("statusMessage");
  const resultDiv = document.getElementById("result");
  const transcriptionText = document.getElementById("transcriptionText");
  const audioVisualizer = document.getElementById("audioVisualizer");
  const engineSelect = document.getElementById('engineSelect');
  const singleResult = document.getElementById('singleResult');
  const dualResults = document.getElementById('dualResults');
  const singleModelName = document.getElementById('singleModelName');
  const uploadButton = document.getElementById('uploadButton');
  const audioUpload = document.getElementById('audioUpload');
  const downloadTextButton = document.getElementById('downloadText');
  const downloadVoskTextButton = document.getElementById('downloadVoskText');
  const downloadWhisperTextButton = document.getElementById('downloadWhisperText');
  const downloadBothTextButton = document.getElementById('downloadBothText');
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  const DARK_ICON = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
      </svg>
  `;

  const LIGHT_ICON = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
      </svg>
  `;

  const RECORD_ICON = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
  `;

  const STOP_RECORD_ICON = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
      </svg>
  `;

  let mediaRecorder;
  let audioChunks = [];
  let audioContext;
  let analyser;
  let dataArray;
  let canvasCtx;
  let animationId;

  // Set up audio context when user interacts first (to avoid browser restrictions)
  function setupAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Set up visualizer
      canvasCtx = audioVisualizer.getContext("2d");
      audioVisualizer.width = audioVisualizer.offsetWidth;
      audioVisualizer.height = audioVisualizer.offsetHeight;
    }
  }

  // Visualize audio
  function visualize(stream) {
    stopVisualization();
    setTimeout(() => {
            if (!analyser) {
                analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                analyser.fftSize = 256;

                const bufferLength = analyser.frequencyBinCount;
                dataArray = new Uint8Array(bufferLength);

                // Set up canvas
                canvasCtx = audioVisualizer.getContext('2d');
                audioVisualizer.width = audioVisualizer.offsetWidth;
                audioVisualizer.height = audioVisualizer.offsetHeight;

                function draw() {
                    animationId = requestAnimationFrame(draw);

                    // Skip if canvas is resetting
                    if (audioVisualizer.classList.contains('resetting')) return;

                    analyser.getByteFrequencyData(dataArray);

                    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
                    canvasCtx.fillRect(0, 0, audioVisualizer.width, audioVisualizer.height);

                    const barWidth = (audioVisualizer.width / bufferLength) * 2.5;
                    let x = 0;

                    for (let i = 0; i < bufferLength; i++) {
                        const barHeight = (dataArray[i] / 255) * audioVisualizer.height;

                        canvasCtx.fillStyle = `rgb(${Math.min(255, barHeight * 2 + 100)}, 50, 50)`;
                        canvasCtx.fillRect(x, audioVisualizer.height - barHeight, barWidth, barHeight);

                        x += barWidth + 1;
                    }
                }

                draw();
            }
        }, 300);
  }

  // Start recording
  async function startRecording() {
    try {
      setupAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      visualize(stream);

      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
      	stopVisualization();

          // Create Blob without specifying type - use what the recorder actually produced
          const audioBlob = new Blob(audioChunks);
        showLoading();
          const url = new URL('/api/audio/transcribe', window.location.origin);
          url.search = new URLSearchParams({
              engine: engineSelect.value,
              timestamps: document.getElementById('showTimestamps').checked
          });

      	const response = await fetch(url, {
              method: "POST",
              body: audioBlob,
              headers: {
                      "Content-Type": audioBlob.type,
                      Accept: "application/json"
                  }
          });
          statusMessage.textContent = 'Transcripción completada.';
          hideLoading();
            if (engineSelect.value === "BOTH") {
                // Parse JSON response for dual engines
                const results = await response.json();
                singleResult.classList.add('hidden');
                dualResults.classList.remove('hidden');
                document.getElementById('whisperText').innerText = results.whisper || "(No se detectó habla)";
                document.getElementById('voskText').innerText = results.vosk || "(No se detectó habla)";
            } else {
                singleModelName.textContent = engineSelect.value === "VOSK" ? "VOSK:" : "WHISPER CPP:";
                const resultText = await response.text();
                singleResult.classList.remove('hidden');
                dualResults.classList.add('hidden');
                document.getElementById('transcriptionText').innerText = resultText || "(No se detectó habla)";
            };
        }

      mediaRecorder.start(100); // Collect data every 100ms

      // Update UI
      hideResults();
      recordButton.innerHTML = `${STOP_RECORD_ICON} Detener Grabación`;
      recordButton.classList.add("recording");
      statusMessage.textContent = "Grabando... Habla ahora";
      //resultDiv.classList.add("hidden");
    } catch (error) {
      console.error("Error al acceder al micrófono:", error);
      statusMessage.textContent = `Error: ${error.message}`;
    }
  }

  // Stop recording
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();

      // Stop all tracks
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());

      // Update UI
      recordButton.innerHTML = `${RECORD_ICON} Comenzar Grabación`;
      recordButton.classList.remove("recording");
      statusMessage.textContent = "Procesando audio...";
    }
  }

  uploadButton.addEventListener('click', () => {
      audioUpload.click();
  });

  audioUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
          // Validate file type
          const validTypes = [
              'audio/mpeg',          // .mp3
              'audio/ogg',           // .ogg
              'audio/wav',           // .wav
              'audio/flac',          // .flac
              'audio/x-m4a',         // .m4a
              'audio/aac',           // .aac
              'audio/webm',          // .webm
              'audio/aiff',          // .aiff
              'audio/amr',           // .amr
              'audio/x-ms-wma',      // .wma
              'audio/mp4',           // .mp4 (audio)
              'audio/x-aiff',        // alternative for aiff
              'audio/x-wav'          // alternative for wav
          ];

//          if (!validTypes.includes(file.type)) {
//              fileInfo.textContent = 'Formato no soportado.';
//              return;
//          }

          //fileInfo.textContent = `Archivo seleccionado: ${file.name}`;

          // Here you would handle the file upload to your backend
          hideResults();
          handleAudioFile(file);
      }
  });

  async function handleAudioFile(file) {
      // Show loading state
      statusMessage.textContent = 'Procesando archivo de audio...';

    showLoading();
      try {
          const formData = new FormData();
          formData.append('file', file);

          const url = new URL('/api/audio/transcribe-file', window.location.origin);
          url.search = new URLSearchParams({
                        engine: engineSelect.value,
                        timestamps: document.getElementById('showTimestamps').checked
          });

          const response = await fetch(url, {
              method: 'POST',
              body: formData,
              headers: {
                  'Accept': 'application/json'
              }
          });

          if (!response.ok) {
              const errorText = await response.text();
              console.error('Server responded with:', errorText);
              throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
        hideLoading();
        statusMessage.textContent = 'Transcripción completada.';
          if (engineSelect.value === "BOTH") {
          // Parse JSON response for dual engines
              const results = await response.json();
              singleResult.classList.add('hidden');
              dualResults.classList.remove('hidden');
              document.getElementById('whisperText').innerText = results.whisper || "(No se detectó habla)";
              document.getElementById('voskText').innerText = results.vosk || "(No se detectó habla)";
          } else {
              singleModelName.textContent = engineSelect.value === "VOSK" ? "VOSK:" : "WHISPER CPP:";
              const resultText = await response.text();
              singleResult.classList.remove('hidden');
              dualResults.classList.add('hidden');
              document.getElementById('transcriptionText').innerText = resultText || "(No se detectó habla)";
          };

    } catch (error) {
        console.error('Full error details:', error);
        statusMessage.textContent = 'Error al procesar el archivo: ' +
            (error.message || 'Error desconocido');
    }
  }

  // Stop visualization
  function stopVisualization() {
  audioVisualizer.classList.add('resetting');
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (canvasCtx) {
            // Smooth clear with fade
            const fadeOut = () => {
                canvasCtx.fillStyle = 'rgba(200, 200, 200, 0.1)';
                canvasCtx.globalCompositeOperation = 'destination-out';
                canvasCtx.fillRect(0, 0, audioVisualizer.width, audioVisualizer.height);
                canvasCtx.globalCompositeOperation = 'source-over';

                if (animationId) {
                    requestAnimationFrame(fadeOut);
                }
            };
            fadeOut();

            // Remove resetting class after animation
            setTimeout(() => {
                audioVisualizer.classList.remove('resetting');
                canvasCtx.clearRect(0, 0, audioVisualizer.width, audioVisualizer.height);

                // Full reset of canvas context
                canvasCtx = null;
                canvasCtx = audioVisualizer.getContext('2d');
            }, 300); // Matches the CSS transition duration
        }

        // Reset analyser
        analyser = null;

  }

  // Event listeners
  recordButton.addEventListener("click", function () {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  });

  // Handle visibility changes
  document.addEventListener("visibilitychange", function () {
    if (
      document.hidden &&
      mediaRecorder &&
      mediaRecorder.state === "recording"
    ) {
      stopRecording();
    }
  });

  downloadTextButton.addEventListener('click', () => {
    downloadTextAsFile('transcriptionText', 'transcripción.txt');
  });

  downloadVoskTextButton.addEventListener('click', () => {
    downloadTextAsFile('voskText', 'transcripción-vosk.txt');
  });

  downloadWhisperTextButton.addEventListener('click', () => {
    downloadTextAsFile('whisperText', 'transcripción-whisper.txt');
  });

  downloadBothTextButton.addEventListener('click', () => {
    downloadCombinedTextAsFile();
  });


  function downloadTextAsFile(textareaId, filename) {
      const text = document.getElementById(textareaId).innerText;
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 100);
  }

  function downloadCombinedTextAsFile() {
      const text1 = document.getElementById('whisperText').innerText;
      const text2 = document.getElementById('voskText').innerText;

      // Using template literals for clean multiline string
      const combinedText = `TRANSCRIPCIÓN WHISPER:\n${text1}\n\nTRANSCRIPCIÓN VOSK:\n${text2}`;

      const blob = new Blob([combinedText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'ambas-transcripciones.txt';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }, 100);
  }

  function showLoading() {
      document.getElementById('loadingOverlay').style.display = 'flex';
      // Disable all buttons and inputs
      document.querySelectorAll('button, input, select').forEach(element => {
          element.disabled = true;
      });
  }

  // Function to hide loading overlay
  function hideLoading() {
      document.getElementById('loadingOverlay').style.display = 'none';
      // Enable all buttons and inputs
      document.querySelectorAll('button, input, select').forEach(element => {
          element.disabled = false;
      });
  }

  const currentTheme = localStorage.getItem('theme') ||
                       (prefersDarkScheme.matches ? 'dark' : 'light');

  function setTheme(theme) {
      if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          themeToggle.innerHTML = `${LIGHT_ICON} Light Mode`;
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.removeAttribute('data-theme');
          themeToggle.innerHTML = `${DARK_ICON} Dark Mode`;
          localStorage.setItem('theme', 'light');
      }
  }

  function hideResults() {
    dualResults.classList.add('hidden');
    singleResult.classList.add('hidden');
  }

    // Initialize theme
    setTheme(currentTheme);

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        setTheme(activeTheme === 'dark' ? 'light' : 'dark');
    });
});
