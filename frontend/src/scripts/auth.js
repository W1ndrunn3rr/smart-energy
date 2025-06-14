import { API_URL } from '../definitions';

/**
 * Funkcja uwierzytelniania użytkownika.
 * Wysyła dane logowania do API i zwraca wynik autoryzacji oraz poziom dostępu.
 * @async
 * @function AuthFunc
 * @param {Object} formData - Dane logowania użytkownika.
 * @param {string} formData.email - Adres email użytkownika.
 * @param {string} formData.password - Hasło użytkownika.
 * @returns {Promise<Object>} Wynik autoryzacji: { success, email, access_level, message } lub błąd.
 * @throws {Error} W przypadku błędu komunikacji lub nieprawidłowych danych logowania.
 */
async function AuthFunc(formData) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: formData.email,
                password: formData.password
            })
        });

        if (!response.ok) {
            let errorDetail = 'Nieznany błąd serwera.';
            try {

                const errorData = await response.json();
                errorDetail = errorData.detail || errorData.message || `Błąd serwera: ${response.status}`;
            } catch (e) {
                console.log('Error parsing response:', e);
                errorDetail = `Błąd serwera: ${response.status}. Odpowiedź nie jest w formacie JSON.`;
            }
            throw new Error(errorDetail);
        }

        const data = await response.json();

        if (data && data.access_level !== null && data.access_level !== undefined) {
            return {
                success: true,
                email: formData.email,
                access_level: data.access_level,
                message: data.message || 'Zalogowano pomyślnie'
            };
        } else {
            return {
                success: false,
                message: data.message || 'Nieprawidłowy login lub hasło'
            };
        }

    } catch (error) {
        console.error('Auth error:', error);
        throw error instanceof Error ? error : new Error('Wystąpił błąd podczas komunikacji z serwerem.');
    }
}

export default AuthFunc;