const mongoose = require('mongoose');

// === MongoDB connection ===
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bannersystem', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// === Mongoose Schemas ===
const TokenSchema = new mongoose.Schema({
    token: String,
    data: Object,
    expires: Date,
    created: { type: Date, default: Date.now }
});

const BannerSchema = new mongoose.Schema({
    name: String,
    imageUrl: String,
    created: { type: Date, default: Date.now }
});

const TokenModel = mongoose.model('Token', TokenSchema);
const BannerModel = mongoose.model('Banner', BannerSchema);

exports.install = function () {
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

    if (typeof (payload.data) === 'string' && payload.data.isJSON())
        payload.data = payload.data.parseJSON(true);

    FUNC.render(payload, $);
}

function upload() {
    var $ = this;
    var file = $.files[0];

    if (file) {
        file.fs('files', UID(), $.successful(function (response) {
            response.url = $.hostname('/download/{id}.{ext}'.args(response));

            // Save uploaded banner info to MongoDB
            const banner = new BannerModel({
                name: response.filename,
                imageUrl: response.url
            });

            banner.save().then(() => {
                $.json(response);
            }).catch(err => {
                console.error('Banner save error:', err);
                $.json({ error: 'Failed to save banner.' });
            });
        }));
    } else {
        $.json(null);
    }
}

function download(req, res) {
    var filename = req.split[1];
    var index = filename.lastIndexOf('.');
    res.filefs('files', filename.substring(0, index), !!req.query.download);
}

// === Token management ===

async function createToken() {
    var self = this;
    var data = self.body;

    if (!data) {
        self.invalid('Invalid token data');
        return;
    }

    const token = new TokenModel({
        token: UID(),
        data: data,
        expires: new Date(Date.now() + (30 * 60 * 1000)) // 30 min
    });

    try {
        await token.save();
        self.json({ token: token.token, expires: token.expires });
    } catch (err) {
        console.error('Create token error:', err);
        self.throw500('Failed to create token');
    }
}

async function validateToken(tokenValue) {
    var self = this;
    try {
        const token = await TokenModel.findOne({ token: tokenValue });

        if (!token) {
            self.invalid('Token not found');
            return;
        }

        if (token.expires && token.expires < Date.now()) {
            self.invalid('Token expired');
            return;
        }

        // Refresh expiration
        token.expires = new Date(Date.now() + (30 * 60 * 1000)); // extend 30 min
        token.save();

        self.json({ success: true, data: token.data });
    } catch (err) {
        console.error('Validate token error:', err);
        self.throw500('Token validation failed');
    }
}

async function removeToken(tokenValue) {
    var self = this;
    try {
        const result = await TokenModel.deleteOne({ token: tokenValue });

        if (result.deletedCount === 0) {
            self.invalid('Token not found');
            return;
        }

        self.json({ success: true });
    } catch (err) {
        console.error('Remove token error:', err);
        self.throw500('Failed to remove token');
    }
}
