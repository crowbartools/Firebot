var EffectType = require("../../lib/interactive/EffectType");

exports.getAllEffects = function(req, res) {
  res.json(EffectType.getAllEffectTypes());
}

exports.runEffects = function(req, res) {
  res.status(200).send({success: true})
}