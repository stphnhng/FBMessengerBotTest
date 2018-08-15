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
const list_res_json = JSON.parse(fs.readFileSync(menuPath + '/list_res.json'));
var res_dict = {
    "res_1": JSON.parse(fs.readFileSync(menuPath + '/res_1.json')),
    "res_2": JSON.parse(fs.readFileSync(menuPath + '/res_2.json')),
    "res_3": JSON.parse(fs.readFileSync(menuPath + '/res_3.json'))
};

// User-specific variables.
var schoolName = ""; // In order to know what school the user is at.  (needed to put in DB)
var prevUserStage = ""; // Prep to let users go back in stages
var userStage = ""; // What stage the user is currently at.
var userRestaurant = ""; // Name of restaurant the user has chosen. (needed to put in DB)
var userRestaurantChoice = ""; // What restaurant the user has chosen (for tracking user choice purposes - not human readable.)

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
        console.log(userStage);
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
            userRestaurantChoice = "res_" + parseInt(payloadArray[1]);
            response = getMenu("res_" + parseInt(payloadArray[1]));
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "CAT":
            response = getFood(userRestaurantChoice, parseInt(payloadArray[1]) - 1);
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        case "ITEM":
            response = orderedFoodLanding(parseInt(payloadArray[1]), parseInt(payloadArray[2]));
            console.log(response);
            callSendAPI(sender_psid, response);
            break;
        default:
            console.log("Unexpected error in handling POSTBACK events.");
    }
    
}

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

const getMenu = (res_choice) => {
    var return_template = getCategory(res_dict[res_choice]);
    console.log(JSON.stringify(return_template));
    return return_template;
};

const getCategory = (jsonContent) => {
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

const getFood = (res_choice, cat_choice) => {
    var objArray = [];
    var jsonContent = res_dict[res_choice];
    for(var i = 0; i < jsonContent.menu.items.length; i++){
        if(jsonContent.menu.items[i].category == parseInt(cat_choice) ){
            var object = {
                "title": jsonContent.menu.items[i].name,
                "subtitle": "Price: $" + jsonContent.menu.items[i].price,
                "buttons": [
                    {
                        "type": "postback",
                        "title": "Order this",
                        "payload": "ITEM," + cat_choice + "," + i
                    }
                ] 
            }
            objArray.push(object);
        }
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
}

const orderedFoodLanding = (cat_choice, item_choice) =>  {
    var text = "You got it! One order for a " + res_dict[userRestaurantChoice].menu.items[item_choice].name + " from " + userRestaurant + 
                " has been added to your cart.";
    cat_choice +=1; // some stupid indexing thing - double check when have time.
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type": "button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Add another item",
                        "payload":"CAT," + cat_choice
                    },
                    {
                        "type":"postback",
                        "title":"Checkout",
                        "payload":"CHKOUT"
                    }
                ]
            }
        }
    }
}

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


