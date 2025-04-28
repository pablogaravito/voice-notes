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
    if (!analyser) {
      analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      const bufferLength = analyser.frequencyBinCount;
      dataArray = new Uint8Array(bufferLength);

      // Set up canvas properly
      canvasCtx = audioVisualizer.getContext("2d");
      audioVisualizer.width = audioVisualizer.offsetWidth;
      audioVisualizer.height = audioVisualizer.offsetHeight;

      function draw() {
        animationId = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = "rgb(200, 200, 200)";
        canvasCtx.fillRect(0, 0, audioVisualizer.width, audioVisualizer.height);

        const barWidth = (audioVisualizer.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * audioVisualizer.height;

          canvasCtx.fillStyle = `rgb(${Math.min(
            255,
            barHeight * 2 + 100
          )}, 50, 50)`;
          canvasCtx.fillRect(
            x,
            audioVisualizer.height - barHeight,
            barWidth,
            barHeight
          );

          x += barWidth + 1;
        }
      }

      draw();
    }
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
        await processAudio();
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
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, audioVisualizer.width, audioVisualizer.height);
      // Draw a blank state
      //            canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      //            canvasCtx.fillRect(0, 0, audioVisualizer.width, audioVisualizer.height);}
      canvasCtx = audioVisualizer.getContext("2d");
    }
    analyser = null;
  }

  // Process recorded audio
  async function processAudio() {
    try {
      const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

      // Convert to 16kHz mono PCM for Vosk
      const convertedAudio = await convertAudioForVosk(audioBlob);

      // Send to Spring Boot backend
      const response = await fetch("/api/audio/recognize", {
        method: "POST",
        body: convertedAudio,
        headers: {
          "Content-Type": "application/octet-stream",
          Accept: "text/plain; charset=utf-8",
        },
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }

      const text = await response.text();
      const decodedText = new TextDecoder("utf-8").decode(
        new TextEncoder().encode(text)
      );

      // Display results
      transcriptionText.textContent = decodedText || "(No se detectó habla)";
      resultDiv.classList.remove("hidden");
      statusMessage.textContent = "Transcripción completada";
    } catch (error) {
      console.error("Error en el reconocimiento:", error);
      statusMessage.textContent = `Error: ${error.message}`;
    }
  }

  // Convert audio to Vosk-compatible format (16kHz mono PCM)
  async function convertAudioForVosk(blob) {
    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)({ sampleRate: 16000 });
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Create offline context for processing
      const offlineCtx = new OfflineAudioContext({
        numberOfChannels: 1,
        length: audioBuffer.length,
        sampleRate: 16000,
      });

      // Create mono source
      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      // Connect to destination (automatically mixes to mono)
      source.connect(offlineCtx.destination);

      // Render to new buffer
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();

      // Convert to WAV format
      const wavBuffer = audioBufferToWav(renderedBuffer);
      return new Blob([wavBuffer], { type: "audio/wav" });
    } catch (error) {
      console.error("Error converting audio:", error);
      // Fallback to original blob if conversion fails
      return blob;
    }
  }

  // Helper function to convert AudioBuffer to WAV
  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;

    const interleaved = new Float32Array(length * numChannels);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        interleaved[i * numChannels + channel] = channelData[i];
      }
    }

    const bufferBytes = new ArrayBuffer(44 + interleaved.length * 2);
    const view = new DataView(bufferBytes);

    // Write WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + interleaved.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, interleaved.length * 2, true);

    // Write PCM samples
    const volume = 1;
    let index = 44;
    for (let i = 0; i < interleaved.length; i++) {
      view.setInt16(index, interleaved[i] * (0x7fff * volume), true);
      index += 2;
    }

    return bufferBytes;
  }

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
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
