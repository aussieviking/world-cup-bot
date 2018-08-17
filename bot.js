/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

if(!process.env.clientId) {
    var env = require('node-env-file');
    env(__dirname + '/.env');
}

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
    console.log('check that clientId and clientSecret are defined');
    process.exit(1);
}

var Botkit = require('botkit');
var debug = require('debug')('botkit:main');

var botConfig = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    redirectUri: process.env.redirectUri || 'http://localhost:3000/oauth',
    debug: true,
    scopes: ['bot']
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
    var mongoStorage = require('botkit-storage-mongo')({mongoUri: process.env.MONGO_URI});
    botConfig.storage = mongoStorage;
} else {
    botConfig.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format
}

var controller = Botkit.slackbot(botConfig);

controller.startTicking();

// Give the bot some skills
var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller);
});

controller.setupWebserver(process.env.PORT,function(err,webserver) {

    // set up web endpoints for oauth, receiving webhooks, etc.
    controller
        .createHomepageEndpoint(controller.webserver)
        .createOauthEndpoints(controller.webserver,function(err,req,res) {
            if (err) {
                res.status(500).send('ERROR: ' + err);
            } else {
                res.send('Success!');
            }
        })
        .createWebhookEndpoints(controller.webserver);
});