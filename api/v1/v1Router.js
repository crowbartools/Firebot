const express = require('express')
const router = express.Router()

router.use(function log(req, res, next) {
  // here we could do stuff for every request if we wanted
  console.log(`API Request from: ${req.headers.host}, for path: ${req.originalUrl}`);
  next()
});

// Status 
const status = require('./controllers/statusApiController');

router.route('/status')
  .get(status.getStatus);
  

// Effects 
const effects = require('./controllers/effectsApiController');

router.route('/effects')
  .get(effects.getEffects)
  .post(effects.runEffects);
  
  router.route('/effects/:effect')
    .get(effects.getEffect)
    
  router.route('/effects/:effect/triggers')
    .get(effects.getEffectTriggers)
    
  router.route('/effects/:effect/dependencies')
    .get(effects.getEffectDependencies)
 
 
 // Groups
const groups = require('./controllers/groupsApiController');

router.route('/groups')
  .get(groups.getAllGroups);
  
router.route('/groups/:groupName')
  .get(groups.getGroup);
  
router.route('/groups/:groupName/users')
  .get(groups.getGroupUsers);

module.exports = router;