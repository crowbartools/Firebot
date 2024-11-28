"use strict";

const express = require("express");
const router = express.Router(); //eslint-disable-line new-cap
const logger = require("../../../backend/logwrapper");

router.use(function log(req, res, next) {
    // here we could do stuff for every request if we wanted
    logger.info(`API Request from: ${req.socket.remoteAddress}, for path: ${req.originalUrl}`);
    next();
});

// Auth
const auth = require("./controllers/authApiController");

router.route("/auth").get(auth.getAuth);

router.route("/auth/callback2").get(auth.getAuthCallback);
router.route("/auth/tokencallback").get(auth.getAuthCallback);

// Status
const status = require("./controllers/statusApiController");
router.route("/status").get(status.getStatus);

// Effects
const effects = require("./controllers/effectsApiController");

router.route("/effects").get(effects.getEffects).post(effects.runEffects);

router.route("/effects/preset").get(effects.getPresetLists);

router.route("/effects/:effectId").get(effects.getEffect);

router
    .route("/effects/preset/:presetListId")
    .get(effects.runPresetListSynchronous)
    .post(effects.runPresetListSynchronous);

router
    .route("/effects/preset/:presetListId/run")
    .get(effects.triggerPresetListAsync)
    .post(effects.triggerPresetListAsync);

// Commands
const commands = require("./controllers/commandsApiController");

router.route("/commands/system").get(commands.getSystemCommands);

router.route("/commands/system/:sysCommandId").get(commands.getSystemCommand);

router.route("/commands/system/:sysCommandId/run").get(commands.runSystemCommand).post(commands.runSystemCommand);

router.route("/commands/custom").get(commands.getCustomCommands);

router.route("/commands/custom/:customCommandId").get(commands.getCustomCommand);

router.route("/commands/custom/:customCommandId/run").get(commands.runCustomCommand).post(commands.runCustomCommand);

// Fonts
const fonts = require("./controllers/fontsApiController");
router.route("/fonts").get(fonts.getFontNames);

router.route("/fonts/:name").get(fonts.getFont);

// custom variables
const customVariables = require("./controllers/customVariableApiController");

router.route("/custom-variables").get(customVariables.getCustomVariables);

router
    .route("/custom-variables/:variableName")
    .get(customVariables.getCustomVariable)
    .post(customVariables.setCustomVariable);

// builtin variables
const variableManager = require("./controllers/variableApiController");

router.route("/variables").get(variableManager.getReplaceVariables);

// viewers
const viewers = require("./controllers/viewersApiController");

router.route("/viewers").get(viewers.getAllUsers);

router.route("/viewers/export").get(viewers.getAllUserDataAsJSON);

router.route("/viewers/:userId").get(viewers.getUserMetadata);

router.route("/viewers/:userId/metadata/:metadataKey")
    .post(viewers.updateUserMetadataKey)
    .put(viewers.updateUserMetadataKey)
    .delete(viewers.removeUserMetadataKey);

router.route("/viewers/:userId/currency").get(viewers.getUserCurrency);

router.route("/viewers/:userId/currency/:currencyId").get(viewers.getUserCurrency).post(viewers.setUserCurrency);

router.route("/viewers/:userId/customRoles").get(viewers.getUserCustomRoles);

router
    .route("/viewers/:userId/customRoles/:customRoleId")
    .post(viewers.addUserToCustomRole)
    .delete(viewers.removeUserFromCustomRole);

// Custom Roles
const customRoles = require("./controllers/customRolesApiController");

router.route("/customRoles").get(customRoles.getCustomRoles);

router.route("/customRoles/:customRoleId").get(customRoles.getCustomRoleById);

router.route("/customRoles/:customRoleId/clear").get(customRoles.removeAllViewersFromRole);

router
    .route("/customRoles/:customRoleId/viewer/:userId")
    .post(customRoles.addUserToCustomRole)
    .delete(customRoles.removeUserFromCustomRole);

// currencies
const currency = require("./controllers/currencyApiController");

router.route("/currency").get(currency.getCurrencies);

router.route("/currency/:currencyName").get(currency.getCurrencies);

router.route("/currency/:currencyName/top").get(currency.getTopCurrencyHolders);

// Quotes
const quotes = require("./controllers/quotesApiController");

router.route("/quotes").get(quotes.getQuotes).post(quotes.postQuote);

router
    .route("/quotes/:quoteId")
    .get(quotes.getQuote)
    .put(quotes.putQuote)
    .patch(quotes.patchQuote)
    .delete(quotes.deleteQuote);

// Counters
const counters = require("./controllers/countersApiController");

router.route("/counters").get(counters.getCounters);

router.route("/counters/:counterId").get(counters.getCounterById).post(counters.updateCounter);

// Timers
const timers = require("./controllers/timersApiController");

router.route("/timers").get(timers.getTimers);

router.route("/timers/:timerId").get(timers.getTimerById);

// Action can be "toggle", "enable", "disable" or "clear"
router.route("/timers/:timerId/:action").get(timers.updateTimerById);

const queues = require("./controllers/effectQueuesApiController");

router.route("/queues").get(queues.getQueues);

router.route("/queues/:queueId").get(queues.getQueueById);

router.route("/queues/:queueId/pause").get(queues.pauseQueue).post(queues.pauseQueue);

router.route("/queues/:queueId/resume").get(queues.resumeQueue).post(queues.resumeQueue);

router.route("/queues/:queueId/toggle").get(queues.toggleQueue).post(queues.toggleQueue);

router.route("/queues/:queueId/clear").get(queues.clearQueue).post(queues.clearQueue);

module.exports = router;
