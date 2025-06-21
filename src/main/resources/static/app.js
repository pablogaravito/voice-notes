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
  const uploadContainer = document.getElementById('uploadContainer');
  const showTimestamps = document.getElementById('showTimestamps');

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

  const COPY_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
    </svg>
  `;

  const COPY_SUCCESS_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0 1 18 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
    </svg>
  `;

  const COPY_FAIL_ICON = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      </svg>
  `;

  const STANDBY_MSG = 'Esperando acción del usuario...';

        const SUPPORTED_AUDIO_EXTENSIONS = [
            // Pure audio formats
            'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus',
            'aiff', 'aif', 'au', 'ra', '3gp', 'amr', 'ac3', 'dts', 'mp2',
            // Video containers that often contain audio
            'mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'wmv', 'asf', 'vob'
        ];

        // MIME types for additional validation
        const SUPPORTED_MIME_TYPES = [
            // Audio MIME types
            'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav',
            'audio/flac', 'audio/aac', 'audio/ogg', 'audio/vorbis',
            'audio/opus', 'audio/x-ms-wma', 'audio/m4a', 'audio/x-m4a',
            'audio/aiff', 'audio/x-aiff', 'audio/basic', 'audio/x-realaudio',
            'audio/3gpp', 'audio/amr', 'audio/ac3', 'audio/mp2',
            // Video MIME types (for containers with audio)
            'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
            'video/webm', 'video/x-ms-wmv', 'video/x-ms-asf', 'video/dvd'
        ];

  let mediaRecorder;
  let audioChunks = [];
  let audioContext;
  let analyser;
  let dataArray;
  let canvasCtx;
  let animationId;

  // File input change handler
  audioUpload.addEventListener('change', handleFileSelect);

  // Drag and drop handlers
  uploadContainer.addEventListener('dragover', handleDragOver);
  uploadContainer.addEventListener('dragleave', handleDragLeave);
  uploadContainer.addEventListener('drop', handleDrop);

		function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                validateAndProcessFile(file);
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            uploadContainer.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            uploadContainer.classList.remove('dragover');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                validateAndProcessFile(files[0]);
            }
        }

        function validateAndProcessFile(file) {
            const validation = validateAudioFile(file);

            if (validation.isValid) {
                showStatusMessage(statusMessage, `Archivo listo para procesar: ${file.name}`);
                hideResults();
                disableInputs();
                handleAudioFile(file);
                enableInputs();
            } else {
                showStatusMessage(statusMessage, `Error: ${validation.error}`, false);
            }
        }

        function validateAudioFile(file) {
            // Get file extension
            const extension = file.name.split('.').pop().toLowerCase();

            // Check file size (optional - adjust as needed)
            const maxSize = 500 * 1024 * 1024; // 500MB
            if (file.size > maxSize) {
                return {
                    isValid: false,
                    error: 'El archivo es muy grande. Tamaño máximo: 500 MBs.'
                };
            }

            // Validate by extension
            if (!SUPPORTED_AUDIO_EXTENSIONS.includes(extension)) {
                return {
                    isValid: false,
                    error: `Formato no compatible: .${extension}. Por favor, usa un formato de audio soportado.`
                };
            }

            // Validate by MIME type (if available)
            if (file.type && !SUPPORTED_MIME_TYPES.includes(file.type)) {
                // Some browsers might not set MIME type correctly, so this is a soft check
                console.warn('MIME type not in supported list, but extension is valid:', file.type);
            }

            // Additional validation for video containers
            if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(extension)) {
                return {
                    isValid: true,
                    warning: 'Video container detected. FFmpeg will extract audio track.',
                    isVideoContainer: true
                };
            }

            return {
                isValid: true,
                extension: extension
            };
        }

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

function setupUIForProcessing() {
    disableInputs();
    showLoading();
    hideResults();
    statusMessage.textContent = 'Procesando audio...';
}

function handleProcessingComplete() {
    enableInputs();
    hideLoading();
    showStatusMessage(statusMessage, 'Transcripción completada.');
}

function showSingleResult() {
	singleResult.classList.remove('hidden');
    dualResults.classList.add('hidden');
}

function showDualResults() {
    singleResult.classList.add('hidden');
    dualResults.classList.remove('hidden');
}

async function handleTranscriptionResponse(response) {
    if (engineSelect.value === "BOTH") {
        // Parse JSON response for dual engines
        const results = await response.json();
        showDualResults();

        // Show Whisper checkbox ONLY if "Generar timestamps" is checked
        document.querySelector('#dualResults .whisper-options').style.display =
            showTimestamps.checked ? 'block' : 'none';
        document.querySelector('#singleResult .whisper-options').style.display = 'none';

        document.getElementById('whisperText').innerText = results.whisper || "(No se detectó habla)";
        document.getElementById('voskText').innerText = results.vosk || "(No se detectó habla)";
    } else {
        const resultText = await response.text();
        showSingleResult();

        const isWhisper = engineSelect.value === "WHISPER";
        const whisperOptions = document.querySelector('#singleResult .whisper-options');
        whisperOptions.style.display = (isWhisper && showTimestamps.checked) ? 'block' : 'none';

        singleModelName.textContent = isWhisper ? "WHISPER CPP:" : "VOSK:";
        document.getElementById('transcriptionText').innerText = resultText || "(No se detectó habla)";
    }
}

function createTranscriptionUrl(endpoint) {
    const url = new URL(endpoint, window.location.origin);
    url.search = new URLSearchParams({
        engine: engineSelect.value,
        timestamps: showTimestamps.checked
    });
    return url;
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
            const audioBlob = new Blob(audioChunks);

            setupUIForProcessing();
            try {
                const url = createTranscriptionUrl('/api/audio/transcribe');
                const response = await fetch(url, {
                    method: "POST",
                    body: audioBlob,
                    headers: {
                        "Content-Type": audioBlob.type,
                        Accept: "application/json"
                    }
                });
                await handleTranscriptionResponse(response);
                handleProcessingComplete();
            } catch (error) {
                showStatusMessage(statusMessage, `Error: ${error.message}`, false);
                enableInputs();
                hideLoading();
            }
        };

        mediaRecorder.start(100); // Collect data every 100ms

        // Update UI
        recordButton.innerHTML = `${STOP_RECORD_ICON} Detener Grabación`;
        recordButton.classList.add("recording");
        statusMessage.textContent = "Grabando... Habla ahora";
    } catch (error) {
        console.error("Error al acceder al micrófono:", error);
        showStatusMessage(statusMessage, `Error: ${error.message}`, false);
    }
}

  // Stop recording
  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());

      // Update UI
      recordButton.innerHTML = `${RECORD_ICON} Comenzar Grabación`;
      recordButton.classList.remove("recording");
    }
  }

  uploadButton.addEventListener('click', () => {
      audioUpload.click();
  });

  async function handleAudioFile(file) {
     setupUIForProcessing();
      try {
          const formData = new FormData();
          formData.append('file', file);

          const url = createTranscriptionUrl('/api/audio/transcribe-file');
          const response = await fetch(url, {
             method: 'POST',
             body: formData,
             headers: {
                'Accept': 'application/json'
             }
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
          await handleTranscriptionResponse(response);
          handleProcessingComplete();

    } catch (error) {
        showStatusMessage(statusMessage, 'Error al procesar el archivo: ' + (error.message || 'Error desconocido'), false);
        enableInputs();
        hideLoading();
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
      enableInputs();
      stopRecording();
    } else {
      startRecording();
      disableInputs();
      recordButton.disabled = false;
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
      let text = document.getElementById(textareaId).innerText;
    // Check if this is a whisper text and checkbox is checked
    if ((textareaId === 'whisperText' || textareaId === 'transcriptionText') &&
        document.getElementById('whisperPostProcess').checked) {
        console.log(text);
        text = removeTimestamps(text);
        console.log(text);
    }

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
      let text1 = document.getElementById('whisperText').innerText;
    if (document.getElementById('whisperPostProcess').checked) {
        text1 = removeTimestamps(text1);
    }
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
  }

  function hideLoading() {
      document.getElementById('loadingOverlay').style.display = 'none';
  }

  function showStatusMessage(element, message, isSuccess = true, duration = 3000) {
      // Set the message with appropriate emoji
      element.textContent = `${isSuccess ? '✅ ' : '❌ '} ${message}`;

      // Return to standby after duration
      setTimeout(() => {
          element.textContent = STANDBY_MSG;
      }, duration);
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

  function disableInputs() {
    document.querySelectorAll('button, input, select').forEach(element => {
        element.disabled = true;
    });
    themeToggle.disabled = false;
  }

  function enableInputs() {
    document.querySelectorAll('button, input, select').forEach(element => {
        element.disabled = false;
    });
  }

  function removeTimestamps(text) {
    // This regex matches timestamps like [00:00-00:10] including the brackets
    const timestampRegex = /\[\d{2}:\d{2}-\d{2}:\d{2}\]/g;

    // Replace all timestamps with empty string
    const cleanText = text.replace(timestampRegex, '').trim();

    // Clean up any leftover spaces or line breaks caused by the removal
    return cleanText.replace(/\s+/g, ' ').replace(/\s+([,.!?])/g, '$1');
  }

  async function copyEditableContent(targetId) {
    const div = document.getElementById(targetId);
    if (!div) {
      console.error(`Element with ID ${targetId} not found`);
      return false;
    }

    let text = div.textContent;

    // Check if this is a whisper text and checkbox is checked
    if ((targetId === 'whisperText' || targetId === 'transcriptionText') &&
       document.getElementById('whisperPostProcess').checked) {
       console.log(text);
       text = removeTimestamps(text);
       console.log(text);
    }

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      return true;
    } catch (err) {
      console.error('Copy failed:', err);
      return false;
    }
  }

    // Initialize theme
    setTheme(currentTheme);

    // Toggle theme on button click
    themeToggle.addEventListener('click', () => {
        const activeTheme = document.documentElement.getAttribute('data-theme');
        setTheme(activeTheme === 'dark' ? 'light' : 'dark');
    });

    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const targetId = button.getAttribute('data-target');
        const success = await copyEditableContent(targetId);

        // Provide user feedback
        if (success) {
          button.classList.add('success');
          button.innerHTML = COPY_SUCCESS_ICON;
          showStatusMessage(statusMessage, 'Transcripción copiada al portapapeles.');
          setTimeout(() => {
            button.classList.remove('success');
            button.innerHTML = COPY_ICON;
          }, 3000);
        } else {
          button.classList.add('error');
          showStatusMessage(statusMessage, 'No se pudo copiar la transcripción al portapapeles!', false);
          button.innerHTML = COPY_FAIL_ICON;
          setTimeout(() => {
            button.classList.remove('error');
            button.innerHTML = COPY_ICON;
          }, 3000);
        }
      });
    });
});
