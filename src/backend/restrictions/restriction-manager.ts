import { TypedEmitter } from "tiny-typed-emitter";
import type { Restriction, RestrictionData, RestrictionType } from "../../types/restrictions";
import type { Trigger, TriggerMeta, TriggerType } from "../../types/triggers";
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

        frontendCommunicator.on("getRestrictions", (triggerData: {
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
            return Promise.resolve(true);
        }
        const restrictions = restrictionData.restrictions;
        const permissions = restrictions.filter(r => r.type === "firebot:permissions");
        if (permissions == null) {
            return Promise.resolve(true);
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
        return this.runRestrictionPredicates(triggerData, permRestrictionData)
            .then(() => true, () => false);
    }

    private async runPredicate(
        restrictionDef: RestrictionType,
        triggerData: Trigger,
        restriction: Restriction,
        restrictionsAreInherited: boolean
    ) {
        let restrictionPassed = false;
        let failedReason: string = null;

        try {
            await restrictionDef.predicate(triggerData, restriction, restrictionsAreInherited);
            restrictionPassed = true;
        } catch (reason) {
            failedReason = (reason instanceof Error ? reason.message : (reason as string))?.toLowerCase()
                ?? "You don't meet the requirements.";
        }

        if (restriction.invertCondition) {
            restrictionPassed = !restrictionPassed;
            if (restrictionPassed === false) {
                failedReason = restrictionDef.failedReasonWhenInverted
                    ?? "You don't meet the requirements.";
            }
        }

        if (!restrictionPassed) {
            // eslint-disable-next-line @typescript-eslint/only-throw-error
            throw failedReason;
        }
    }

    async runRestrictionPredicates(
        triggerData: Trigger,
        restrictionData: RestrictionData,
        restrictionsAreInherited = false
    ) {
        if (restrictionData == null || restrictionData.restrictions == null ||
            restrictionData.restrictions.length < 1) {
            return Promise.resolve();
        }
        const restrictions = restrictionData.restrictions;

        if (restrictionData.mode === "any" || restrictionData.mode === "none") {
            const reasons = [];
            let restrictionPassed = false;
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    try {
                        await this.runPredicate(restrictionDef, triggerData, restriction, restrictionsAreInherited);
                        restrictionPassed = true;
                        if (restrictionData.mode !== "none" && restrictionDef.onSuccessful) {
                            restrictionDef.onSuccessful(triggerData, restriction, restrictionsAreInherited);
                        }
                        break;
                    } catch (reason) {
                        if (reason) {
                            reasons.push((reason as string).toLowerCase());
                        }
                    }
                }
            }

            if (restrictionData.mode === "none") {
                if (restrictionPassed) {
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    return Promise.reject(`You don't meet the requirements.`);
                }
                return Promise.resolve();
            }

            if (!restrictionPassed) {
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                return Promise.reject(reasons.join(", or "));
            }
            return Promise.resolve();

        } else if (restrictionData.mode === "all" || restrictionData.mode == null) {
            const predicatePromises = [];
            for (const restriction of restrictions) {
                const restrictionDef = this.getRestrictionById(restriction.type);
                if (restrictionDef && restrictionDef.predicate) {
                    predicatePromises.push(this.runPredicate(restrictionDef, triggerData, restriction, restrictionsAreInherited));
                }
            }

            return Promise.all(predicatePromises).then(() => {
                for (const restriction of restrictions) {
                    const restrictionDef = this.getRestrictionById(restriction.type);
                    if (restrictionDef && restrictionDef.onSuccessful) {
                        restrictionDef.onSuccessful(triggerData, restriction, restrictionsAreInherited);
                    }
                }
            });
        }
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/restrict-template-expressions
        return Promise.reject(`Invalid restriction mode '${restrictionData.mode}'`);
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