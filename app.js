let audioContext;
let mediaStream;
let mediaRecorder;
let audioChunks = [];

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resultText = document.getElementById('resultText');

startBtn.onclick = async () => {
  startBtn.disabled = true;
  stopBtn.disabled = false;

  audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });

  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(mediaStream);

  const processor = audioContext.createScriptProcessor(4096, 1, 1);
  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (e) => {
    const input = e.inputBuffer.getChannelData(0);
    const buffer = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      buffer[i] = Math.max(-1, Math.min(1, input[i])) * 0x7FFF;
    }
    audioChunks.push(buffer);
  };

  window._processor = processor; // save to stop later
};

stopBtn.onclick = async () => {
  startBtn.disabled = false;
  stopBtn.disabled = true;

  window._processor.disconnect();
  mediaStream.getTracks().forEach(track => track.stop());

  const wavBlob = encodeWAV(audioChunks, 16000);
  audioChunks = [];

  const arrayBuffer = await wavBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);

  const response = await fetch('http://localhost:8080/transcribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    body: recordedBlob
  });

  const resultJson = await response.json();
  resultText.value = resultJson.text || 'No se pudo transcribir';
};

function encodeWAV(chunks, sampleRate) {
  const bufferLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const buffer = new ArrayBuffer(44 + bufferLength * 2);
  const view = new DataView(buffer);

  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + bufferLength * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, bufferLength * 2, true);

  let offset = 44;
  for (const chunk of chunks) {
    for (let i = 0; i < chunk.length; i++) {
      view.setInt16(offset, chunk[i], true);
      offset += 2;
    }
  }

  return new Blob([view], { type: 'audio/wav' });
}