exports.install = function() {
	CORS();
	ROUTE('+POST  /', http, [60 * 5000], 1024); // 5 min. timeout + 1024 kB data
	ROUTE('+POST  /api/upload/', upload, 1024);
	
	// Index
	ROUTE('GET /', index);
	ROUTE('FILE /download/*.*', download);
	
	// Token management
	ROUTE('POST /api/token/', createToken);
	ROUTE('GET /api/token/{token}/', validateToken);
	ROUTE('DELETE /api/token/{token}/', removeToken);
};

function index() {
	if (CONF.token)
		this.plain(CONF.name);
	else
		this.redirect('/setup/');
}

function http() {
	var $ = this;
	var payload = $.body;
	if (typeof(payload.data) === 'string' && payload.data.isJSON())
		payload.data = payload.data.parseJSON(true);
	FUNC.render(payload, $);
}

function upload() {
	var $ = this;
	var file = $.files[0];
	if (file) {
		file.fs('files', UID(), $.successful(function(response) {
			response.url = $.hostname('/download/{id}.{ext}'.args(response));
			$.json(response);
		}));
	} else
		$.json(null);
}

function download(req, res) {
	var filename = req.split[1];
	var index = filename.lastIndexOf('.');
	res.filefs('files', filename.substring(0, index), !!req.query.download);
}

// Token management functions
function createToken() {
	var self = this;
	var data = self.body;
	
	// Validate request data (add your own validation logic here)
	if (!data) {
		self.invalid('Invalid token data');
		return;
	}
	
	// Create token using the global function we defined in auth.js
	var token = CREATETOKEN(data);
	
	// Save tokens to persistent storage
	MAIN.db.save('tokens');
	
	self.json(token);
}

function validateToken(token) {
	var self = this;
	
	// Find the token
	var item = MAIN.db.tokens.findItem('token', token);
	
	if (!item) {
		self.invalid('Token not found');
		return;
	}
	
	// Check if token is expired
	if (item.expires && item.expires < Date.now()) {
		self.invalid('Token expired');
		return;
	}
	
	// Refresh token expiration - Set to 30 minutes
var expiration = Date.now() + (30 * 60000); // 30 minutes * milliseconds per minute
	
	item.lastaccess = Date.now();
	item.expires = expiration;
	
	// Save changes
	MAIN.db.save('tokens');
	
	// Token is valid
	self.json({ success: true, data: item.data });
}

function removeToken(token) {
	var self = this;
	
	// Find the token index
	var index = MAIN.db.tokens.findIndex('token', token);
	
	if (index === -1) {
		self.invalid('Token not found');
		return;
	}
	
	// Remove token
	MAIN.db.tokens.splice(index, 1);
	
	// Save changes
	MAIN.db.save('tokens');
	
	self.json({ success: true });
}
