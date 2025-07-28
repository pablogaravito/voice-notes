// audio-recorder.js - handle audio recording
import { AUDIO_CONFIG, ICONS, MESSAGES } from '../utils/constants.js';

export class AudioRecorder {
    constructor(domElements, uiManager, transcriptionService) {
        this.dom = domElements;
        this.ui = uiManager;
        this.transcriptionService = transcriptionService;

        this.audioContext = null;
        this.mediaRecorder = null;
        this.analyser = null;
        this.dataArray = null;
        this.canvasContext = null;
        this.animationFrame = null;
        this.recordedChunks = [];
    }

    async startRecording() {
        try {
            //initialize audio context if not present
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.canvasContext = this.dom.audioVisualizer?.getContext('2d');

                if (this.dom.audioVisualizer) {
                    this.dom.audioVisualizer.width = this.dom.audioVisualizer.offsetWidth;
                    this.dom.audioVisualizer.height = this.dom.audioVisualizer.offsetHeight;
                }
            }

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.setupAudioVisualization(stream);
            this.setupMediaRecorder(stream);

            this.mediaRecorder.start(AUDIO_CONFIG.RECORDING_TIMESLICE);
            this.updateRecordingUI();

        } catch (error) {
            console.error('Error al acceder al micrófono:', error);
            this.ui.showStatusMessage(`Error: ${error.message}`, false);
        }
    }

    setupAudioVisualization(stream) {
        this.clearVisualization();

        setTimeout(() => {
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.audioContext.createMediaStreamSource(stream).connect(this.analyser);
                this.analyser.fftSize = AUDIO_CONFIG.FFT_SIZE;

                const bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Uint8Array(bufferLength);

                this.canvasContext = this.dom.audioVisualizer?.getContext('2d');

                if (this.dom.audioVisualizer) {
                    this.dom.audioVisualizer.width = this.dom.audioVisualizer.offsetWidth;
                    this.dom.audioVisualizer.height = this.dom.audioVisualizer.offsetHeight;
                }

                this.drawVisualization();
            }
        }, AUDIO_CONFIG.VISUALIZATION_DELAY);
    }

    drawVisualization() {
        this.animationFrame = requestAnimationFrame(() => this.drawVisualization());

        if (this.dom.audioVisualizer?.classList.contains('resetting')) {
            return;
        }

        if (!this.analyser || !this.dataArray || !this.canvasContext) {
            return;
        }

        this.analyser.getByteFrequencyData(this.dataArray);

        this.canvasContext.fillStyle = 'rgb(200, 200, 200)';
        this.canvasContext.fillRect(0, 0, this.dom.audioVisualizer.width, this.dom.audioVisualizer.height);

        const barWidth = (this.dom.audioVisualizer.width / this.dataArray.length) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < this.dataArray.length; i++) {
            barHeight = (this.dataArray[i] / 255) * this.dom.audioVisualizer.height;

            this.canvasContext.fillStyle = `rgb(${Math.min(255, barHeight * 2 + 100)}, 50, 50)`;
            this.canvasContext.fillRect(x, this.dom.audioVisualizer.height - barHeight, barWidth, barHeight);

            x += barWidth + 1;
        }
    }

    setupMediaRecorder(stream) {
        this.mediaRecorder = new MediaRecorder(stream);
        this.recordedChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
            this.recordedChunks.push(event.data);
        };

        this.mediaRecorder.onstop = async () => {
            this.clearVisualization();
            const audioBlob = new Blob(this.recordedChunks);

            try {
                await this.transcriptionService.transcribeBlob(audioBlob);
            } catch (error) {
                this.ui.showStatusMessage(`Error: ${error.message}`, false);
                this.ui.enableElements();
                this.ui.hideLoadingOverlay();
            }
        };
    }

    updateRecordingUI() {
        const recordButton = this.dom.recordButton;
        if (!recordButton) return;

        recordButton.innerHTML = ICONS.STOP_RECORDING;
        recordButton.classList.add('recording');
        this.ui.showStatusMessage(MESSAGES.RECORDING, true, 0);
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();

            //stop all tracks
            if (this.mediaRecorder.stream) {
                this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }

            this.updateStoppedUI();
        }
    }

    updateStoppedUI() {
        const recordButton = this.dom.recordButton;
        if (!recordButton) return;

        recordButton.innerHTML = ICONS.MICROPHONE;
        recordButton.classList.remove('recording');
    }

    clearVisualization() {
        const visualizer = this.dom.audioVisualizer;
        if (!visualizer) return;

        visualizer.classList.add('resetting');

        //cancel the animation
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.canvasContext) {
            let fadeAnimationFrame = null;
            let fadeOpacity = 1;
            const fadeStep = 0.05;

            const fadeOut = () => {
                fadeOpacity -= fadeStep;

                if (fadeOpacity <= 0) {
                    //fade complete, clean up
                    if (fadeAnimationFrame) {
                        cancelAnimationFrame(fadeAnimationFrame);
                        fadeAnimationFrame = null;
                    }

                    visualizer.classList.remove('resetting');
                    this.canvasContext.clearRect(0, 0, visualizer.width, visualizer.height);
                    this.analyser = null;
                    return;
                }

                this.canvasContext.fillStyle = `rgba(200, 200, 200, ${fadeOpacity * 0.1})`;
                this.canvasContext.globalCompositeOperation = 'destination-out';
                this.canvasContext.fillRect(0, 0, visualizer.width, visualizer.height);
                this.canvasContext.globalCompositeOperation = 'source-over';

                fadeAnimationFrame = requestAnimationFrame(fadeOut);
            };

            fadeOut();
        } else {
            //fallback if no canvas context
            setTimeout(() => {
                visualizer.classList.remove('resetting');
                this.analyser = null;
            }, AUDIO_CONFIG.RESET_ANIMATION_DELAY);
        }
    }

    handleVisibilityChange() {
        if (document.hidden && this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.stopRecording();
        }
    }

    toggleRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.ui.enableElements();
            this.stopRecording();
        } else {
            this.startRecording();
            this.ui.disableElements();
            if (this.dom.recordButton) {
                this.dom.recordButton.disabled = false;
            }
        }
    }

    init() {
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }
}
