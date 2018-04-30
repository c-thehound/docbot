const for_all = {
    PORT: 3128,
    MODE: 'development',
    // this changes very often
    BASE_URL: 'https://c125e83f.ngrok.io',
    FB_HOME_SCREEN_SET: false,
    FB_LIKE_BUTTON_ID: 369239263222822,
    TELEGRAM_ACCESS_TOKEN: '566379095:AAGaLWEigdnylnBFHpRydoV3IZeZdxOfBNc',
    FB_VERIFY_TOKEN: '125c6da3-cd64-4c71-a242-c8f9bf8ee8cd',
    FB_PAGE_ACCESS_TOKEN: 'EAAc3yAIy4wIBACAGX4P35IfaOVI3yMu18DKgNomHrZAmawagyYIGfZCujNykOwZCgZBFFCgMefYWPvsgmrjHPR5jcLQxTfv8ZCDi7ctIEhsUjZC4lqUM4D1N9amlHlnnsjjsqNskYwVxt9IsZBh8IwWhngwBSfZBAERxcFdOXpZCrAYHhHZAIsbM2o'
};

module.exports = () => {
    switch (process.env.NODE_ENV) {
        case 'production':
            const rtg = require("url").parse(process.env.REDIS_URL);
            return Object.assign({}, for_all, {
                REDIS_PORT: rtg.port,
                BASE_URL: 'https://still-depths-76007.herokuapp.com',
                REDIS_HOST_NAME: rtg.hostname,
                AUTH: rtg.auth,
                MODE: 'production'
            });

            break;
        case 'development':          
        default:
            return Object.assign({}, for_all, {
                REDIS_PORT: 6379,
            });
            break;
            break;
    }
};