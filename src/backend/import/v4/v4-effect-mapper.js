"use strict";

const logger = require("../../logwrapper");

const { IncompatibilityError } = require("./import-helpers").errors;

const uuid = require("uuid/v1");

//v4 effect types are keys, supported v5 types are values
const v4EffectTypeMap = {
    "API Button": "firebot:api",
    "Celebration": "firebot:celebration",
    "Change Group": null, // v5 is fundamentally different here, cant import
    "Change Scene": null, // v5 is fundamentally different here, cant import
    "Chat": "firebot:chat",
    "Cooldown": null, // vastly different than v5 equivalent, extremely difficult to import correctly
    "Custom Script": "firebot:customscript",
    "Run Command": null, // was only available to custom scripts in v4, don't think it will even show up
    "Delay": "firebot:delay",
    "Dice": "firebot:dice",
    "Game Control": "firebot:controlemulation",
    "HTML": "firebot:html",
    "Show Event": null, // going to deprecate the v5 equivalent so not going to bother importing
    "Play Sound": "firebot:playsound",
    "Random Effect": "firebot:randomeffect",
    "Effect Group": "firebot:run-effect-list",
    "Show Image": "firebot:showImage",
    "Create Clip": "firebot:clip",
    "Show Video": "firebot:playvideo",
    "Clear Effects": null,
    "Write Text To File": "firebot:filewriter",
    "Group List": null,
    "Scene List": null,
    "Command List": null, // v5 equivalent doesnt exist as theres a sys cmd for this now
    "Change User Scene": null,
    "Change Group Scene": null,
    "Update Button": null, // vastly different than v5 equivalent, extremely difficult to import correctly
    "Toggle Connection": "firebot:toggleconnection",
    "Show Text": "firebot:showtext"
};

const v4IncompatibilityReasonMap = {
    "Change Group": "V5 handles groups/scenes fundamentally different",
    "Change Scene": "V5 handles groups/scenes fundamentally different",
    "Cooldown": "V5 handles control cooldowns fundamentally different",
    "Run Command": "Impossible to import effect",
    "Show Event": "Effect is no longer supported",
    "Clear Effects": "Effect is fundamentally different in V5",
    "Group List": "V5 handles groups/scenes fundamentally different",
    "Scene List": "V5 handles groups/scenes fundamentally different",
    "Command List": "Effect doesn't exist in V5 as this functionality now exists as a System Command",
    "Change User Scene": "V5 handles groups/scenes fundamentally different",
    "Change Group Scene": "V5 handles groups/scenes fundamentally different",
    "Update Button": "V5 handles control updates fundamentally different"
};

function updateReplaceVariables(effect) {
    if (effect == null) {
        return effect;
    }

    const keys = Object.keys(effect);

    for (const key of keys) {
        const value = effect[key];

        if (value && typeof value === "string") {
            effect[key] = value.replace(/\$\(user\)/, "$user");
        } else if (value && typeof value === "object") {
            effect[key] = updateReplaceVariables(value);
        }
    }

    return effect;
}

function mapV4Effect (v4Effect, triggerData, incompatibilityWarnings) {
    if (v4Effect == null || v4Effect.type == null) {
        throw new IncompatibilityError("v4 effect isn't formatted properly.");
    }
    const v5EffectTypeId = v4EffectTypeMap[v4Effect.type];

    // Null signifies we don't support this v4 effect
    if (v5EffectTypeId == null) {
        const reason = v4IncompatibilityReasonMap[v4Effect.type] || "Unknown effect";
        throw new IncompatibilityError(reason);
    }

    let v5Effect = v4Effect;
    v5Effect.type = v5EffectTypeId;
    v5Effect.id = uuid();

    //do any per effect type tweaks here
    if (v5Effect.type === "firebot:playsound") {
        v5Effect.filepath = v5Effect.file;
    }

    if (v5Effect.type === "firebot:randomeffect" || v5Effect.type === "firebot:run-effect-list") {

        const mapResult = exports.mapV4EffectList(v5Effect.effectList, triggerData);

        mapResult.incompatibilityWarnings.forEach(iw => incompatibilityWarnings.push(iw));

        v5Effect.effectList = mapResult.effects;
    }

    v5Effect = updateReplaceVariables(v5Effect);

    return v5Effect;
}

exports.mapV4EffectList = (v4EffectList, triggerData) => {
    const incompatibilityWarnings = [];

    if (v4EffectList == null) {
        return { effects: null, incompatibilityWarnings: incompatibilityWarnings};
    }

    // v4 effect lists can be objects or arrays
    const v4Effects = Array.isArray(v4EffectList) ? v4EffectList : Object.values(v4EffectList);

    const v5EffectObj = {
        id: uuid(),
        list: []
    };

    for (const v4Effect of v4Effects) {
        if (v4Effect == null || v4Effect.type == null) {
            continue;
        }
        try {
            const mappedV5Effect = mapV4Effect(v4Effect, triggerData, incompatibilityWarnings);
            if (mappedV5Effect) {
                v5EffectObj.list.push(mappedV5Effect);
            }
        } catch (error) {
            let reason;
            if (error instanceof IncompatibilityError) {
                reason = error.reason;
            } else {
                logger.warn("Error during v4 effect import", error);
                reason = "An unexpected error occurred";
            }
            const message = `Could not import V4 Effect '${v4Effect.type}' in ${triggerData.type} '${triggerData.name}' because: ${reason}`;
            incompatibilityWarnings.push(message);
        }
    }

    return {
        effects: v5EffectObj,
        incompatibilityWarnings: incompatibilityWarnings
    };
};