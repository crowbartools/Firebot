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

router.route("/effects/preset/:presetListId")
    .post(effects.runPresetList);

router.route("/effects/preset/:presetListId")
    .post(effects.runPresetList)
    .get(effects.runPresetList);

router.route("/effects/:effectId")
    .get(effects.getEffect);


// Fonts
const fonts = require("./controllers/fontsApiController");
router.route("/fonts")
    .get(fonts.getFontNames);

router.route("/fonts/:name")
    .get(fonts.getFont);


module.exports = router;
