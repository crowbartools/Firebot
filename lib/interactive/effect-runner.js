
const effects = require('./effect.js');

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
    
    effects.runEffects(runEffectsContext, function() {
      resolve();
    });
  });
}

exports.processEffects = processEffects;