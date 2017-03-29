var express = require('express')
var app     = express();

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
    response.send('Hello World!')
});

app.get('/webhook', function(req, res) {
    var data = req.body;

    // Make sure this is a page subscription
    if(data.object === 'page'){
        // Iterate over each entries - there may be multiple if batched
        data.entry.forEach(function(entry){
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event){
                if(event.message){
                    receivedMessage(event);
                }else{
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });

        res.sendStatus(200);
    }
});

function receivedMessage(event){
    var senderID      = event.sender.id;
    var recipientID   = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message       = event.message;

    console.log("Received message for user %d and page %d at %d with message:", senderID, recipientID, timeOfMessage);
    console.log(JSON.stringify(message));

    var messageId          = message.mid;
    var messageText        = message.text;
    var messageAttachments = message.attachments;

    if(messageText){
        // If we receive a text message, check to see if it matches a keyword
        // and send back the example. Otherwise, just echo the text we received.
        switch(messageText){
            case 'generic':
                sendGenericMessage(senderID);
            break;

            default:
                sendTextMessage(senderID, messageText);
        }
    }else if(messageAttachments){
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function sendGenericMessage(recipientId, messageText){
    // To be expanded in later sections
}

function sendTextMessage(recipientId, messageText){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function callSendAPI(messageData){
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: process.env.PAGE_ACCESS_TOKEN },
        method: 'POST',
        json: messageData

    }, function (error, response, body){
        if(!error && response.statusCode == 200){
            var recipientId = body.recipient_id;
            var messageId   = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s", messageId, recipientId);
        }else{
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}


app.listen(app.get('port'), function() {
    console.log("Node app is running at localhost:" + app.get('port'))
})
