// init.js

FUNC.initData = function() {
    // Check if banners collection exists in db
    if (!MAIN.db.banners || Object.keys(MAIN.db.banners).length === 0) {
        console.log('Initializing default banners...');

        // Example: insert sample banners
        MAIN.db.banners['default'] = {
            id: 'default',
            title: 'Welcome Banner',
            image: 'https://yourcdn.com/banner.jpg',
            link: 'https://yourwebsite.com'
        };

        // Save changes to NOSQL file
        NOSQL('data').modify({ banners: MAIN.db.banners });
    }

    // Same for tokens
    if (!MAIN.db.tokens || !MAIN.db.tokens.length) {
        console.log('Initializing default tokens...');
        MAIN.db.tokens.push('my-initial-token');

        // Save tokens
        NOSQL('data').modify({ tokens: MAIN.db.tokens });
    }

    console.log('Initialization complete.');
};

// Run init function on app startup
FUNC.initData();
