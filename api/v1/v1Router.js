const express = require('express')
const router = express.Router()

router.use(function log(req, res, next) {
  // here we could do stuff for every request if we wanted
  console.log(`API Request from: ${req.headers.host}, for path: ${req.originalUrl}`);
  next()
});


// Effects 
const effects = require('./controllers/effectsApiController');

router.route('/effects')
  .get(effects.getAllEffects)
  .post(effects.runEffects);
 
 
 // Groups
const groups = require('./controllers/groupsApiController');

router.route('/groups')
  .get(groups.getAllGroups);
  
router.route('/groups/:groupName')
  .get(groups.getGroup);
  
router.route('/groups/:groupName/users')
  .get(groups.getGroupUsers);

module.exports = router;