const REG_SETUP = /\/(api|setup)\//;
var USER = { sa: true, permissions: EMPTYARRAY };
var DDOS = {};

// Define token expiration in days (14 days)
const TOKEN_EXPIRATION_DAYS = 14;

// Function to clean expired tokens
function cleanExpiredTokens() {
    var now = Date.now();
    var expired = [];
    
    for (var i = 0; i < MAIN.db.tokens.length; i++) {
        var token = MAIN.db.tokens[i];
        // If token has expiration and is expired
        if (token.expires && token.expires < now)
            expired.push(i);
    }
    
    // Remove expired tokens in reverse order to avoid index issues
    for (var i = expired.length - 1; i >= 0; i--)
        MAIN.db.tokens.splice(expired[i], 1);
    
    // Save changes to database
    MAIN.db.save();
}

AUTH(function($) {
    if ($.url === '/x/') {
        $.invalid();
        return;
    }
    
    if (DDOS[$.ip] && DDOS[$.ip] > 5) {
        $.invalid();
        return;
    }
    
    var token = $.headers['x-token'] || $.query.token || '0';
    
    if (REG_SETUP.test($.url)) {
        // Setup interface
        if (CONF.op_reqtoken && CONF.op_restoken) {
            OpenPlatform.auth($);
            return;
        }
        
        if (!CONF.token || CONF.token === token) {
            if (DDOS[$.ip])
                delete DDOS[$.ip];
            $.success(USER);
        } else {
            if (DDOS[$.ip])
                DDOS[$.ip]++;
            else
                DDOS[$.ip] = 1;
            $.invalid();
        }
        return;
    }
    
    var item = MAIN.db.tokens.findItem('token', token);
    
    if (item) {
        // Update token's last access time
        item.lastaccess = Date.now();
        
        // Extend token's expiration if using automatic expiration
        if (CONF.token_expiration) {
            item.expires = Date.now() + (CONF.token_expiration * 60000); // Convert minutes to milliseconds
        } else {
            // Default expiration: 14 days
            item.expires = Date.now() + (TOKEN_EXPIRATION_DAYS * 86400000); // days to milliseconds
        }
        
        // Save changes to database
        MAIN.db.save();
        
        $.success(item);
        return;
    }
    
    if (DDOS[$.ip])
        DDOS[$.ip]++;
    else
        DDOS[$.ip] = 1;
    $.invalid();
});

// Clean expired tokens and DDOS protection every 15 minutes
ON('service', function(counter) {
    if (counter % 15 === 0) {
        DDOS = {};
        cleanExpiredTokens();
    }
});

// When creating new tokens, make sure to add expiration
// This can be used in your API endpoint that generates tokens
global.CREATETOKEN = function(data) {
   // Refresh token expiration - Set to 365 days
var expiration = Date.now() + (365 * 86400000); // 365 days * milliseconds per day
    
    var token = {
        id: UID(),
        token: GUID(30),
        created: Date.now(),
        lastaccess: Date.now(),
        expires: expiration,
        data: data || {}
    };
    
    MAIN.db.tokens.push(token);
    
    // Save changes to database
    MAIN.db.save();
    
    return token;
};
