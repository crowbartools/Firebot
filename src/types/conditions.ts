/* eslint-disable @typescript-eslint/no-explicit-any */
import type EventEmitter from "events";
import { Trigger, TriggersObject, TriggerType } from "./triggers";

type PresetValue = {
    value: string;
    display: string;
};

type ConditionValueType = "text" | "number" | "preset" | "none";

export type ConditionSettings<
    ComparisonTypes extends string,
    LeftSideValueType extends ConditionValueType,
    RightSideValueType extends ConditionValueType
> = {
    type: string;
    comparisonType: ComparisonTypes;
    leftSideValue: LeftSideValueType extends "number"
        ? number
        : LeftSideValueType extends "none"
            ? undefined
            : string;
    rightSideValue: RightSideValueType extends "number" ? number : string;
};

export type ConditionType<
    ComparisonTypes extends string,
    LeftSideValueType extends ConditionValueType,
    RightSideValueType extends ConditionValueType
> = {
    id: string;
    name: string;
    description: string;
    comparisonTypes: ComparisonTypes[];
    rightSideValueType: RightSideValueType;
    leftSideValueType?: LeftSideValueType;
    triggers?: TriggerType[] | TriggersObject;
    leftSideTextPlaceholder?: string;
    rightSideTextPlaceholder?: string;
    getRightSidePresetValues?: (...args: unknown[]) => PresetValue[];
    getLeftSidePresetValues?: (...args: unknown[]) => PresetValue[];
    getRightSideValueDisplay?(
        condition: ConditionSettings<
            ComparisonTypes,
            LeftSideValueType,
            RightSideValueType
        >,
        ...args: unknown[]
    ): string;
    getLeftSideValueDisplay?(
        condition: ConditionSettings<
            ComparisonTypes,
            LeftSideValueType,
            RightSideValueType
        >,
        ...args: unknown[]
    ): string;
    valueIsStillValid?(
        condition: ConditionSettings<
            ComparisonTypes,
            LeftSideValueType,
            RightSideValueType
        >,
        ...args: unknown[]
    ): boolean;
    predicate(
        conditionSettings: ConditionSettings<
            ComparisonTypes,
            LeftSideValueType,
            RightSideValueType
        >,
        trigger: Trigger
    ): boolean | Promise<boolean>;
};

export type ConditionManager = EventEmitter & {
    registerConditionType(conditionType: ConditionType<any, any, any>): void;
    getConditionTypeById(conditionTypeId: string): ConditionType<any, any, any>;
    getAllConditionTypes(): ConditionType<any, any, any>[];
};