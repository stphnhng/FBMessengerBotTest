'use strict';

// Imports dependencies and set up http server
const
  express = require('express'), // express package for node js - useful webdev
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  http = require('http'),
  request = require('request'),
  config = require('config')

const fs = require("fs");
const menuPath = __dirname + '/menus';

// User-specific variables.
var schoolName = ""; // In order to know what school the user is at.
var prevUserStage = ""; // Prep to let users go back in stages
var userStage = ""; // What stage the user is currently at.
var userRestaurant = ""; // What restaurant the user has chosen.

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
 
    let body = req.body;

    console.log("Received POST request")
 
    if (body.object === 'page') {
 
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function(entry) {
 
            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);
 
            // Get the sender PSID
            let sender_psid = webhook_event.sender.id;
            console.log('Sender PSID: ' + sender_psid);
 
            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback);
            }
        });
 
        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
 
});

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  console.log("WEBHOOK EVENT");

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "<nEokxdQ2wCC6DJC>"
    
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});


// Handles messages events
const handleMessage = (sender_psid, received_message) => {
    let response;
    console.log("Received MESSAGE event")
    if (received_message.text) {
        // Should reset user back to their postback stage if they send a message.
        handlePostback(sender_psid, userStage);
    }
}
 

// Handles postback events
const handlePostback = (sender_psid, received_postback) => {
    let response;
    console.log("Received POSTBACK event");
    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log("-------");
    console.log(payload);
    console.log("-------");
    prevUserStage = userStage;
    userStage = received_postback;
    var list_res_json = JSON.parse(fs.readFileSync(menuPath + '/list_res.json'));
    var payloadArray = payload.split(",");
    switch(payloadArray[0]){
        case "GET_STARTED":
            response = getStartedTemplate('Please order by 11am the day you want delivery. Which school do you go to?');
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "LHS":
            schoolName = "Lynbrook";
            response = getRestaurant(list_res_json);
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "MVHS":
            schoolName = "Monta Vista";
            response = getRestaurant(list_res_json);
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "RES":
            userRestaurant = list_res_json.restaurants[parseInt(payloadArray[1]) - 1].name;
            response = getMenu("res_" + parseInt(payloadArray[1]));
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "CAT":
            console.log(parseInt(payloadArray[1]));
        default:
            console.log("Unexpected error in handling POSTBACK events.");
    }
    
}

const getRestaurant = (jsonContent) => {
    var objArray = [];
    for(var i = 0; i < jsonContent.restaurants.length; i++){
        var u = i+1;
        var object = {
            "title": jsonContent.restaurants[i].name,
            "subtitle": jsonContent.restaurants[i].description,
            "buttons":[
                {
                    "type": "postback",
                    "title": "Select restaurant",
                    "payload": "RES," + u
                }
            ]
        };
        objArray.push(object);
    }
    return{
        "attachment":{
            "type": "template",
            "payload": {
                "template_type":"generic",
                "elements": objArray
            }
        }
    }
};

const getMenu = (menu_choice) => {
  var return_template = null;
  if(menu_choice === "res_1"){
        var contents = fs.readFileSync(menuPath + '/res_1.json');
        var jsonContent = JSON.parse(contents);
        return_template = menuTemplate(jsonContent);
        console.log(JSON.stringify(return_template));
  }else if(menu_choice === "res_2"){
      console.log('res_2');
  }
  return return_template;
};

const menuTemplate = (jsonContent) => {
    var objArray = [];
    for (var i = 0; i < jsonContent.menu.categories.length; i++){
        var u = i+1;
        var object = {
            "title": jsonContent.menu.categories[i],
            //"image_url": __dirname + '/menus/images/cat' + u + '.jpg',
            "buttons":[
                {
                    "type": "postback",
                    "title": "Select this category",
                    "payload": "CAT," + u
                }
            ]
        };
        objArray.push(object);
    }
    return {
        "attachment":{
            "type": "template",
            "payload": {
                "template_type":"generic",
                "elements": objArray
            }
        }
    }
};


const getStartedTemplate = (text) => {
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type": "button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Lynbrook",
                        "payload":"LHS"
                    },
                    {
                        "type":"postback",
                        "title":"Monta Vista",
                        "payload":"MVHS"
                    }
                ]
            }
        }
    }
};

// Sends response messages via the Send API
const callSendAPI = (sender_psid, response, cb = null) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    };
 
    // Send the HTTP request to the Messenger Platform

    const options = {
        uri: "https://graph.facebook.com/v3.1/me/messages",
        qs: { "access_token": config.get('facebook.page.access_token') },
        method: "POST",
        json: request_body
    };

    request(options, (err, res, body) => {
        if (!err) {
            console.log("message sent!");
            if(cb){
                cb();
            }
        } else {
            console.error("Unable to send message:" + err);
        }
    });
};


