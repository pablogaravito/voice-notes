// copy-manager.js - handle copy to clipboard functionality
import { ICONS, MESSAGES, UI_CONFIG } from './constants.js';

export class CopyManager {
    constructor(domElements, uiManager) {
        this.dom = domElements;
        this.ui = uiManager;
    }

    shouldRemoveTimestamps(elementId) {
        const isSingleResultVisible = this.dom.singleResult &&
            !this.dom.singleResult.classList.contains('hidden');
        const isDualResultsVisible = this.dom.dualResults &&
            !this.dom.dualResults.classList.contains('hidden');

        if (elementId === 'transcriptionText' && isSingleResultVisible) {
            return this.dom.get('whisperPostProcessSingle')?.checked || false;
        }

        if (elementId === 'whisperText' && isDualResultsVisible) {
            return this.dom.get('whisperPostProcessDual')?.checked || false;
        }

        return false;
    }

    removeTimestamps(text) {
        return text
            .replace(/\[\d{2}:\d{2}-\d{2}:\d{2}\]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/\s+([,.!?])/g, '$1');
    }

    async copyToClipboard(elementId) {
        const element = this.dom.get(elementId);
        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            return false;
        }

        let text = element.innerText;

        //remove timestamps if needed
        if (['whisperText', 'transcriptionText'].includes(elementId) &&
            this.shouldRemoveTimestamps(elementId)) {
            text = this.removeTimestamps(text);
        }

        try {
            //check if we have clipboard API support
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                //fallback for older browsers
                return this.fallbackCopyToClipboard(text);
            }
        } catch (error) {
            console.error('Clipboard API failed, trying fallback:', error);
            //if clipboard API fails, try fallback
            return this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.left = '-999999px';
            textarea.style.top = '-999999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();

            const result = document.execCommand('copy');
            document.body.removeChild(textarea);
            return result;
        } catch (error) {
            console.error('Fallback copy failed:', error);
            return false;
        }
    }

    updateCopyButtonState(button, isSuccess) {
        if (isSuccess) {
            button.classList.add('success');
            button.innerHTML = ICONS.SUCCESS;
            this.ui.showStatusMessage(MESSAGES.COPIED);

            setTimeout(() => {
                button.classList.remove('success');
                button.innerHTML = ICONS.COPY;
            }, UI_CONFIG.COPY_SUCCESS_DURATION);
        } else {
            button.classList.add('error');
            this.ui.showStatusMessage(MESSAGES.COPY_FAILED, false);
            button.innerHTML = ICONS.ERROR;

            setTimeout(() => {
                button.classList.remove('error');
                button.innerHTML = ICONS.COPY;
            }, UI_CONFIG.COPY_SUCCESS_DURATION);
        }
    }
}