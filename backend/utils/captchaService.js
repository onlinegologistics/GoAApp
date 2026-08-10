const axios = require('axios');

/**
 * Verifies a Google reCAPTCHA token
 * @param {string} token - The client-side reCAPTCHA token
 * @returns {Promise<boolean>}
 */
const verifyCaptcha = async (token) => {
    // If no token is provided, return false (unless in dev without a secret)
    if (!token) {
        if (!process.env.RECAPTCHA_SECRET_KEY) {
            console.log('[DEV] No reCAPTCHA secret key configured. Bypassing CAPTCHA check.');
            return true;
        }
        return false;
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY || 'MOCK_SECRET_KEY';
        
        // In development with mock key, bypass google api
        if (secretKey === 'MOCK_SECRET_KEY') {
            console.log(`[DEV] Mock CAPTCHA verification for token: ${token.substring(0, 10)}...`);
            return true;
        }

        const response = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
        );

        return response.data.success;
    } catch (error) {
        console.error('Error verifying CAPTCHA:', error);
        return false;
    }
};

module.exports = {
    verifyCaptcha
};
