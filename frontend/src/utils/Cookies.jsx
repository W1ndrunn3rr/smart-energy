import Cookies from 'js-cookie';

export async function sha256(message) {
    try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Hashing error:', error);
        throw new Error('Could not hash value');
    }
}

export const setSecureCookie = (name, value, options = {}) => {
    Cookies.set(name, value, {
        expires: 1,
        secure: import.meta.env.PROD,
        sameSite: 'Lax',
        path: '/',
        ...options,
    });
};

export const getSecureCookie = (name) => {
    return Cookies.get(name);
};

export const removeSecureCookie = (name) => {
    Cookies.remove(name, { path: '/' });
};

export const deleteCookie = removeSecureCookie;