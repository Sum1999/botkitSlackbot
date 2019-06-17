/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a Slack bot built with Botkit to record messages in a google sheet.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
console.log("In bot.js");
var env = require('node-env-file');
env(__dirname + '/.env');


if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  console.log('Error: Specify clientId clientSecret and PORT in environment');
  usage_tip();
  process.exit(1);
}
var Botkit = require('botkit');

var debug = require('debug')('botkit:main');
const dialogflowMiddleware = require('botkit-middleware-dialogflow')({
  keyFilename: './first-81152-51a246394bef.json',  // service account private key file from Google Cloud Console
});


//console.log(dialogflowMiddleware);
var bot_options = {
    clientId: process.env.clientId,
    clientSecret: process.env.clientSecret,
    clientSigningSecret: process.env.clientSigningSecret,
    // debug: true,
    scopes: ['bot']
};


bot_options.json_file_store = __dirname + '/.data/db/'; // store user data in a simple JSON format

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);

var slackbot=controller.spawn({
  token: process.env.Apptoken
});

slackbot.startRTM();

controller.middleware.receive.use(dialogflowMiddleware.receive);
// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname + '/components/express_webserver.js')(controller);


      
// Set up a simple storage backend for keeping a record of customers
// who sign up for the app via the oauth
require(__dirname + '/components/user_registration.js')(controller);

// Send an onboarding message when a new team joins
require(__dirname + '/components/onboarding.js')(controller);

//console.log(controller);


var normalizedPath = require("path").join(__dirname, "skills");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./skills/" + file)(controller,dialogflowMiddleware);
});


 

