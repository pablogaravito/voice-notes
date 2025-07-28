// dom-elements.js - centralized DOM element management
export class DOMElements {
    constructor() {
        this._elements = new Map();
        this._initializeElements();
    }

    _initializeElements() {
        const elementIds = [
            'recordButton',
            'statusMessage',
            'audioVisualizer',
            'engineSelect',
            'singleResult',
            'dualResults',
            'singleModelName',
            'uploadButton',
            'audioUpload',
            'downloadText',
            'downloadVoskText',
            'downloadWhisperText',
            'downloadBothText',
            'themeToggle',
            'uploadContainer',
            'showTimestamps',
            'loadingOverlay',
            'whisperText',
            'voskText',
            'transcriptionText',
            'whisperPostProcessSingle',
            'whisperPostProcessDual'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this._elements.set(id, element);
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        });
    }

    get(id) {
        const element = this._elements.get(id);
        if (!element) {
            console.warn(`Element with ID '${id}' not found in cache`);
            //try to find it dynamically
            const dynamicElement = document.getElementById(id);
            if (dynamicElement) {
                this._elements.set(id, dynamicElement);
                return dynamicElement;
            }
        }
        return element;
    }

    getAll(ids) {
        return ids.reduce((acc, id) => {
            acc[id] = this.get(id);
            return acc;
        }, {});
    }

    //getters for frequently used elements
    get recordButton() { return this.get('recordButton'); }
    get statusMessage() { return this.get('statusMessage'); }
    get audioVisualizer() { return this.get('audioVisualizer'); }
    get engineSelect() { return this.get('engineSelect'); }
    get singleResult() { return this.get('singleResult'); }
    get dualResults() { return this.get('dualResults'); }
    get singleModelName() { return this.get('singleModelName'); }
    get uploadButton() { return this.get('uploadButton'); }
    get audioUpload() { return this.get('audioUpload'); }
    get uploadContainer() { return this.get('uploadContainer'); }
    get showTimestamps() { return this.get('showTimestamps'); }
    get loadingOverlay() { return this.get('loadingOverlay'); }
    get themeToggle() { return this.get('themeToggle'); }

    //query selectors for dynamic elements
    querySelector(selector) {
        return document.querySelector(selector);
    }

    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    //media query
    getMediaQuery(query) {
        return window.matchMedia(query);
    }
}