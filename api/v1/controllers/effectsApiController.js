const settingsAccess = require('../../../lib/common/settings-access.js').settings;
const dataAccess = require('../../../lib/common/data-access');

const Effects = require("../../../lib/common/EffectType");
const effectsBuilder = require("../../../lib/common/handlers/custom-scripts/effectsObjectBuilder");
const effectRunner = require('../../../lib/common/effect-runner');


exports.getEffects = function(req, res) {
  
  var response = Effects.getEffectDefinitions(req.query.trigger);
  
  if(req.query.dependency) {
    response = response.filter((e) => e.dependencies.includes(req.query.dependency));
  }
  
  if(req.query.onlynames == "true") {
    response = response.map((e) => { return e.name; });
  }
  
  res.json(response);
}

exports.getEffect = function(req, res) {
  var effectIdOrName = req.params.effect;
  var effect = Effects.getEffect(effectIdOrName);
  if(effect == null) {
    res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
    return;
  }
  
  res.json(effect);
}

exports.getEffectTriggers = function(req, res) {
  var effectIdOrName = req.params.effect;
  var effect = Effects.getEffect(effectIdOrName);
  if(effect == null) {
    res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
    return;
  }
  
  res.json(effect.triggers);
}

exports.getEffectDependencies = function(req, res) {
  var effectIdOrName = req.params.effect;
  var effect = Effects.getEffect(effectIdOrName);
  if(effect == null) {
    res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
    return;
  }
  
  res.json(effect.dependencies);
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
      cost: 0,
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