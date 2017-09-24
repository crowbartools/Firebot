var appRouter = function(api) {
  
  var effects = require('../controllers/effectsApiController');
  
  api.route('/effects')
    .get(effects.getAllEffects)
    .post(effects.runEffects);
   
   
  const groups = require('../controllers/groupsApiController');
  
  api.route('/groups')
    .get(groups.getAllGroups);
    
  api.route('/groups/:groupName')
    .get(groups.getGroup);
    
  api.route('/groups/:groupName/users')
    .get(groups.getGroupUsers);
  
}

module.exports = appRouter;