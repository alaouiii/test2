// auth.js

// Use NOSQL storage (file-based DB of Total.js) instead of in-memory
var db = MAIN.db = NOSQL('data');

// Initialize collections if they don't exist
if (!db.banners)
    db.banners = {};
if (!db.tokens)
    db.tokens = [];
if (!db.config)
    db.config = {};

// Default config values
var config = db.config;
if (!config.name)
    config.name = 'Banner System';
if (!config.cdn)
    config.cdn = '//cdn.componentator.com';

// Fixed settings
CONF.allow_custom_titles = true;
CONF.version = '1';
CONF.op_icon = 'ti ti-gamepad';
CONF.op_path = '/setup/';

// Load configuration into CONF object
LOADCONFIG(db.config);

// Additional global cache object
MAIN.cache = {};

// Load UI components
COMPONENTATOR('ui', 'exec,locale,aselected,floatingbox,viewbox,page,input,importer,box,cloudeditorsimple,validate,loading,intranetcss,notify,message,errorhandler,empty,menu,colorpicker,icons,miniform,clipboard,approve,columns,iframepreview,search,searchinput,fileuploader,formdata,filesaver,filereader,ready,datagrid,stats7,directory,datepicker,preview,pagination,intro', true);

// Permissions from plugins
ON('ready', function() {
    for (var key in F.plugins) {
        var item = F.plugins[key];
        if (item.permissions)
            OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
    }
});

// Optional: Token expiration → 14 days (instead of default)
CONF.token_expiration = 20160; // 14 * 24 * 60
