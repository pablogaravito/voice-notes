document.addEventListener("DOMContentLoaded", function () {
  const recordButton = document.getElementById("recordButton");
  const statusMessage = document.getElementById("statusMessage");
  const resultDiv = document.getElementById("result");
  const transcriptionText = document.getElementById("transcriptionText");
  const audioVisualizer = document.getElementById("audioVisualizer");

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

          // Include the actual MIME type in the request so your backend knows what format it received
      	const response = await fetch("/api/audio/recognize", {
              method: "POST",
              body: audioBlob,
              headers: {
                  "Content-Type": audioBlob.type,
      			Accept: "text/plain; charset=utf-8"
              }
          });
          const resultText = await response.text();
          transcriptionText.textContent = resultText || "(No se detectó habla)";
          statusMessage.textContent = "Transcripción completada";
          resultDiv.classList.remove("hidden");
      };

      mediaRecorder.start(100); // Collect data every 100ms

      // Update UI
      recordButton.textContent = "Detener Grabación";
      recordButton.classList.add("recording");
      statusMessage.textContent = "Grabando... Habla ahora";
      resultDiv.classList.add("hidden");
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
      recordButton.textContent = "Comenzar Grabación";
      recordButton.classList.remove("recording");
      statusMessage.textContent = "Procesando audio...";
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
});
