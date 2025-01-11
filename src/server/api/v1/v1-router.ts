import { Router, Request, Response, NextFunction } from "express";
const router = Router();//eslint-disable-line new-cap
import logger from "../../../backend/logwrapper";

router.use(function log(req: Request, res: Response, next: NextFunction) {
    // here we could do stuff for every request if we wanted
    logger.debug(`API Request from: ${req.socket.remoteAddress}, for path: ${req.originalUrl}`);
    next();
});

// Auth
import * as auth from "./controllers/authApiController";

router.route("/auth")
    .get(auth.getAuth);

router.route("/auth/callback2")
    .get(auth.getAuthCallback);

router.route("/auth/tokencallback")
    .get(auth.getAuthCallback);

// Status
import * as status from "./controllers/status-api-controller";

router.route("/status")
    .get(status.getStatus);

// Effects
import * as effects from "./controllers/effects-api-controller";

router.route("/effects")
    .get(effects.getEffects)
    .post(effects.runEffects);

router.route("/effects/preset")
    .get(effects.getPresetLists);

router.route("/effects/:effectId")
    .get(effects.getEffect);

router.route("/effects/preset/:presetListId")
    .get(effects.runPresetListSynchronous)
    .post(effects.runPresetListSynchronous);

router.route("/effects/preset/:presetListId/run")
    .get(effects.triggerPresetListAsync)
    .post(effects.triggerPresetListAsync);

// Commands
import * as commands from "./controllers/commandsApiController";

router.route("/commands/system")
    .get(commands.getSystemCommands);

router.route("/commands/system/:sysCommandId")
    .get(commands.getSystemCommand);

router.route("/commands/system/:sysCommandId/run")
    .get(commands.runSystemCommand)
    .post(commands.runSystemCommand);

router.route("/commands/custom")
    .get(commands.getCustomCommands);

router.route("/commands/custom/:customCommandId")
    .get(commands.getCustomCommand);

router.route("/commands/custom/:customCommandId/run")
    .get(commands.runCustomCommand)
    .post(commands.runCustomCommand);

// Fonts
import * as fonts from "./controllers/fonts-api-controller";

router.route("/fonts")
    .get(fonts.getFontNames);

router.route("/fonts/:name")
    .get(fonts.getFont);

// Custom Variables
import * as customVariables from "./controllers/custom-variable-api-controller";

router.route("/custom-variables")
    .get(customVariables.getCustomVariables);

router.route("/custom-variables/:variableName")
    .get(customVariables.getCustomVariable)
    .post(customVariables.setCustomVariable);

// Built-in Variables
import * as variableManager from "./controllers/variable-api-controller";

router.route("/variables")
    .get(variableManager.getReplaceVariables);

// Viewers
import * as viewers from "./controllers/viewers-api-controller";

router.route("/viewers")
    .get(viewers.getAllUsers);

router.route("/viewers/export")
    .get(viewers.getAllUserDataAsJSON);

router.route("/viewers/:userId")
    .get(viewers.getUserMetadata);

router.route("/viewers/:userId/metadata/:metadataKey")
    .post(viewers.updateUserMetadataKey)
    .put(viewers.updateUserMetadataKey)
    .delete(viewers.removeUserMetadataKey);

router.route("/viewers/:userId/currency")
    .get(viewers.getUserCurrency);

router.route("/viewers/:userId/currency/:currencyId")
    .get(viewers.getUserCurrency)
    .post(viewers.setUserCurrency);

router.route("/viewers/:userId/customRoles")
    .get(viewers.getUserCustomRoles);

router.route("/viewers/:userId/customRoles/:customRoleId")
    .post(viewers.addUserToCustomRole)
    .delete(viewers.removeUserFromCustomRole);

// Custom Roles
import * as customRoles from "./controllers/custom-roles-api-controller";

router.route("/customRoles")
    .get(customRoles.getCustomRoles);

router.route("/customRoles/:customRoleId")
    .get(customRoles.getCustomRoleById);

router.route("/customRoles/:customRoleId/clear")
    .get(customRoles.removeAllViewersFromRole);

router.route("/customRoles/:customRoleId/viewer/:userId")
    .post(customRoles.addUserToCustomRole)
    .delete(customRoles.removeUserFromCustomRole);

// Currencies
import * as currency from "./controllers/currency-api-controller";

router.route("/currency")
    .get(currency.getCurrencies);

router.route("/currency/:currencyName")
    .get(currency.getCurrencies);

router.route("/currency/:currencyName/top")
    .get(currency.getTopCurrencyHolders);

// Quotes
import * as quotes from "./controllers/quotes-api-controller";

router.route("/quotes")
    .get(quotes.getQuotes)
    .post(quotes.postQuote);

router.route("/quotes/:quoteId")
    .get(quotes.getQuote)
    .put(quotes.putQuote)
    .patch(quotes.patchQuote)
    .delete(quotes.deleteQuote);

// Counters
import * as counters from "./controllers/counters-api-controller";

router.route("/counters")
    .get(counters.getCounters);

router.route("/counters/:counterId")
    .get(counters.getCounterById)
    .post(counters.updateCounter);

// Timers
import * as timers from "./controllers/timers-api-controller";

router.route("/timers")
    .get(timers.getTimers);

router.route("/timers/:timerId")
    .get(timers.getTimerById);

// Action can be "toggle", "enable", "disable" or "clear"
router.route("/timers/:timerId/:action")
    .get(timers.updateTimerById);

import * as queues from "./controllers/effect-queues-api-controller";

router.route("/queues")
    .get(queues.getQueues);

router.route("/queues/:queueId")
    .get(queues.getQueueById);

router.route("/queues/:queueId/pause")
    .get(queues.pauseQueue)
    .post(queues.pauseQueue);

router.route("/queues/:queueId/resume")
    .get(queues.resumeQueue)
    .post(queues.resumeQueue);

router.route("/queues/:queueId/toggle")
    .get(queues.toggleQueue)
    .post(queues.toggleQueue);

router.route("/queues/:queueId/clear")
    .get(queues.clearQueue)
    .post(queues.clearQueue);

module.exports = router;
