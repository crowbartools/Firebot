const chat = require('../mixer-chat.js');

function scriptProcessor(scriptName, buttonName, username) {

  var scriptFilePath = "./scripts/" + scriptName;

  fs.access(scriptFilePath, (err) => {
    if(err) {
      // Ensure script file exists
      if(err.code === 'ENOENT') {
        renderWindow.webContents.send('error',
          "Can't find the script '" + scriptName + "' in the scripts folder");
      }
    } else {
      // Attempt to load the script
      try {
        var customScript = require(scriptFilePath);

        // Verify the script contains the "run" function
        if(typeof customScript.run === 'function') {

          var response = customScript.run(buttonName, username);

          if(response) {
            // Add a check to verify the response is (most likely) a Promise
            // If so, call the closure and process the response
            if(response.then === 'function') {
              response.then((data) => {
                /*
                  The response data we are expecting is:
                  {
                   success: boolean,
                      - Whether or not the script was successful
                   message: string,
                      - Message either shown as an error or potentially sent in chat
                   chatAs: null or string
                      - If this is "bot" or "streamer", we chat the message as the given chatter
                  }
                */
                if(data) {
                  if(data.success === true && data.message) {
                    var chatAs = data.chatAs;
                    if(chatAs) {
                      chat.broadcast(chatAs, data.message);
                    }
                  } else {
                    renderWindow.webContents.send('error',
                      "Custom script failed with the message: "
                      + data.message);
                  }
                }
              });
            }
          }
        } else {
          renderWindow.webContents.send('error',
            "Error running '" + scriptName
            + "', script does not contain a run fuction");
        }
      } catch (err) {
        renderWindow.webContents.send('error',
          "Error loading the script '" + scriptName + "'");
        console.log(err);
      }
    }
  });
}

exports.processScript = scriptProcessor;