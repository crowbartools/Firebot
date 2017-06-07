// Handlers
const mediaHandler = require('./handlers/mediaProcessor.js');
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');
const celebration = require('./handlers/celebrationProcessor.js');
const media = require('./handlers/mediaProcessor.js');
const cdHandler = require('./handlers/cooldownProcessor.js');
const controlHandler = require('./handlers/controlProcessor.js');
const changeGroupHandler = require('./handlers/changeGroupProcessor.js');
const changeSceneHandler = require('./handlers/changeSceneProcessor.js');
const customScriptHandler = require('./handlers/customScriptProcessor.js');
const diceHandler = require('./handlers/diceProcessor.js');
const htmlHandler = require('./handlers/htmlProcessor.js');

function processEffects(processEffectsRequest) {
  return new Promise((resolve, reject) => {
    
    var username = "";
    if(processEffectsRequest.participant) {
      username = processEffectsRequest.participant.username;
    }
    
    // Add some values to our wrapper
    var runEffectsRequest = processEffectsRequest;
    runEffectsRequest["previousIndex"] = -1;
    runEffectsRequest["username"] = username;
    
    runEffects(runEffectsRequest, function() {
      resolve();
    });
  });
}

function runEffects(runEffectsRequest, callback) {
  // Varibles
  var effects = runEffectsRequest.effects;
  var firebot = runEffectsRequest.firebot;
  var control = runEffectsRequest.control;
  var participant = runEffectsRequest.participant;
  var username = runEffectsRequest.username;
  var isManual = (runEffectsRequest.isManual === true);
  
  var currentIndex = runEffectsRequest.previousIndex++;
  var effectsCount = Object.keys(effects).length;
  
  if(effectsCount-1 >= currentIndex) { 
    callback(); 
    return; 
  }
  
  var effect = effects[currentIndex];
  var effectType = effect.type;

  var delayBeforeNextEffect = 0;
  // For each effect, send it off to the appropriate handler.
  switch(effectType){
      case "API Button":
          apiHandler.go(effect);
          break;
      case "Change Group":
          if(!isManual) {
            changeGroupHandler.go(participant, effect, firebot);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case "Change Scene":
          if(!isManual) {
            changeSceneHandler.go(effect, firebot);
          } else {
            console.log('Change Scene doesnt work with manual trigger.');
          }          
          break;
      case "Chat":
          if(!isManual) {
            chatHandler.send(effect, participant);
          } else {
            chatHandler.send(effect, {username: 'Streamer'});
          }        
          break;
      case "Cooldown":
          if(!isManual) {
            cdHandler.go(effect, firebot)
          } else {
            console.log('We wont cooldown a button when manually clicked.');
          }        
          break;
      case "Celebration":
          celebration.play(effect);
          break;
      case "Dice":
          if(!isManual) {
            diceHandler.send(effect, participant);
          } else {
            diceHandler.send(effect, {username: 'Streamer'});
          }          
          break;
      case "Game Control":
          if(!isManual) {
            controlHandler.press('mousedown', effect, control);
          } else {
            controlHandler.press('mousedown', effect);
            controlHandler.press('mouseup', effect);
          }          
          break;
      case "HTML":
          htmlHandler.show(effect);
          break;
      case "Play Sound":
          media.play(effect);
          break;
      case "Show Image":
          media.show(effect);
          break;
      case "Custom Script":
          try {
            if(!isManual) {
              customScriptHandler.processScript(effect.scriptName, control.controlId, username);
            } else {
              customScriptHandler.processScript(effect.scriptName, control.controlId, "Test Username");
            }          
          } catch(err) {
            renderWindow.webContents.send('error', "Oops! There was an error processing the custom script.");
          }
          break;
      case "Delay":
        delayBeforeNextEffect = effect.delay * 1000;
        return 
      default:
          renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
          console.log('Oops! This effect type doesnt exist: '+effectType);
  }

  // Update request object
  runEffectsRequest.previousIndex = currentIndex;

  // Run the next effect
  if(delayBeforeNextEffect === 0) {
    runEffects(runEffectsRequest, callback);
  } else {
    setTimeout(function(){
      runEffects(runEffectsRequest, callback);
    }, delayBeforeNextEffect); 
  }
}

exports.processEffects = processEffects;