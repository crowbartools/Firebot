"use strict";
const { EffectTrigger } = require("../../../../shared/effect-constants");
const effectsManager = require("../../../../backend/effects/effectManager");
const effectRunner = require("../../../../backend/common/effect-runner");
const presetEffectListManager = require("../../../../backend/effects/preset-lists/preset-effect-list-manager");

exports.getEffects = function(req, res) {
    let effectDefs = effectsManager.getEffectDefinitions();

    if (req.query.trigger) {
        effectDefs = effectDefs.filter(effect => effect.triggers == null || effect.triggers[req.query.trigger]);
    }

    res.json(effectDefs);
};

exports.getEffect = function(req, res) {
    const effectId = req.params.effectId;
    const effect = effectsManager.getEffectById(effectId);
    if (effect == null) {
        res.status(404).send({
            status: "error",
            message: `Cannot find effect '${effectId}'`
        });
        return;
    }

    res.json(effect.definition);
};

exports.runEffects = async function(req, res) {
    if (req.body.effects != null) {

        const triggerData = req.body && req.body.triggerData || {};
        if (triggerData.username == null) {
            triggerData.username = "API Call";
        }

        const processEffectsRequest = {
            trigger: {
                type: EffectTrigger.API,
                metadata: triggerData
            },
            effects: req.body.effects
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
            res.status(200).send({ status: "success" });
        } catch (err) {
            res.status(500).send({ status: "error", message: err.message });
        }
    } else {
        res.status(400).send({ status: "error", message: "No effects provided." });
    }
};

exports.getPresetLists = async function(req, res) {
    const presetLists = presetEffectListManager.getAllItems();

    if (presetLists == null) {
        return res.status(500).send({
            status: "error",
            message: "Unknown error getting preset effect lists"
        });
    }

    const formattedPresetLists = presetLists.map(presetList => {
        return {
            id: presetList.id,
            name: presetList.name,
            args: presetList.args.map(arg => arg.name)
        };
    });

    return res.json(formattedPresetLists);
};

async function runPresetEffectList(req, res, waitForCompletion = false) {
    const presetListId = req.params.presetListId;

    if (presetListId == null) {
        return res.status(400).send({
            status: "error",
            message: `No presetListId provided`
        });
    }

    const presetList = presetEffectListManager.getItem(presetListId);
    if (presetList == null) {
        return res.status(404).send({
            status: "error",
            message: `Cannot find preset effect list '${presetList}'`
        });
    }

    const body = req.body || {};
    const query = req.query || {};
    let args, username;

    // GET
    if (req.method === "GET") {
        username = query.username;
        args = query;

    // POST
    } else if (req.method === "POST") {
        username = body.username;
        args = body.args;

    // Not GET or POST
    } else {
        return res.status(404).send({ status: "error", message: "Invalid request method" });
    }

    const processEffectsRequest = {
        trigger: {
            type: EffectTrigger.PRESET_LIST,
            metadata: {
                username,
                presetListArgs: args
            }
        },
        effects: presetList.effects
    };

    try {
        if (waitForCompletion === true) {
            await effectRunner.processEffects(processEffectsRequest);
        } else {
            effectRunner.processEffects(processEffectsRequest);
        }
        res.status(200).send({ status: "success" });
    } catch (err) {
        res.status(500).send({ status: "error", message: err.message });
    }
}

exports.runPresetListSynchronous = async function(req, res) {
    runPresetEffectList(req, res, true);
};

exports.triggerPresetListAsync = async function(req, res) {
    runPresetEffectList(req, res, false);
};
