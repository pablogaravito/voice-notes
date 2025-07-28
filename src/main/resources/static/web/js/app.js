// app.js - entry point and initialization
import { DOMElements } from './core/dom-elements.js';
import { ThemeManager } from './core/theme-manager.js';
import { UIManager } from './core/ui-manager.js';
import { FileHandler } from './core/file-handler.js';
import { AudioRecorder } from './core/audio-recorder.js';
import { TranscriptionService } from './core/transcription-service.js';
import { DownloadManager } from './utils/download-manager.js';
import { CopyManager } from './utils/copy-manager.js';
import { EventHandlers } from './core/event-handlers.js';

class TranscriptionApp {
    constructor() {
        this.modules = {};
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        try {
            //initialize DOM elements first
            this.modules.domElements = new DOMElements();

            //initialize UI manager
            this.modules.uiManager = new UIManager(this.modules.domElements);

            //initialize theme manager
            this.modules.themeManager = new ThemeManager(this.modules.domElements);

            //initialize transcription service
            this.modules.transcriptionService = new TranscriptionService(
                this.modules.domElements,
                this.modules.uiManager
            );

            //initialize file handler
            this.modules.fileHandler = new FileHandler(
                this.modules.domElements,
                this.modules.uiManager,
                this.modules.transcriptionService
            );

            //initialize audio recorder
            this.modules.audioRecorder = new AudioRecorder(
                this.modules.domElements,
                this.modules.uiManager,
                this.modules.transcriptionService
            );

            //initialize download manager
            this.modules.downloadManager = new DownloadManager(this.modules.domElements);

            //initialize copy manager
            this.modules.copyManager = new CopyManager(
                this.modules.domElements,
                this.modules.uiManager
            );

            //initialize event handlers (must be last)
            this.modules.eventHandlers = new EventHandlers({
                domElements: this.modules.domElements,
                themeManager: this.modules.themeManager,
                uiManager: this.modules.uiManager,
                fileHandler: this.modules.fileHandler,
                audioRecorder: this.modules.audioRecorder,
                downloadManager: this.modules.downloadManager,
                copyManager: this.modules.copyManager
            });

            //initialize all modules that need setup
            await this.initializeModules();

            this.isInitialized = true;
            console.log('Transcription app initialized successfully');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.handleInitializationError(error);
        }
    }

    async initializeModules() {
        //initialize modules that have init methods
        const modulesToInit = [
            'audioRecorder',
            'eventHandlers'
        ];

        for (const moduleName of modulesToInit) {
            try {
                const module = this.modules[moduleName];
                if (module && typeof module.init === 'function') {
                    await module.init();
                    console.log(`${moduleName} initialized`);
                }
            } catch (error) {
                console.error(`Failed to initialize ${moduleName}:`, error);
                throw error;
            }
        }
    }

    handleInitializationError(error) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = '❌ Error al iniciar la aplicación';
            statusMessage.style.color = 'red';
        }

        //disable all interactive elements
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');

        [...buttons, ...inputs, ...selects].forEach(element => {
            element.disabled = true;
        });
    }

    //public API for accessing modules (debugging)
    getModule(moduleName) {
        return this.modules[moduleName];
    }

    //public API for checking if app is ready
    isReady() {
        return this.isInitialized;
    }

    destroy() {
        try {
            //stop any ongoing recordings
            if (this.modules.audioRecorder) {
                this.modules.audioRecorder.stopRecording();
            }

            console.log('App destroyed');
        } catch (error) {
            console.error('Error during app destruction:', error);
        }
    }
}

//initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        window.transcriptionApp = new TranscriptionApp();
        await window.transcriptionApp.init();
    } catch (error) {
        console.error('Critical error during app initialization:', error);
    }
});

//page unload
window.addEventListener('beforeunload', () => {
    if (window.transcriptionApp) {
        window.transcriptionApp.destroy();
    }
});

export default TranscriptionApp;