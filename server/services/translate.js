/**
 * Free Translation Service
 * 
 * Uses Google Translate's FREE public endpoint (same as translate.google.com)
 * 
 * ✅ NO API KEY REQUIRED
 * ✅ NO BILLING - 100% FREE FOREVER
 * ✅ UNLIMITED USAGE
 * ✅ HIGH QUALITY - Same engine as Google Translate website
 * 
 * Endpoint: translate.googleapis.com/translate_a/single?client=gtx
 * This is the same endpoint used by:
 * - translate.google.com
 * - Chrome's built-in translator
 * - Many free translation apps
 * 
 * Test it yourself:
 * https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=hello
 */

const axios = require('axios');

/**
 * Translates text from English to target language
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'hi' for Hindi, 'es' for Spanish)
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang) {
    try {
        const response = await axios.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',  // Free client (no API key needed)
                sl: 'en',        // Source language: English
                tl: targetLang,  // Target language
                dt: 't',         // Response type: translation
                q: text          // Query text to translate
            }
        });
        // Response format: [[["translated text", "original text", null, null, 10]]]
        return response.data[0][0][0];
    } catch (error) {
        console.error("Translation error:", error);
        return text; // Fallback to original text if translation fails
    }
}

module.exports = { translateText };
