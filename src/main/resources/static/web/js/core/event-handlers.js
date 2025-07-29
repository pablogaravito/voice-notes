// event-handlers.js - central event handler setup
export class EventHandlers {
    constructor({
        domElements,
        themeManager,
        uiManager,
        fileHandler,
        audioRecorder,
        downloadManager,
        copyManager
    }) {
        this.dom = domElements;
        this.themeManager = themeManager;
        this.ui = uiManager;
        this.fileHandler = fileHandler;
        this.audioRecorder = audioRecorder;
        this.downloadManager = downloadManager;
        this.copyManager = copyManager;
    }

    setupRecordingHandlers() {
        const recordButton = this.dom.recordButton;

        if (recordButton) {
            recordButton.addEventListener('click', () => {
                this.audioRecorder.toggleRecording();
            });
        }

        //handle visibility change to stop recording when tab is hidden
        document.addEventListener('visibilitychange', () => {
            this.audioRecorder.handleVisibilityChange();
        });
    }

    setupFileHandlers() {
        //file input change handler
        const audioUpload = this.dom.audioUpload;
        if (audioUpload) {
            audioUpload.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.fileHandler.processFile(file);
                }
            });
        }

        //upload button click handler
        const uploadButton = this.dom.uploadButton;
        if (uploadButton && audioUpload) {
            uploadButton.addEventListener('click', () => {
                audioUpload.click();
            });
        }

        //drag and drop handlers
        const uploadContainer = this.dom.uploadContainer;
        if (uploadContainer) {
            uploadContainer.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadContainer.classList.add('dragover');
            });

            uploadContainer.addEventListener('dragleave', (e) => {
                e.preventDefault();
                uploadContainer.classList.remove('dragover');
            });

            uploadContainer.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadContainer.classList.remove('dragover');

                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.fileHandler.processFile(files[0]);
                }
            });
        }
    }

    setupThemeHandlers() {
        const themeToggle = this.dom.themeToggle;

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.themeManager.toggleTheme();
            });
        }
    }

    setupDownloadHandlers() {
        //single transcription download
        const downloadText = this.dom.get('downloadText');
        if (downloadText) {
            downloadText.addEventListener('click', () => {
                this.downloadManager.downloadTextFile('transcriptionText', 'transcripción.txt');
            });
        }

        //Vosk transcription download
        const downloadVoskText = this.dom.get('downloadVoskText');
        if (downloadVoskText) {
            downloadVoskText.addEventListener('click', () => {
                this.downloadManager.downloadTextFile('voskText', 'transcripción-vosk.txt');
            });
        }

        //Whisper transcription download
        const downloadWhisperText = this.dom.get('downloadWhisperText');
        if (downloadWhisperText) {
            downloadWhisperText.addEventListener('click', () => {
                this.downloadManager.downloadTextFile('whisperText', 'transcripción-whisper.txt');
            });
        }

        //Both transcriptions download
        const downloadBothText = this.dom.get('downloadBothText');
        if (downloadBothText) {
            downloadBothText.addEventListener('click', () => {
                this.downloadManager.downloadBothTranscriptions();
            });
        }
    }

    setupCopyHandlers() {
        const copyButtons = this.dom.querySelectorAll('.copy-btn');

        copyButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const targetId = button.getAttribute('data-target');
                const success = await this.copyManager.copyToClipboard(targetId);
                this.copyManager.updateCopyButtonState(button, success);
            });
        });
    }

    setupEngineChangeHandlers() {
        const engineSelect = this.dom.engineSelect;

        if (engineSelect) {
            engineSelect.addEventListener('change', () => {
                this.ui.hideResults();
                const showTimestamps = this.dom.showTimestamps;
                const label = showTimestamps.parentElement;

                if (engineSelect.value === 'VOSK') {
                    showTimestamps.disabled = true;
                    showTimestamps.checked = false;
                    label.classList.add('disabled');
                } else {
                    showTimestamps.disabled = false;
                    label.classList.remove('disabled');
                }
            });
        }
    }

    setupTimestampHandlers() {
        const showTimestamps = this.dom.showTimestamps;

        if (showTimestamps) {
            showTimestamps.addEventListener('change', () => {
                //update visibility of timestamp options when checkbox changes
                const singleOptions = this.dom.querySelector('#singleResult .whisper-options');
                const dualOptions = this.dom.querySelector('#dualResults .whisper-options');
                const engineSelect = this.dom.engineSelect;

                const isSingleVisible = this.dom.singleResult &&
                    !this.dom.singleResult.classList.contains('hidden');
                const isDualVisible = this.dom.dualResults &&
                    !this.dom.dualResults.classList.contains('hidden');
                const isWhisperEngine = engineSelect?.value === 'WHISPER';

                if (singleOptions && isSingleVisible) {
                    singleOptions.style.display = (isWhisperEngine && showTimestamps.checked) ? 'block' : 'none';
                }

                if (dualOptions && isDualVisible) {
                    dualOptions.style.display = showTimestamps.checked ? 'block' : 'none';
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            //Space bar to toggle recording (when not focused on input elements)
            if (e.code === 'Space') {
                const target = e.target;
                const tagName = target.tagName?.toLowerCase();

                //check if we're in any editable element
                const isEditable =
                    ['input', 'textarea', 'select'].includes(tagName) ||
                    target.contentEditable === 'true' ||
                    target.getAttribute('role') === 'textbox' ||
                    //check if any parent is contenteditable
                    target.closest('[contenteditable="true"]') !== null;

                if (!isEditable) {
                    e.preventDefault();
                    this.audioRecorder.toggleRecording();
                }
            }

            //Escape to stop recording
            if (e.code === 'Escape') {
                if (this.audioRecorder.mediaRecorder &&
                    this.audioRecorder.mediaRecorder.state === 'recording') {
                    this.audioRecorder.stopRecording();
                }
            }

            //Ctrl + D to download current transcription(s)
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD') {
                e.preventDefault();

                const isSingleVisible = this.dom.singleResult &&
                    !this.dom.singleResult.classList.contains('hidden');
                const isDualVisible = this.dom.dualResults &&
                    !this.dom.dualResults.classList.contains('hidden');

                if (isSingleVisible) {
                    this.downloadManager.downloadTextFile('transcriptionText', 'transcripción.txt');
                } else if (isDualVisible) {
                    this.downloadManager.downloadBothTranscriptions();
                }
            }
        });
    }

    setupResizeHandlers() {
        window.addEventListener('resize', () => {
            //update canvas dimensions when window is resized
            const audioVisualizer = this.dom.audioVisualizer;
            if (audioVisualizer) {
                audioVisualizer.width = audioVisualizer.offsetWidth;
                audioVisualizer.height = audioVisualizer.offsetHeight;
            }
        });
    }

    setupErrorHandlers() {
        //global error handler for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.ui.showStatusMessage('Error interno de la aplicación', false);
            this.ui.enableElements();
            this.ui.hideLoadingOverlay();
        });

        //global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.ui.showStatusMessage('Error interno de la aplicación', false);
            this.ui.enableElements();
            this.ui.hideLoadingOverlay();
        });
    }

    init() {
        //initialize all event handlers
        this.setupRecordingHandlers();
        this.setupFileHandlers();
        this.setupThemeHandlers();
        this.setupDownloadHandlers();
        this.setupCopyHandlers();
        this.setupEngineChangeHandlers();
        this.setupTimestampHandlers();
        this.setupKeyboardShortcuts();
        this.setupResizeHandlers();
        this.setupErrorHandlers();
    }
}