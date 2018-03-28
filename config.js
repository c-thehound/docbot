const for_all = {
    PORT: 3128,
    FB_HOME_SCREEN_SET: false,
    FB_VERIFY_TOKEN: '125c6da3-cd64-4c71-a242-c8f9bf8ee8cd',
    FB_LIKE_BUTTON_ID: 369239263222822,
    FB_PAGE_ACCESS_TOKEN: 'EAAc3yAIy4wIBACAGX4P35IfaOVI3yMu18DKgNomHrZAmawagyYIGfZCujNykOwZCgZBFFCgMefYWPvsgmrjHPR5jcLQxTfv8ZCDi7ctIEhsUjZC4lqUM4D1N9amlHlnnsjjsqNskYwVxt9IsZBh8IwWhngwBSfZBAERxcFdOXpZCrAYHhHZAIsbM2o'
};

module.exports = () => {
    switch (process.env.NODE_ENV) {
        case 'production':
            console.log('running in production mode');
            const rtg = require("url").parse(process.env.REDIS_URL);
            return Object.assign({}, for_all, {
                REDIS_PORT: rtg.port,
                REDIS_HOST_NAME: rtg.hostname,
                AUTH: rtg.auth
            });

            break;
        case 'development':          
        default:
            console.log('running in developmen mode');
            return Object.assign({}, for_all, {
                REDIS_PORT: 6379
            });
            break;
            break;
    }
};