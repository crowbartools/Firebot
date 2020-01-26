"use strict";

const { ipcMain } = require("electron");
const logger = require("../../logwrapper");
const EventEmitter = require("events");

class ConditionTypeManager extends EventEmitter {
    constructor() {
        super();

        this._registeredConditionTypes = [];
    }

    registerConditionType(conditionType) {
        let idConflict = this._registeredConditionTypes.some(
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

    getConditionTyperById(conditionTypeId) {
        return this._registeredConditionTypes.find(ct => ct.id === conditionTypeId);
    }

    getAllConditionTypes() {
        return this._registeredConditionTypes;
    }

    async runConditions(conditionData, triggerData) {
        if (conditionData != null) {
            let conditions = conditionData.conditions;

            let didPass = true;
            for (let condition of conditions) {
                const conditionType = this.getConditionTypeById(condition.type);
                if (conditionType) {
                    try {

                        let successful = await conditionType.predicate(condition, triggerData);

                        if (!successful) {
                            didPass = false;
                            break;
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

const manager = new ConditionTypeManager();

ipcMain.on("getConditionTypesForEvent", (event, data) => {
    logger.info("got 'get all conditionTypes' request");
    let { eventSourceId, eventId } = data;
    event.returnValue = manager.getConditionTypesForEvent(eventSourceId, eventId).map(f => {
        return {
            id: f.id,
            name: f.name,
            description: f.description,
            comparisonTypes: f.comparisonTypes,
            valueType: f.valueType,
            getPresetValues: f.presetValues ? f.presetValues.toString() : "() => {}",
            getSelectedValueDisplay: f.getSelectedValueDisplay ? f.getSelectedValueDisplay.toString() : "conditionTypeSettings => conditionTypeSettings.value",
            valueIsStillValid: f.valueIsStillValid ? f.valueIsStillValid.toString() : "() => true"
        };
    });
});

module.exports = manager;
