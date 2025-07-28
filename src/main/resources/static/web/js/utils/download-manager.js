// download-manager.js - handle file downloads
import { UI_CONFIG } from './constants.js';

export class DownloadManager {
    constructor(domElements) {
        this.dom = domElements;
    }

    downloadTextFile(elementId, filename) {
        const element = this.dom.get(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            return;
        }

        const text = element.innerText;
        this.downloadFile(text, filename);
    }

    downloadBothTranscriptions() {
        const whisperText = this.dom.get('whisperText')?.innerText || '';
        const voskText = this.dom.get('voskText')?.innerText || '';

        const combinedText = `WHISPER TRANSCRIPTION:\n${whisperText}\n\nVOSK TRANSCRIPTION:\n${voskText}`;
        this.downloadFile(combinedText, 'ambas-transcripciones.txt');
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, UI_CONFIG.DOWNLOAD_CLEANUP_DELAY);
    }
}