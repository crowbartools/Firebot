"use strict";

const express = require("express");
const router = express.Router(); //eslint-disable-line new-cap
const logger = require("../../../backend/logwrapper");

router.use(function log(req, res, next) {
    // here we could do stuff for every request if we wanted
    logger.info(
        `API Request from: ${req.headers.host}, for path: ${req.originalUrl}`
    );
    next();
});

// Auth
const auth = require("./controllers/authApiController");

router.route("/auth").get(auth.getAuth);

router.route("/auth/callback").get(auth.getAuthCallback);

// Status
const status = require("./controllers/statusApiController");
router.route("/status").get(status.getStatus);

// Effects
const effects = require("./controllers/effectsApiController");

router
    .route("/effects")
    .get(effects.getEffects)
    .post(effects.runEffects);

router.route("/effects/preset")
    .get(effects.getPresetLists);

router.route("/effects/:effectId")
    .get(effects.getEffect);

router.route("/effects/preset/:presetListId")
    .get(effects.runPresetList)
    .post(effects.runPresetList);


// Fonts
const fonts = require("./controllers/fontsApiController");
router.route("/fonts")
    .get(fonts.getFontNames);

router.route("/fonts/:name")
    .get(fonts.getFont);


// custom variables
const customVariables = require("./controllers/customVariableApiController");

router
    .route("/custom-variables")
    .get(customVariables.getCustomVariables);

router.route("/custom-variables/:variableName")
    .get(customVariables.getCustomVariable)
    .post(customVariables.setCustomVariable);


// viewers
const viewers = require("./controllers/viewersApiController");

router
    .route("/viewers")
    .get(viewers.getAllUsers);

router
    .route("/viewers/:userId")
    .get(viewers.getUserMetadata);

router
    .route("/viewers/:userId/currency")
    .get(viewers.getUserCurrency);

router
    .route("/viewers/:userId/currency/:currencyId")
    .get(viewers.getUserCurrency)
    .post(viewers.setUserCurrency);


// currencies
const currency = require("./controllers/currencyApiController");

router
    .route("/currency")
    .get(currency.getCurrencies);

router
    .route("/currency/:currencyName")
    .get(currency.getCurrencies);

router
    .route("/currency/:currencyName/top")
    .get(currency.getTopCurrencyHolders);

// Quotes
const quotes = require("./controllers/quotesApiController");

router
    .route("/quotes")
    .get(quotes.getQuotes)
    .post(quotes.postQuote);

router
    .route("/quotes/:quoteId")
    .get(quotes.getQuote)
    .put(quotes.putQuote)
    .patch(quotes.patchQuote)
    .delete(quotes.deleteQuote);

module.exports = router;
