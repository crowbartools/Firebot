import type { Trigger, TriggerType, TriggersObject } from "./triggers";
import type { Awaitable } from "./util-types";

interface RestrictionScope<RestrictionModel> extends ng.IScope {
    restriction: Restriction<RestrictionModel>;
    restrictionDefinition: RestrictionType<RestrictionModel>;
    restrictionMode: RestrictionMode;
    [x: string]: any;
}

export type RestrictionMode = "all" | "any" | "none";

export type RestrictionType<RestrictionModel = unknown> = {
    definition: {
        id: string;
        name: string;
        description: string;
        triggers?: TriggerType[] | TriggersObject;
    };
    failedReasonWhenInverted?: string;
    optionsTemplate: string;
    optionsController?: (
        $scope: RestrictionScope<RestrictionModel>,
        ...args: any[]
    ) => void;
    optionsValueDisplay?: (
        restriction: RestrictionModel,
        ...args: any[]
    ) => string;
    predicate(
        triggerData: Trigger,
        restrictionData: RestrictionModel,
        inherited?: boolean
    ): Awaitable<boolean>;
    onSuccessful?: (
        triggerData: Trigger,
        restrictionData: RestrictionModel,
        inherited?: boolean
    ) => Awaitable<void>;
};

export type Restriction<RestrictionModel = unknown> = {
    id: string;
    type: string;
} & {
    [K in keyof RestrictionModel]: RestrictionModel[K];
} & {
    [x: string]: unknown;
};

export type RestrictionData = {
    /**
     * Sets the command to only trigger when all/any/none of the restrictions pass.
     */
    mode?: RestrictionMode;
    /**
     * If a chat message should be sent when the restrictions are not met.
     */
    sendFailMessage?: boolean;
    useCustomFailMessage?: boolean;
    failMessage?: string;
    restrictions: Restriction[];
    sendAsReply?: boolean;
    invertCondition?: boolean;
};