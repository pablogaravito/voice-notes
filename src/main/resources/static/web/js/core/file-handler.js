// file-handler.js - file upload validation and processing
import { FILE_CONFIG } from '../utils/constants.js';

export class FileHandler {
    constructor(domElements, uiManager, transcriptionService) {
        this.dom = domElements;
        this.ui = uiManager;
        this.transcriptionService = transcriptionService;
    }

    validateFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const maxSize = FILE_CONFIG.MAX_SIZE;

        //file size check
        if (file.size > maxSize) {
            return {
                isValid: false,
                error: "El archivo es muy grande. Tamaño máximo: 500 MBs."
            };
        }

        //file extension check
        if (!FILE_CONFIG.SUPPORTED_EXTENSIONS.includes(extension)) {
            return {
                isValid: false,
                error: `Formato no compatible: .${extension}. Por favor, usa un formato de audio soportado.`
            };
        }

        //check if it's a video container
        if (FILE_CONFIG.VIDEO_CONTAINERS.includes(extension)) {
            return {
                isValid: true,
                warning: "Video container detected. FFmpeg will extract audio track.",
                isVideoContainer: true
            };
        }

        return {
            isValid: true,
            extension: extension
        };
    }

    async processFile(file) {
        const validation = this.validateFile(file);

        if (!validation.isValid) {
            this.ui.showStatusMessage(`Error: ${validation.error}`, false);
            return;
        }

        this.ui.setFileReadyState(file.name);

        try {
            await this.transcriptionService.transcribeFile(file);
        } catch (error) {
            this.ui.showStatusMessage(`Error al procesar el archivo: ${error.message}`, false);
            this.ui.enableElements();
            this.ui.hideLoadingOverlay();
        }
    }
}