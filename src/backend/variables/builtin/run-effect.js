"use strict";

const uuid = require("uuid/v4");

const logger = require("../../logwrapper");
const { OutputDataType, VariableCategory } = require("../../../shared/variable-constants");
const effectRunner = require("../../common/effect-runner");

const model = {
    definition: {
        handle: "runEffect",
        usage: "runEffect[effectJson]",
        description: "Run an effect defined as json. Outputs an empty string. Please keep in mind that the power and flexibility afforded by this variable means it is very error prone. Only use if you know what you are doing.",
        examples: [{
            usage: "runEffect[``{\"type\":\"firebot:chat\",\"message\":\"Hello world\"}``]",
            description: "Runs a chat message effect. You can get an effects JSON data via the UI via the overflow menu in the top right of the Edit Effect modal. (Copy Effect Json > For $runEffect[])"
        }],
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (trigger, ...effectJsonModels) => {

        try {
            await effectRunner.processEffects({
                trigger,
                effects: {
                    id: uuid(),
                    list: effectJsonModels.map(json => {
                        try {
                            return JSON.parse(json);
                        } catch (error) {
                            logger.warn("Failed to parse effect json in $runEffect", json, error);
                            return null;
                        }
                    }).filter(e => e?.type != null && typeof e?.type === "string")
                }
            });
        } catch (error) {
            logger.warn("Error running effects via $runEffect", error);
        }

        return "";
    }
};

module.exports = model;
