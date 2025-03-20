// index.js
const total = require('total4');

// Configure Total.js to work with Vercel's serverless environment
const options = {
    port: process.env.PORT || 3000,
    directory: __dirname,
    config: {
        name: 'BannerSystem',
        version: '1.0.0'
    }
};

// Initialize Total.js
total.http('release', options);
