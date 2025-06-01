import { setSecureCookie, getSecureCookie, removeSecureCookie } from '../utils/Cookies';

class SessionManager {
    constructor() {
        this.loadSessionFromStorage();
    }

    setSession(userData) {
        const sessionData = {
            isAuthenticated: true,
            accessLevel: userData.access_level,
            user: userData,
            timestamp: Date.now()
        };

        this.session = sessionData;
        // Zapisz w localStorage
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        // Ustaw cookie dla kompatybilności
        setSecureCookie('isAuthenticated', 'true', { expires: 1 });
    }

    loadSessionFromStorage() {
        try {
            const storedSession = localStorage.getItem('userSession');
            const isAuthCookie = getSecureCookie('isAuthenticated');

            if (storedSession && isAuthCookie === 'true') {
                const parsed = JSON.parse(storedSession);
                // Sprawdź czy sesja nie wygasła (opcjonalnie)
                const maxAge = 24 * 60 * 60 * 1000; // 24 godziny
                if (Date.now() - parsed.timestamp < maxAge) {
                    this.session = parsed;
                    return;
                }
            }
        } catch (error) {
            console.error('Error loading session from storage:', error);
        }

        // Jeśli nie ma sesji lub wygasła, wyczyść wszystko
        this.clearSession();
    }

    getAccessLevel() {
        return this.session.accessLevel;
    }

    getUserData() {
        return this.session.user;
    }

    isAuthenticated() {
        return this.session.isAuthenticated;
    }

    clearSession() {
        this.session = {
            isAuthenticated: false,
            accessLevel: null,
            user: null
        };
        localStorage.removeItem('userSession');
        removeSecureCookie('isAuthenticated');
        removeSecureCookie('access_level');
    }

    hasMinimumAccessLevel(requiredLevel) {
        return this.session.accessLevel !== null && this.session.accessLevel <= requiredLevel;
    }

    // Dodatkowe metody pomocnicze
    refreshSession() {
        this.loadSessionFromStorage();
    }

    updateSessionTimestamp() {
        if (this.session.isAuthenticated) {
            this.session.timestamp = Date.now();
            localStorage.setItem('userSession', JSON.stringify(this.session));
        }
    }

    isSessionExpired() {
        if (!this.session.timestamp) return true;
        const maxAge = 24 * 60 * 60 * 1000; // 24 godziny
        return Date.now() - this.session.timestamp >= maxAge;
    }
}

export const sessionManager = new SessionManager();