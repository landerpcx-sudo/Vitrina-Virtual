const LOGO_STORAGE_KEY = 'virtual-try-on-logo';

/**
 * Retrieves the logo data URL from localStorage.
 * @returns {string | null} The logo data URL or null if not found.
 */
export const getLogo = (): string | null => {
    try {
        return localStorage.getItem(LOGO_STORAGE_KEY);
    } catch (error) {
        console.error('Error getting logo from local storage:', error);
        return null;
    }
};

/**
 * Saves the provided logo data URL to localStorage.
 * @param {string} logoDataUrl The logo data URL to save.
 */
export const saveLogo = (logoDataUrl: string): void => {
    try {
        localStorage.setItem(LOGO_STORAGE_KEY, logoDataUrl);
    } catch (error) {
        console.error('Error saving logo to local storage:', error);
    }
};

/**
 * Removes the logo from localStorage.
 */
export const removeLogo = (): void => {
    try {
        localStorage.removeItem(LOGO_STORAGE_KEY);
    } catch (error) {
        console.error('Error removing logo from local storage:', error);
    }
};
