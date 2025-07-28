// theme-manager.js - theme management
import { ICONS } from '../utils/constants.js';

export class ThemeManager {
    constructor(domElements) {
        this.dom = domElements;
        this.darkModeQuery = this.dom.getMediaQuery('(prefers-color-scheme: dark)');
        this.init();
    }

    init() {
        const savedTheme = localStorage.getItem('theme');
        const defaultTheme = this.darkModeQuery.matches ? 'dark' : 'light';
        this.setTheme(savedTheme || defaultTheme);
    }

    setTheme(theme) {
        const themeToggle = this.dom.themeToggle;
        if (!themeToggle) return;

        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = ICONS.LIGHT_MODE;
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = ICONS.DARK_MODE;
            localStorage.setItem('theme', 'light');
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
}