var appRouter = function(api) {

  var effects = require('../controllers/effectsApiController');

  api.route('/effects')
   .get(effects.getAllEffects)
   .post(effects.runEffects);
  
}

module.exports = appRouter;