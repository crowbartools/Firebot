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

// Chat Specific Handlers
const changeGroupSceneHandler = require('../chat/handlers/changeGroupScenesProcessor.js');
const changeUserSceneHandler = require('../chat/handlers/changeUserScenesProcessor.js');
const getGroupListHandler = require('../chat/handlers/getGroupListProcessor.js');
const getScenesListHandler = require('../chat/handlers/getScenesProcessor.js');

const EffectType = require('./EffectType.js');
const Interactive = require('./mixer-interactive.js');
const Chat = require('./mixer-chat.js');

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

  // Shared Varibles - these are shared between packet types.
  var packetType = runEffectsContext.type;
  var effects = runEffectsContext.effects;
  var firebot = runEffectsContext.firebot;
  var username = runEffectsContext.username;
  var isManual = (runEffectsContext.isManual === true);
  var control = runEffectsContext.control;

  // Type Specific Variables - these will only appear based on the packet type.
  if(packetType == "interactive"){
    var participant = runEffectsContext.participant;

    // Set the effect list to look through from the EffectType.js file.
    var EffectTypeList = EffectType.getEffectDictionary('interactive');

  } else if (packetType == "command"){
    var command = runEffectsContext.command;
    var userCommand = runEffectsContext.userCommand;
    var isWhisper = runEffectsContext.isWhisper;
    var chatEvent = runEffectsContext.chatEvent;

    // Set the effect list to look through from the EffectType.js file.
    var EffectTypeList = EffectType.getEffectDictionary('command');
  }
  
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

  // Check this effect for dependencies before running.
  // If all dependencies are not fulfilled, we will skip this effect.
  if ( checkDependencies(effectType) ){

    // For each effect, send it off to the appropriate handler.
    switch(effectType){
      case EffectTypeList.API_BUTTON:
          apiHandler.go(effect);
          break;
      case EffectTypeList.CHANGE_GROUP:
          if(!isManual) {
            changeGroupHandler.go(participant, effect, firebot);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectTypeList.CHANGE_USER_SCENE:
          if(!isManual){
            changeUserSceneHandler.go(firebot, chatEvent, isWhisper, userCommand, username);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectTypeList.CHANGE_GROUP_SCENE:
          if(!isManual){
            changeGroupSceneHandler.go(userCommand, chatEvent, username);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectTypeList.CHANGE_SCENE:
          if(!isManual || isApi) {
            changeSceneHandler.go(effect, firebot, userCommand);
          } else {
            console.log('Change Scene doesnt work when interactive isnt connected.');
          }          
          break;
      case EffectTypeList.CHAT:
          if(!isManual || isApi) {
            chatHandler.send(effect, {username: username}, control, userCommand);
          } else {
            chatHandler.send(effect, {username: 'Streamer'}, control, userCommand);
          }        
          break;
      case EffectTypeList.COOLDOWN:
          if(!isManual || isApi) {
            cdHandler.go(effect, firebot)
          } else {
            console.log('We wont cooldown a button when manually clicked.');
          }        
          break;
      case EffectTypeList.CELEBRATION:
          celebration.play(effect);
          break;
      case EffectTypeList.DICE:
          if(!isManual) {
            diceHandler.send(effect, {username: username});
          } else {
            diceHandler.send(effect, {username: 'Streamer'});
          }          
          break;
      case EffectTypeList.GAME_CONTROL:
          if(!isManual) {
            controlHandler.press('mousedown', effect, control);
          } else {
            controlHandler.press('mousedown', effect);
            controlHandler.press('mouseup', effect);
          }          
          break;
      case EffectTypeList.GROUP_LIST:
          if(!isManual){
            getGroupListHandler.go(chatEvent, username);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectTypeList.HTML:
          htmlHandler.show(effect);
          break;
      case EffectTypeList.PLAY_SOUND:
          media.sound(effect);
          break;
      case EffectTypeList.SCENE_LIST:
          if(!isManual){
            getScenesListHandler.go(firebot, username, chatEvent);
          } else {
            console.log('Change Group doesnt work with manual trigger.');
          }
          break;
      case EffectTypeList.SHOW_IMAGE:
          media.image(effect);
          break;
      case EffectTypeList.SHOW_VIDEO:
          media.video(effect);
          break;
      case EffectTypeList.CUSTOM_SCRIPT:
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
      case EffectTypeList.DELAY:
          delayBeforeNextEffect = effect.delay * 1000;
          break; 
      default:
          renderWindow.webContents.send('error', "Oops! This effect type doesnt exist: "+effectType);
          console.log('Oops! This effect type doesnt exist: '+effectType);
    }
  } else {
    console.log('Skipping '+effectType+'. Dependencies not met.');
    renderWindow.webContents.send('eventlog', {username: "System:", event: control.controlId+" has an effect we skipped over due to dependencies."});
  } // End dependency check

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

// Connection Dependency Checker
// This returns true if all dependency checks pass. IE: If interactive is required and we're connected to interactive.
// NOTE: I don't know of a way to check for overlay status right now so this skips that check.
function checkDependencies(effectName){
  var interactiveStatus = Interactive.getInteractiveStatus();
  var chatStatus = Chat.getChatStatus();
  var dependencies = EffectType.getDependenciesForEffect(effectName);
  var passedChecks = [];

  // Loop through dependencies
  for (dependency of dependencies){

    // Push passed checks to an array.
    if (dependency == "interactive" && interactiveStatus){
      passedChecks.push(dependency)
    }

    if(dependency == "chat" && chatStatus){
      passedChecks.push(dependency);
    }

    if(dependency == "overlay"){
      passedChecks.push(dependency);
    }
  }

  // If the passed checks array length matches the dependencies array length then all checks passed.
  if(dependencies.length === passedChecks.length){
    return true;
  } else {
    return false;
  }
}

exports.processEffects = processEffects;