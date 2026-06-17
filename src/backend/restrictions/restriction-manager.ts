import { TypedEmitter } from "tiny-typed-emitter";

import type {
    Restriction,
    RestrictionData,
    RestrictionResult,
    RestrictionType,
    Trigger,
    TriggerMeta,
    TriggerType
} from "../../types";

import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

type Events = {
    "restriction-registered": (restriction: RestrictionType) => void;
    "restriction-unregistered": (restrictionId: string) => void;
};

class RestrictionsManager extends TypedEmitter<Events> {
    private logger = LoggerCache.getLogger("Restrictions");
    private _registeredRestrictions: RestrictionType[] = [];

    constructor() {
        super();

        frontendCommunicator.onAsync("restrictions:get-restrictions", async (triggerData: {
            triggerType: TriggerType;
            triggerMeta: TriggerMeta;
        }) => {
            this.logger.debug("got 'get restrictions' request");

            const triggerType = triggerData.triggerType,
                triggerMeta = triggerData.triggerMeta;

            return this.getAllRestrictions().map(r => this.mapRestrictionForFrontEnd(r)).filter((r) => {
                if (r.definition.triggers == null || (Array.isArray(r.definition.triggers) && r.definition.triggers.length < 1)) {
                    return true;
                }

                if (triggerType == null) {
                    return false;
                }

                if (Array.isArray(r.definition.triggers)) {
                    return r.definition.triggers.includes(triggerType);
                }

                const supported = r.definition.triggers[triggerType] != null
            && r.definition.triggers[triggerType] !== false;

                if (!supported) {
                    return false;
                }

                if (triggerMeta) {
                    const effectTriggerData = r.definition.triggers[triggerType];

                    switch (triggerType) {
                        case "event":
                            if (effectTriggerData === true) {
                                return true;
                            }
                            if (Array.isArray(effectTriggerData)) {
                                return effectTriggerData.includes(triggerMeta.triggerId);
                            }
                            return true;
                        default:
                            return true;
                    }
                } else {
                    return true;
                }
            });
        });
    }

    registerRestriction(restriction: RestrictionType): void {
        const idConflict = this._registeredRestrictions.some(
            r => r.definition.id === restriction.definition.id
        );

        if (idConflict) {
            this.logger.warn(`Could not register restriction '${restriction.definition.id}', a restriction with this id already exists.`);
            return;
        }

        this._registeredRestrictions.push(restriction);

        this.logger.debug(`Registered Restriction ${restriction.definition.id}`);

        this.emit("restriction-registered", restriction);
    }

    unregisterRestriction(restrictionId: string): void {
        const existing = this._registeredRestrictions.some(
            r => r.definition.id === restrictionId
        );

        if (!existing) {
            this.logger.warn(`Could not unregister restriction '${restrictionId}'. Restriction does not exist.`);
            return;
        }

        this._registeredRestrictions = this._registeredRestrictions.filter(
            r => r.definition.id !== restrictionId
        );

        this.logger.debug(`Unregistered Restriction ${restrictionId}`);

        this.emit("restriction-unregistered", restrictionId);
    }

    getRestrictionById(restrictionId: string): RestrictionType {
        return this._registeredRestrictions.find(r => r.definition.id === restrictionId);
    }

    getAllRestrictions(): RestrictionType[] {
        return this._registeredRestrictions;
    }

    async checkPermissionsPredicateOnly(
        restrictionData: RestrictionData,
        username: string,
        twitchRoles: string[]
    ): Promise<boolean> {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return true;
        }

        const restrictions = restrictionData.restrictions;
        const permissions = restrictions.filter(r => r.type === "firebot:permissions");
        if (permissions == null) {
            return true;
        }

        const permRestrictionData = {
            restrictions: permissions,
            mode: restrictionData.mode
        };

        const triggerData: Trigger = {
            type: null,
            metadata: {
                username: username,
                userTwitchRoles: twitchRoles
            }
        };

        return (await this.runRestrictionPredicates(triggerData, permRestrictionData)).success;
    }

    private async runPredicate(
        restrictionDef: RestrictionType,
        triggerData: Trigger,
        restriction: Restriction,
        restrictionsAreInherited: boolean
    ): Promise<RestrictionResult> {
        let result: RestrictionResult = {
            success: false,
            failureReason: "You don't meet the requirements."
        };

        try {
            const evalResult = await restrictionDef.predicate(triggerData, restriction, restrictionsAreInherited);

            // Back compat with old restriction format
            if (typeof evalResult === "boolean") {
                result = {
                    success: evalResult,
                    failureReason: undefined
                };
            } else {
                result = evalResult;
            }
        } catch (reason) {
            result.failureReason = (reason instanceof Error ? reason.message : (reason as string))?.toLowerCase()
                ?? "You don't meet the requirements.";
        }

        if (restriction.invertCondition) {
            result.success = !result.success;
            if (result.success === false) {
                result.failureReason = restrictionDef.failedReasonWhenInverted
                    ?? "You don't meet the requirements.";
            }
        }

        return result;
    }

    async runRestrictionPredicates(
        triggerData: Trigger,
        restrictionData: RestrictionData,
        restrictionsAreInherited = false
    ): Promise<RestrictionResult> {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return {
                success: true
            };
        }

        const restrictions = restrictionData.restrictions;

        if (restrictionData.mode === "any" || restrictionData.mode === "none") {
            const reasons = [];
            let restrictionPassed = false;
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    const result = await this.runPredicate(restrictionDef, triggerData, restriction, restrictionsAreInherited);
                    if (result.success === true) {
                        restrictionPassed = true;
                        if (restrictionData.mode !== "none" && restrictionDef.onSuccessful) {
                            restrictionDef.onSuccessful(triggerData, restriction, restrictionsAreInherited);
                        }
                        break;
                    } else if (!!result.failureReason?.length) {
                        reasons.push(result.failureReason.toLowerCase());
                    }
                }
            }

            if (restrictionData.mode === "none") {
                if (restrictionPassed) {
                    return {
                        success: false,
                        failureReason: "You don't meet the requirements."
                    };
                }

                return {
                    success: true
                };
            }

            if (!restrictionPassed) {
                return {
                    success: false,
                    failureReason: reasons.join(", or ")
                };
            }
            return {
                success: true
            };

        } else if (restrictionData.mode === "all" || restrictionData.mode == null) {
            const predicatePromises: Array<Promise<RestrictionResult>> = [];
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    predicatePromises.push(this.runPredicate(restrictionDef, triggerData, restriction, restrictionsAreInherited));
                }
            }

            const promiseResult = await Promise.all(predicatePromises);
            if (promiseResult.every(p => p.success === true)) {
                for (const restriction of restrictions) {
                    const restrictionDef = this.getRestrictionById(restriction.type);
                    if (restrictionDef && restrictionDef.onSuccessful) {
                        restrictionDef.onSuccessful(triggerData, restriction, restrictionsAreInherited);
                    }
                }

                return {
                    success: true
                };
            }

            return {
                success: false,
                failureReason: promiseResult.map(p => p.failureReason)
                    .filter(r => !!r?.length)
                    .join(", or ")
            };
        }

        return {
            success: false,
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            failureReason: `Invalid restriction mode '${restrictionData.mode}'`
        };
    }

    private mapRestrictionForFrontEnd(restriction: RestrictionType) {
        return {
            definition: restriction.definition,
            optionsTemplate: restriction.optionsTemplate,
            optionsControllerRaw: restriction.optionsController ?
                restriction.optionsController.toString() : '() => {}',
            optionsValueDisplayRaw: restriction.optionsValueDisplay ?
                restriction.optionsValueDisplay.toString() : "() => ''"
        };
    }
}

const manager = new RestrictionsManager();

export { manager as RestrictionsManager };