'use strict';

// Imports dependencies and set up http server
const
  express = require('express'), // express package for node js - useful webdev
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()), // creates express http server
  http = require('http'),
  request = require('request'),
  config = require('config'),
  menuPath = __dirname + '/menus';

// Sets server port and logs message on success
app.listen(process.env.PORT || 5000, () => console.log('webhook is listening'));

/*
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
        console.log("200 status sent");
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }
 
});*/

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
 
    let body = req.body;
 
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
      
    }
}
 
/*
// Handles postback events
const handlePostback = (sender_psid, received_postback) => {
    let response;
    console.log("Received POSTBACK event");
    // Get the payload for the postback
    let payload = received_postback.payload;
    console.log("-------");
    console.log(payload);
    console.log("-------");
    if(payload === 'GET_STARTED'){
        console.log('get started option chosen');
        response = askTemplate('This is the food delivery app, please order from the following restaurants:');
        callSendAPI(sender_psid, response);
        console.log("end of callsendapi, message should be sent");
    }else if (payload === 'RES_1') {
        response = getMenu('res_1', sender_psid);
        callSendAPI(sender_psid, response, function(){
            callSendAPI(sender_psid, askTemplate('Show me more'));
        });
    }else if(payload === 'RES_2'){
        console.log("res 2 option in postback");
    }
}*/

const handlePostback = (sender_psid, received_postback) => {
    let response;
 
    // Get the payload for the postback
    let payload = received_postback.payload;
 
    // Set the response based on the postback payload
    if (payload === 'CAT_PICS') {
        response = imageTemplate('cats', sender_psid);
        callSendAPI(sender_psid, response, function(){
            callSendAPI(sender_psid, askTemplate('Show me more'));
        });
    } else if (payload === 'DOG_PICS') {
        response = imageTemplate('dogs', sender_psid);
        callSendAPI(sender_psid, response, function(){
            callSendAPI(sender_psid, askTemplate('Show me more'));
        });
    } else if(payload === 'GET_STARTED'){
        response = askTemplate('Are you a Cat or Dog Person?');
        callSendAPI(sender_psid, response);
    }
    // Send the message to acknowledge the postback
}
/*
const getMenu = (menu_choice) => {
  if(menu_choice === "res_1"){
      menuJson = JSON.parse(menuPath + '/res_1.json');
      console.log('receieved 1st menu');
  }else if(menu_choice === "res_2"){
      console.log('res_2');
  }
}
*/


/*
const askTemplate = (text) => {
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Restaurant 1",
                        "payload":"RES_1"
                    },
                    {
                        "type":"postback",
                        "title":"Restaurant 2",
                        "payload":"RES_2"
                    }
                ]
            }
        }
    }
}
*/
const askTemplate = (text) => {
    console.log("--------");
    console.log("ASK TEMPLATE TEXT");
    console.log(text);
    console.log("--------");
    return {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text": text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Cats",
                        "payload":"CAT_PICS"
                    },
                    {
                        "type":"postback",
                        "title":"Dogs",
                        "payload":"DOG_PICS"
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
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            console.log("sent message");
        } else {
            console.error("Unable to send message:" + err);
        }
    });
}

/*
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
}
*/

