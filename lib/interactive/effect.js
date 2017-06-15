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

var Effect = {
  API_BUTTON: "API Button",
  CHANGE_GROUP: "Change Group",
  CHANGE_SCENE: "Change Scene",
  CHAT: "Chat",
  COOLDOWN: "Cooldown",
  CELEBRATION: "Celebration",
  DICE: "Dice",
  GAME_CONTROL: "Game Control",
  HTML: "HTML",
  PLAY_SOUND: "Play Sound",
  SHOW_IMAGE: "Show Image",
  CUSTOM_SCRIPT: "Custom Script",
  DELAY: "Delay"
}

function runEffects(runEffectsContext, callback) {
  // Varibles
  var effects = runEffectsContext.effects;
  var firebot = runEffectsContext.firebot;
  var control = runEffectsContext.control;
  var participant = runEffectsContext.participant;
  var username = runEffectsContext.username;
  var isManual = (runEffectsContext.isManual === true);
  
  var currentIndex = runEffectsContext.previousIndex + 1;
  var effectsCount = Object.keys(effects).length;
    
  if(effectsCount < currentIndex) {
    callback(); 
    return; 
  }
  
  var effect = effects[currentIndex.toString()];
  var effectType = effect.type;

  var delayBeforeNextEffect = 0;
  // For each effect, send it off to the appropriate handler.
  switch(effectType){
      case Effect.API_BUTTON:
          apiHandler.go(effect);
          break;
      case Effect.CHANGE_GROUP:
          if(!isManual) {
            changeGroupHandler.go(participant, effect, firebot);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case Effect.CHANGE_SCENE:
          if(!isManual) {
            changeSceneHandler.go(effect, firebot);
          } else {
            console.log('Change Scene doesnt work with manual trigger.');
          }          
          break;
      case Effect.CHAT:
          if(!isManual) {
            chatHandler.send(effect, participant);
          } else {
            chatHandler.send(effect, {username: 'Streamer'});
          }        
          break;
      case Effect.COOLDOWN:
          if(!isManual) {
            cdHandler.go(effect, firebot)
          } else {
            console.log('We wont cooldown a button when manually clicked.');
          }        
          break;
      case Effect.CELEBRATION:
          celebration.play(effect);
          break;
      case Effect.DICE:
          if(!isManual) {
            diceHandler.send(effect, participant);
          } else {
            diceHandler.send(effect, {username: 'Streamer'});
          }          
          break;
      case Effect.GAME_CONTROL:
          if(!isManual) {
            controlHandler.press('mousedown', effect, control);
          } else {
            controlHandler.press('mousedown', effect);
            controlHandler.press('mouseup', effect);
          }          
          break;
      case Effect.HTML:
          htmlHandler.show(effect);
          break;
      case Effect.PLAY_SOUND:
          media.play(effect);
          break;
      case Effect.SHOW_IMAGE:
          media.show(effect);
          break;
      case Effect.CUSTOM_SCRIPT:
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
      case Effect.DELAY:
          delayBeforeNextEffect = effect.delay * 1000;
          break; 
      default:
          renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
          console.log('Oops! This effect type doesnt exist: '+effectType);
  }

  // Update context object
  runEffectsContext.previousIndex = currentIndex;

  // Run the next effect
  if(delayBeforeNextEffect === 0) {
    runEffects(runEffectsContext, callback);
  } else {
    setTimeout(function(){
      runEffects(runEffectsContext, callback);
    }, delayBeforeNextEffect); 
  }
}

exports.Effect = Effect;
exports.runEffects = runEffects;