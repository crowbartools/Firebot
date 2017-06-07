const chat = require('../mixer-chat.js');
const fs = require('fs');
const settings = require('../settings-access');
const path = require('path');
const {ipcMain, BrowserWindow, dialog, shell} = require('electron');

function scriptProcessor(scriptName, buttonName, username) {
  
  if(settings.runCustomScripts === false) {
    renderWindow.webContents.send('error', "Something attempted to run a custom script but this feature is disabled!");
    return;
  }

  var scriptsFolder = path.resolve(process.cwd(), 'scripts');  
  var scriptFilePath = path.resolve(scriptsFolder, scriptName);
  // Attempt to load the script
  try {
    // Make sure we first remove the cached version, incase there was any changes
    delete require.cache[require.resolve(scriptFilePath)]
    
    var customScript = require(scriptFilePath);

    // Verify the script contains the "run" function
    if(typeof customScript.run === 'function') {

      // Throw it in a timeout to make it as async as possible
      setTimeout(function() {
        
        // Build modules object
        var modules = {
          request = require('request')
        }
        
        var response = customScript.run(buttonName, username, modules);

        if(response) {
          // Add a check to verify the response is a Promise
          // If so, call the closure and process the response.  
          // Otherwise, just do nothing.          
          if(response instanceof Promise) {
            response.then((data) => {
              /*
                The response data we are expecting is either nothing, or:
                {
                 success: boolean,
                    - Whether or not the script was successful
                 message: string,
                    - Message either shown as an error or potentially sent in chat
                 chatAs: string or null
                    - If this is "bot" or "streamer", we chat the message as the given chatter
                 whisper: true or false/null
                    - If this is true and the above is set to chat as someone, this will whisper
                      to the participant instead
                }
              */
              if(data) {
                if(data.success === true && data.message) {
                  var chatAs = data.chatAs;
                  // We just need to check if chatAs is empty, everything else
                  // is handled by te .whipser and .broadcast calls.
                  if(chatAs) {
                    if(data.whisper === true) {
                      chat.whisper(chatAs, username, data.message);
                    } else {
                      chat.broadcast(chatAs, data.message);
                    }                        
                  }
                } else {
                  renderWindow.webContents.send('error', "Custom script failed with the message: " + data.message);
                }
              }
            });
          }
        }
      }, 1);          
    } else {
      renderWindow.webContents.send('error', "Error running '" + scriptName + "', script does not contain a visible run fuction.");
    }
  } catch (err) {
    renderWindow.webContents.send('error', "Error loading the script '" + scriptName + "'\n\n" + err);
    console.log(err);
  }
}

// Opens the custom scripts folder
ipcMain.on('openScriptsFolder', function(event) {
  // We include "fakescript.js" as a workaround to make it open into the 'scripts' folder instead 
  // of opening to the firebot root folder with 'scripts' selected. 
  var scriptsFolder = path.resolve(process.cwd(), 'scripts' + path.sep + "fakescript.js");
  shell.showItemInFolder(scriptsFolder);
});

exports.processScript = scriptProcessor;
