// ui-manager.js - UI state management
import { MESSAGES, UI_CONFIG } from '../utils/constants.js';

export class UIManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    showStatusMessage(message, isSuccess = true, timeout = UI_CONFIG.MESSAGE_TIMEOUT) {
        const statusMessage = this.dom.statusMessage;
        if (!statusMessage) return;

        const prefix = isSuccess ? '✅ ' : '❌ ';
        statusMessage.textContent = `${prefix} ${message}`;

        if (timeout !== 0) {
            setTimeout(() => {
                statusMessage.textContent = MESSAGES.WAITING;
            }, timeout);
        }
    }

    hideResults() {
        const singleResult = this.dom.singleResult;
        const dualResults = this.dom.dualResults;

        if (singleResult) singleResult.classList.add('hidden');
        if (dualResults) dualResults.classList.add('hidden');
    }

    disableElements() {
        const elements = this.dom.querySelectorAll('button, input, select');
        elements.forEach(element => {
            element.disabled = true;
        });

        //keep theme toggle enabled
        const themeToggle = this.dom.themeToggle;
        if (themeToggle) themeToggle.disabled = false;
    }

    enableElements() {
        const elements = this.dom.querySelectorAll('button, input, select');
        elements.forEach(element => {
            element.disabled = false;
        });
    }

    showLoadingOverlay() {
        const loadingOverlay = this.dom.loadingOverlay;
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        const loadingOverlay = this.dom.loadingOverlay;
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    updateResultsDisplay(engine, data) {
        const singleResult = this.dom.singleResult;
        const dualResults = this.dom.dualResults;
        const showTimestamps = this.dom.showTimestamps;

        if (engine === 'BOTH') {
            if (singleResult) singleResult.classList.add('hidden');
            if (dualResults) dualResults.classList.remove('hidden');

            //update dual results
            const whisperText = this.dom.get('whisperText');
            const voskText = this.dom.get('voskText');

            if (whisperText) whisperText.innerText = data.whisper || MESSAGES.NO_SPEECH;
            if (voskText) voskText.innerText = data.vosk || MESSAGES.NO_SPEECH;

            //handle timestamps display for dual results
            const whisperOptions = this.dom.querySelector('#dualResults .whisper-options');
            if (whisperOptions) {
                whisperOptions.style.display = showTimestamps?.checked ? 'block' : 'none';
            }

            const singleOptions = this.dom.querySelector('#singleResult .whisper-options');
            if (singleOptions) {
                singleOptions.style.display = 'none';
            }
        } else {
            if (singleResult) singleResult.classList.remove('hidden');
            if (dualResults) dualResults.classList.add('hidden');

            //update single result
            const transcriptionText = this.dom.get('transcriptionText');
            const singleModelName = this.dom.singleModelName;

            if (transcriptionText) transcriptionText.innerText = data || MESSAGES.NO_SPEECH;

            const isWhisper = engine === 'WHISPER';
            if (singleModelName) {
                singleModelName.textContent = isWhisper ? 'WHISPER CPP:' : 'VOSK:';
            }

            //handle timestamps display for single result
            const singleOptions = this.dom.querySelector('#singleResult .whisper-options');
            if (singleOptions) {
                singleOptions.style.display = (isWhisper && showTimestamps?.checked) ? 'block' : 'none';
            }
        }
    }

    setProcessingState() {
        this.disableElements();
        this.showLoadingOverlay();
        this.hideResults();
        const statusMessage = this.dom.statusMessage;
        if (statusMessage) {
            statusMessage.textContent = MESSAGES.PROCESSING;
        }
    }

    setCompletedState() {
        this.enableElements();
        this.hideLoadingOverlay();
        this.showStatusMessage(MESSAGES.COMPLETED);
    }

    setFileReadyState(filename) {
        this.showStatusMessage(`Archivo listo para procesar: ${filename}`, true, 0);
        this.hideResults();
        this.disableElements();
    }
}