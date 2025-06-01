import Cookies from 'js-cookie';

/**
 * Asynchronously hashes a message using SHA-256.
 * @param {string} message - The string to hash.
 * @returns {Promise<string>} A promise that resolves to the hex string of the hash.
 */
export async function sha256(message) {
    try {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(message);
        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // convert bytes to hex string
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    } catch (error) {
        console.error('Hashing error:', error);
        // Fallback or rethrow, depending on desired error handling
        throw new Error('Could not hash value');
    }
}

export const setSecureCookie = (name, value, options = {}) => {
    Cookies.set(name, value, {
        expires: 1, // wygasa po 1 dniu
        // Ustaw 'secure: true' tylko w środowisku produkcyjnym (HTTPS)
        // W środowisku deweloperskim (HTTP) ciasteczka secure nie będą działać
        secure: import.meta.env.PROD,
        sameSite: 'Lax', // 'Strict' może być zbyt restrykcyjne, 'Lax' jest dobrym kompromisem
        path: '/',
        ...options,
    });
};

export const getSecureCookie = (name) => {
    return Cookies.get(name);
};

export const removeSecureCookie = (name) => {
    // Upewnij się, że usuwasz ciasteczko z tymi samymi atrybutami (szczególnie path)
    Cookies.remove(name, { path: '/' });
};

// Alias dla kompatybilności wstecznej
export const deleteCookie = removeSecureCookie;