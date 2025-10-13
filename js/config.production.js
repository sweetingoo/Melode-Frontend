/**
 * Production Environment Configuration
 * Copy this file to config.js to use production settings
 */

const CONFIG = {
    ENVIRONMENT: 'production',

    API_BASE_URLS: {
        development: 'http://127.0.0.1:8000/api/v1',
        staging: 'https://melode-api-staging.onrender.com/api/v1',
        production: 'https://api.melode.com/api/v1', // Update with actual production URL
    },

    APP_NAME: 'Melode Healthcare',
    APP_VERSION: '1.0.0',

    SESSION_TIMEOUT: 3600000,
    TOKEN_REFRESH_INTERVAL: 300000,
};

function getApiBaseUrl() {
    return CONFIG.API_BASE_URLS[CONFIG.ENVIRONMENT] || CONFIG.API_BASE_URLS.development;
}

function getEnvironment() {
    return CONFIG.ENVIRONMENT;
}

function isProduction() {
    return CONFIG.ENVIRONMENT === 'production';
}

function isDevelopment() {
    return CONFIG.ENVIRONMENT === 'development';
}

function isStaging() {
    return CONFIG.ENVIRONMENT === 'staging';
}

window.CONFIG = CONFIG;
window.getApiBaseUrl = getApiBaseUrl;
window.getEnvironment = getEnvironment;
window.isProduction = isProduction;
window.isDevelopment = isDevelopment;
window.isStaging = isStaging;

