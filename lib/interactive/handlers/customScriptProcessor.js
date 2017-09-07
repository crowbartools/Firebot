const chat = require('../mixer-chat.js');
const fs = require('fs');
const dataAccess = require('../../data-access.js');
const settings = require('../settings-access').settings;
const path = require('path');
const {ipcMain, BrowserWindow, dialog, shell} = require('electron');

function scriptProcessor(scriptName, buttonName, username) {
  
  if(!settings.isCustomScriptsEnabled) {
    renderWindow.webContents.send('error', "Something attempted to run a custom script but this feature is disabled!");
    return;
  }

  var scriptsFolder = dataAccess.getPathInUserData('/user-settings/scripts'); 
  var scriptFilePath = path.resolve(scriptsFolder, scriptName);
  // Attempt to load the script
  try {
    // Make sure we first remove the cached version, incase there was any changes
    if(settings.getClearCustomScriptCache) {
      delete require.cache[require.resolve(scriptFilePath)];
    } 
    
    var customScript = require(scriptFilePath);

    // Verify the script contains the "run" function
    if(typeof customScript.run === 'function') {

      // Throw it in a timeout to make it as async as possible
      setTimeout(function() {
        
        // Build modules object
        var modules = {
          request: require('request')
        }
        
        var isV2Script = customScript.run.length == 1;
      
        var response;
        if(isV2Script) {
                    
          var runRequest = {
            modules: modules,
            buttonId: buttonName,
            username: username,
            parameters: {}
          }      
          response = customScript.run(runRequest);                
        } else {
          response = customScript.run(buttonName, username, modules);
        }

        if(response) {

          // Add a check to verify the response is a Promise
          // If so, call the closure and process the response.  
          // Otherwise, just do nothing.           
          if(response instanceof Promise) {  
            response.then((data) => {
  
              if(isV2Script) {
                /* In a V2 script, we are expecting a reponse like this:
                {
                   success: boolean,
                   errorMessage: string (optional),
                   effects: [
                    {
                      type: "chat",
                      metadata: {
                        message: "This is a chat message, yay.",
                        whisper: string (user name to whisper to),
                        chatAs: string ("bot" or "streamer")
                      }
                    },
                    {
                      type: "play_sound",
                      metadata: {
                        filepath: "c:\asdasd\asdasd\sound.mp3",
                        volume: int
                      }
                    }
                   ]
                }
                */
                if(data) {
                  var responseObject = data;
                  if(responseObject.success === true) {

                    var effects = responseObject.effects;
                    
                    effects.forEach(e => {
                      var type = e.type;
                      var metadata = e.metadata;
                      if(type != null && metadata != null) {
                        switch(type.toLowerCase()) {
                          case "chat":
                            var chatAs = metadata.chatAs;
                            // We just need to check if chatAs is empty, everything else
                            // is handled by the .whipser and .broadcast calls.
                            if(chatAs) {
                              var whisper = metadata.whisper;
                              if(whisper != null && whisper != "") {
                                chat.whisper(chatAs, whisper, metadata.message);
                              } else {
                                chat.broadcast(chatAs, metadata.message);
                              }                        
                            }
                           break;
                          default:
                           renderWindow.webContents.send('error', "Custom script tried to execute an unknown effect type.");
                           return;
                        }
                      }
                    });
                        
                  } else {
                    renderWindow.webContents.send('error', "Custom script failed with the message: " + reponseObject.errorMessage);
                  }
                } 
              } else {
                /*
                  Script V1 response data we are expecting is either nothing, or:
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
  var scriptsFolder = dataAccess.getPathInUserData("/user-settings/scripts/fakescript.js");

  shell.showItemInFolder(scriptsFolder);
});

exports.processScript = scriptProcessor;
