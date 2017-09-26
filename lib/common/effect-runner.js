// Handlers
const mediaHandler = require('./handlers/mediaProcessor.js');
const apiHandler = require('./handlers/apiProcessor.js');
const chatHandler = require('./handlers/chatProcessor.js');
const celebration = require('./handlers/celebrationProcessor.js');
const media = require('./handlers/mediaProcessor.js');
const cdHandler = require('./handlers/cooldownProcessor.js');
const controlHandler = require('./handlers/game-controls/controlProcessor.js');
const changeGroupHandler = require('./handlers/changeGroupProcessor.js');
const changeSceneHandler = require('./handlers/changeSceneProcessor.js');
const customScriptHandler = require('./handlers/custom-scripts/customScriptProcessor.js');
const diceHandler = require('./handlers/diceProcessor.js');
const htmlHandler = require('./handlers/htmlProcessor.js');

const EffectType = require('./EffectType.js').EffectType;

function processEffects(processEffectsRequest) {
  return new Promise((resolve, reject) => {
    
    var username = "";
    if(processEffectsRequest.participant) {
      username = processEffectsRequest.participant.username;
    }
    
    // Add some values to our wrapper
    var runEffectsContext = processEffectsRequest;
    runEffectsContext["previousIndex"] = 0;
    runEffectsContext["username"] = username;
    
    runEffects(runEffectsContext, function() {
      resolve();
    });
  });
}

function runEffects(runEffectsContext, callback) {
  // Varibles
  var effects = runEffectsContext.effects;
  var firebot = runEffectsContext.firebot;
  var control = runEffectsContext.control;
  var participant = runEffectsContext.participant;
  var username = runEffectsContext.username;
  var isManual = (runEffectsContext.isManual === true);
  
  var isApi = (runEffectsContext.isApi === true)
  
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
      case EffectType.API_BUTTON:
          apiHandler.go(effect);
          break;
      case EffectType.CHANGE_GROUP:
          if(!isManual) {
            changeGroupHandler.go(participant, effect, firebot);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectType.CHANGE_SCENE:
          if(!isManual || isApi) {
            changeSceneHandler.go(effect, firebot);
          } else {
            console.log('Change Scene doesnt work when interactive isnt connected.');
          }          
          break;
      case EffectType.CHAT:
          if(!isManual || isApi) {
            chatHandler.send(effect, {username: username}, control);
          } else {
            chatHandler.send(effect, {username: 'Streamer'}, control);
          }        
          break;
      case EffectType.COOLDOWN:
          if(!isManual || isApi) {
            cdHandler.go(effect, firebot)
          } else {
            console.log('We wont cooldown a button when manually clicked.');
          }        
          break;
      case EffectType.CELEBRATION:
          celebration.play(effect);
          break;
      case EffectType.DICE:
          if(!isManual) {
            diceHandler.send(effect, {username: username});
          } else {
            diceHandler.send(effect, {username: 'Streamer'});
          }          
          break;
      case EffectType.GAME_CONTROL:
          if(!isManual) {
            controlHandler.press('mousedown', effect, control);
          } else {
            controlHandler.press('mousedown', effect);
            controlHandler.press('mouseup', effect);
          }          
          break;
      case EffectType.HTML:
          htmlHandler.show(effect);
          break;
      case EffectType.PLAY_SOUND:
          media.sound(effect);
          break;
      case EffectType.SHOW_IMAGE:
          media.image(effect);
          break;
      case EffectType.SHOW_VIDEO:
          media.video(effect);
          break;
      case EffectType.CUSTOM_SCRIPT:
          try {
            if(!isManual) {
              customScriptHandler.processScript(effect.scriptName, effect.parameters, control, participant, firebot);
            } else {
              customScriptHandler.processScript(effect.scriptName, effect.parameters, control, {username: 'Test Username'}, firebot);
            }          
          } catch(err) {
            renderWindow.webContents.send('error', "Oops! There was an error processing the custom script.");
          }
          break;
      case EffectType.DELAY:
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

exports.processEffects = processEffects;