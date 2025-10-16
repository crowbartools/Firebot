import { Trigger, TriggerType, TriggersObject } from "./triggers";
import { Awaitable } from "./util-types";

interface RestrictionScope<RestrictionModel> extends ng.IScope {
    restriction: RestrictionType<RestrictionModel>;
    [x: string]: unknown;
}

export type RestrictionType<RestrictionModel> = {
    definition: {
        id: string;
        name: string;
        description: string;
        triggers?: TriggerType[] | TriggersObject;
    };
    optionsTemplate: string;
    optionsController?: (
        $scope: RestrictionScope<RestrictionModel>,
        ...args: unknown[]
    ) => void;
    optionsValueDisplay?: (
        restriction: RestrictionModel,
        ...args: unknown[]
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

export type RestrictionData = {
    /**
     * Sets the command to only trigger when all/any/none of the restrictions pass.
     */
    mode?: "all" | "any" | "none";
    /**
     * If a chat message should be sent when the restrictions are not met.
     */
    sendFailMessage?: boolean;
    useCustomFailMessage?: boolean;
    failMessage?: string;
    restrictions: unknown[]; // TODO: change when restriction-manager and companion types are added
    sendAsReply?: boolean;
};