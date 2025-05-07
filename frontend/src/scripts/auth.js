import { API_URL } from '../definitions';


async function AuthFunc(formData) {


    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        console.log(response.json)

        if (response.ok && data.access_level !== null) {
            console.log(data.access_level);
            localStorage.setItem('access_level', data.access_level);
            localStorage.setItem('isAuthenticated', 'true');
            return true;
        }
        else {
            throw new Error('Błąd logowania');
        }
    } catch (e) {
        console.log(e);
        return false;
    }
}

export default AuthFunc;