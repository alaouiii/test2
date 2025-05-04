// auth.js

// NOSQL reference (points to file-based db)
var db = MAIN.db = {
    banners: NOSQL('banners'),
    tokens: NOSQL('tokens'),
    config: NOSQL('config')
};

// Load config
var config = CONF.config = {};

// Load configuration from DB (async)
db.config.find().callback(function(err, response) {
    if (response && response.length) {
        for (let key in response[0])
            config[key] = response[0][key];
    } else {
        // default values
        config.name = 'Banner System';
        config.cdn = '//cdn.componentator.com';
        db.config.insert(config); // save defaults
    }
});

// Fixed settings
CONF.allow_custom_titles = true;
CONF.version = '1';
CONF.op_icon = 'ti ti-gamepad';
CONF.op_path = '/setup/';

// Additional global cache object
MAIN.cache = {};

// UI components
COMPONENTATOR('ui', 'exec,locale,aselected,floatingbox,viewbox,page,input,importer,box,cloudeditorsimple,validate,loading,intranetcss,notify,message,errorhandler,empty,menu,colorpicker,icons,miniform,clipboard,approve,columns,iframepreview,search,searchinput,fileuploader,formdata,filesaver,filereader,ready,datagrid,stats7,directory,datepicker,preview,pagination,intro', true);

// Permissions from plugins
ON('ready', function() {
    for (var key in F.plugins) {
        var item = F.plugins[key];
        if (item.permissions)
            OpenPlatform.permissions.push.apply(OpenPlatform.permissions, item.permissions);
    }
});

// Optional token expiration config
CONF.token_expiration = 20160; // 14 * 24 * 60
