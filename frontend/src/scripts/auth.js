import { API_URL } from '../definitions';

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
                // Try to parse error response from backend if it's JSON
                const errorData = await response.json();
                errorDetail = errorData.detail || errorData.message || `Błąd serwera: ${response.status}`;
            } catch (e) {
                // If backend error is not JSON (e.g. HTML error page for 500)
                console.log('Error parsing response:', e);
                errorDetail = `Błąd serwera: ${response.status}. Odpowiedź nie jest w formacie JSON.`;
            }
            throw new Error(errorDetail);
        }

        const data = await response.json();

        // Backend returns access_level: null for invalid credentials with a 200 OK
        if (data && data.access_level !== null && data.access_level !== undefined) {
            return {
                success: true,
                email: formData.email,
                access_level: data.access_level,
                message: data.message || 'Zalogowano pomyślnie'
            };
        } else {
            // Handle cases like "Invalid credentials" where access_level is null
            return {
                success: false,
                message: data.message || 'Nieprawidłowy login lub hasło'
            };
        }

    } catch (error) {
        console.error('Auth error:', error);
        // Re-throw the error so it can be caught by the handleSubmit in Login.jsx
        // If it's already an Error object with a message, use that.
        throw error instanceof Error ? error : new Error('Wystąpił błąd podczas komunikacji z serwerem.');
    }
}

export default AuthFunc;