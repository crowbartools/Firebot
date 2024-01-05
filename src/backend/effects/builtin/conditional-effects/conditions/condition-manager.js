"use strict";

const logger = require("../../../../logwrapper");
const EventEmitter = require("events");
const frontendCommunicator = require("../../../../common/frontend-communicator");
const util = require("../../../../utility");

class ConditionManager extends EventEmitter {
    constructor() {
        super();

        this._registeredConditionTypes = [];
    }

    registerConditionType(conditionType) {
        const idConflict = this._registeredConditionTypes.some(
            ct => ct.id === conditionType.id
        );

        if (idConflict) {
            logger.warn(`Could not register condition type '${conditionType.id}', a condition type with this id already exists.`);
            return;
        }

        // TODO: validate the condition type better

        this._registeredConditionTypes.push(conditionType);

        logger.debug(`Registered Condition Type ${conditionType.id}`);

        this.emit("conditionTypeRegistered", conditionType);
    }

    getConditionTypeById(conditionTypeId) {
        return this._registeredConditionTypes.find(ct => ct.id === conditionTypeId);
    }

    getAllConditionTypes() {
        return this._registeredConditionTypes;
    }

    async runConditions(conditionData, triggerData) {
        if (conditionData?.conditions?.length > 0) {
            const conditions = JSON.parse(JSON.stringify(conditionData.conditions));

            let didPass = conditionData.mode !== "inclusive";
            for (const condition of conditions) {
                const conditionType = this.getConditionTypeById(condition.type);
                if (conditionType) {
                    try {
                        condition.rawLeftSideValue = condition.leftSideValue;
                        condition.rawRightSideValue = condition.rightSideValue;

                        if (conditionType.leftSideValueType === 'text') {
                            try {
                                condition.leftSideValue = await util.populateStringWithTriggerData(condition.leftSideValue, triggerData);
                            } catch (err) {
                                logger.warn("Unable to process leftSideValue replace variables for condition", err);
                            }
                        }

                        if (conditionType.rightSideValueType === 'text') {
                            try {
                                condition.rightSideValue = await util.populateStringWithTriggerData(condition.rightSideValue, triggerData);
                            } catch (err) {
                                logger.warn("Unable to process rightSideValue replace variables for condition", err);
                            }
                        }

                        const successful = await conditionType.predicate(condition, triggerData);

                        if (conditionData.mode === "inclusive") {
                            if (successful) {
                                didPass = true;
                                break;
                            }
                        } else {
                            if (!successful) {
                                didPass = false;
                                break;
                            }
                        }

                    } catch (err) {
                        // Tell front end an error happened
                        //logger.warn(`An error happened when attempting to process the conditionType ${conditionTypeSetting.type} for event ${eventData.eventSourceId}:${eventData.eventId}: "${err}"`);
                    }
                }
            }

            return didPass;
        }
        return true;
    }
}

const manager = new ConditionManager();

frontendCommunicator.on("getConditionTypes", (trigger) => {
    logger.info("got 'getConditionTypes' request");

    let conditionTypes = manager.getAllConditionTypes();
    if (trigger != null) {
        conditionTypes = conditionTypes
            .filter(c => {

                if (c.triggers == null) {
                    return true;
                }

                const conditionTrigger = c.triggers[trigger.type];
                if (conditionTrigger === true) {
                    return true;
                }

                if (Array.isArray(conditionTrigger)) {
                    if (conditionTrigger.some(id => id === trigger.id)) {
                        return true;
                    }
                }

                return false;
            });
    }
    return conditionTypes.map(c => {
        return {
            id: c.id,
            name: c.name,
            description: c.description,
            comparisonTypes: c.comparisonTypes,
            rightSideValueType: c.rightSideValueType,
            leftSideValueType: c.leftSideValueType ? c.leftSideValueType : "none",
            leftSideTextPlaceholder: c.leftSideTextPlaceholder || "Enter value",
            rightSideTextPlaceholder: c.rightSideTextPlaceholder || "Enter value",
            getRightSidePresetValues: c.getRightSidePresetValues ? c.getRightSidePresetValues.toString() : "() => {}",
            getLeftSidePresetValues: c.getLeftSidePresetValues ? c.getLeftSidePresetValues.toString() : "() => {}",
            getRightSideValueDisplay: c.getRightSideValueDisplay ? c.getRightSideValueDisplay.toString() : "condition => condition.rightSideValue",
            getLeftSideValueDisplay: c.getLeftSideValueDisplay ? c.getLeftSideValueDisplay.toString() : "condition => condition.leftSideValue",
            valueIsStillValid: c.valueIsStillValid ? c.valueIsStillValid.toString() : "() => true"
        };
    });
});

module.exports = manager;
