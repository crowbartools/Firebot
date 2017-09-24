const settingsAccess = require('../../lib/interactive/settings-access.js').settings;
const dataAccess = require('../../lib/data-access');

const EffectType = require("../../lib/interactive/EffectType");
const effectsBuilder = require("../../lib/interactive/helpers/effectsObjectBuilder");
const effectRunner = require('../../lib/interactive/effect-runner');


exports.getAllEffects = function(req, res) {
  res.json(EffectType.getAllEffectTypes());
}

exports.runEffects = function(req, res) {
  if(interactiveConnected == false) {
    res.status(500).send({status: 'error', message: "Interactive is not connected."});
    return;
  }
  else if(req.body.effects != null) {
    var builtEffects = effectsBuilder.buildEffects(req.body.effects);
    
    var control = { 
      text: "API",
      sparks: 0,
      cooldown: 0
    }
    
    var username = req.body.username;
    if(username == null) {
      username = "API Call";
    }
    
    var participant = req.body.participant;

    // Get settings for last board.
    var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+settingsAccess.getLastBoardName());
    var boardJson = dbControls.getData('/');  
    
    var processEffectsRequest = {
      effects: builtEffects,
      firebot: boardJson,
      participant: participant,
      username: username,
      control: control,
      isManual: participant == null,
      isApi: true
    }
    
    effectRunner.processEffects(processEffectsRequest);  
    
    res.status(200).send({status: 'success'});
  } else {
    res.status(500).send({status: 'error', message: "No effects provided."});
  }
}