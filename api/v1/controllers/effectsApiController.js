'use strict';

const settingsAccess = require('../../../lib/common/settings-access.js').settings;
const dataAccess = require('../../../lib/common/data-access');
const mixerInteractive = require('../../../lib/common/mixer-interactive.js');
const Effects = require("../../../lib/common/EffectType");
const effectsBuilder = require("../../../lib/common/handlers/custom-scripts/effectsObjectBuilder");
const effectRunner = require('../../../lib/common/effect-runner');


exports.getEffects = function(req, res) {

    let response = Effects.getEffectDefinitions(req.query.trigger);

    if (req.query.dependency) {
        response = response.filter((e) => e.dependencies.includes(req.query.dependency));
    }

    if (req.query.onlynames === "true") {
        response = response.map((e) => {
            return e.name;
        });
    }

    res.json(response);
};

exports.getEffect = function(req, res) {
    let effectIdOrName = req.params.effect;
    let effect = Effects.getEffect(effectIdOrName);
    if (effect == null) {
        res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
        return;
    }

    res.json(effect);
};

exports.getEffectTriggers = function(req, res) {
    let effectIdOrName = req.params.effect;
    let effect = Effects.getEffect(effectIdOrName);
    if (effect == null) {
        res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
        return;
    }

    res.json(effect.triggers);
};

exports.getEffectDependencies = function(req, res) {
    let effectIdOrName = req.params.effect;
    let effect = Effects.getEffect(effectIdOrName);
    if (effect == null) {
        res.status(404).send({status: 'error', message: `Cannot find effect '${effectIdOrName}'`});
        return;
    }

    res.json(effect.dependencies);
};


exports.runEffects = function(req, res) {
    if (mixerInteractive.getInteractiveStatus() === false) {
        res.status(500).send({status: 'error', message: "Interactive is not connected."});
        return;

    } else if (req.body.effects != null) {
        let builtEffects = effectsBuilder.buildEffects(req.body.effects);

        let control = {
            text: "API",
            cost: 0,
            cooldown: 0
        };

        let username = req.body.username;
        if (username == null) {
            username = "API Call";
        }

        let participant = req.body.participant;

        // Get settings for last board.
        let dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/" + settingsAccess.getLastBoardName());
        let boardJson = dbControls.getData('/');

        let processEffectsRequest = {
            type: Effects.TriggerType.API,
            effects: builtEffects,
            firebot: boardJson,
            participant: participant,
            username: username,
            control: control,
            isManual: participant == null
        };

        effectRunner.processEffects(processEffectsRequest);

        res.status(200).send({status: 'success'});
    } else {
        res.status(500).send({status: 'error', message: "No effects provided."});
    }
};
