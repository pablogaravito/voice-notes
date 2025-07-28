// transcription-service.js - handle transcription API calls
import { ENGINES } from '../utils/constants.js';

export class TranscriptionService {
    constructor(domElements, uiManager) {
        this.dom = domElements;
        this.ui = uiManager;
    }

    buildApiUrl(endpoint) {
        const url = new URL(endpoint, window.location.origin);
        const engineSelect = this.dom.engineSelect;
        const showTimestamps = this.dom.showTimestamps;

        if (engineSelect) {
            url.searchParams.set('engine', engineSelect.value);
        }

        if (showTimestamps) {
            url.searchParams.set('timestamps', showTimestamps.checked);
        }

        return url;
    }

    async transcribeFile(file) {
        this.ui.setProcessingState();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const url = this.buildApiUrl('/api/audio/transcribe-file');
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

            await this.handleResponse(response);
            this.ui.setCompletedState();

        } catch (error) {
            throw new Error(error.message || 'Error desconocido');
        }
    }

    async transcribeBlob(audioBlob) {
        this.ui.setProcessingState();

        try {
            const url = this.buildApiUrl('/api/audio/transcribe');
            const response = await fetch(url, {
                method: 'POST',
                body: audioBlob,
                headers: {
                    'Content-Type': audioBlob.type,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }

            await this.handleResponse(response);
            this.ui.setCompletedState();

        } catch (error) {
            throw new Error(error.message || 'Error desconocido');
        }
    }

    async handleResponse(response) {
        const engineSelect = this.dom.engineSelect;
        const engine = engineSelect?.value || ENGINES.WHISPER;

        if (engine === ENGINES.BOTH) {
            const data = await response.json();
            this.ui.updateResultsDisplay(engine, data);
        } else {
            const text = await response.text();
            this.ui.updateResultsDisplay(engine, text);
        }
    }
}