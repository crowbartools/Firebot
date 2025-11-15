"use strict";

import type {
    FirebotComponent,
    EffectList,
    EffectType,
    EffectHelperService,
    EffectInstance,
    SettingsService,
    NgToast,
    FirebotRootScope,
    ModalService,
    EffectDefinition,
    TriggerType,
    ModalFactory,
    ObjectCopyHelper
} from "../../../../../types";

type EffectListBindings = {
    trigger?: TriggerType;
    triggerMeta: {
        rootEffects?: EffectList;
        presetListArgs?: Array<{
            name: string;
        }>;
        [x: string]: unknown;
    };
    effects: EffectList;
    update: (args: { effects: EffectList }) => void;
    modalId: string;
    header: string;
    mode?: "sequential" | "random";
    weighted: boolean;
};

type ControllerExtras = {
    effectsData: EffectList;
    effectsUpdate: () => void;
    keyboardDragIndex: number | null;
    keyboardDragEffectId: string | null;
    keyboardOriginalEffects: EffectInstance[] | null;
    effectDefaultLabels: { [effectId: string]: string };
    showBottomPanel: (effect: EffectInstance) => boolean;
    openNewEffectModal: (index?: number) => void;
    getEffectLabel: (effect: EffectInstance) => string | undefined;
    removeEffectAtIndex: (index: number) => void;
    removeAllEffects: () => void;
    openEditEffectModal: (effect: EffectInstance, index: number | null, trigger: TriggerType, isNew: boolean) => void;
    effectContextMenuOptions: Array<unknown>;
    sortableOptions: {
        handle: string;
        stop: () => void;
    };
    getEffectNameById: (id: string) => string;
    getEffectIconById: (id: string) => string;
    getEffectIconStyle: (id: string) => { [key: string]: string };
    editLabelForEffectAtIndex: (index: number) => void;
    editTimeoutForEffectAtIndex: (index: number) => void;
    duplicateEffectAtIndex: (index: number) => void;
    hasCopiedEffects: () => boolean;
    pasteEffects: (append?: boolean) => void;
    pasteEffectsAtIndex: (index: number, above: boolean) => void;
    copyEffectAtIndex: (index: number) => void;
    copyEffects: () => void;
    moveEffectAtIndex: (fromIndex: number, toIndex: number) => void;
    handleEffectKeydown: (event: KeyboardEvent, index: number) => void;
};

type ContextMenuItemScope = {
    $index: number;
    effect: EffectInstance;
};

(function () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { randomUUID } = require("crypto");

    const effectListNew: FirebotComponent<EffectListBindings, ControllerExtras> = {
        bindings: {
            trigger: "@?",
            triggerMeta: "<",
            effects: "<",
            update: "&",
            modalId: "@",
            header: "@",
            mode: "@?",
            weighted: "<"
        },
        template: `
            <div class="effect-list-new">
                <div class="flex-row-center jspacebetween effect-list-header">
                    <div class="flex items-center">
                        <h3 class="m-0" style="display:inline;font-weight: 600;">Effects</h3>
                        <span class="ml-1" style="font-size: 11px;"><tooltip text="$ctrl.header" ng-if="$ctrl.header"></tooltip></span>
                    </div>
                </div>

                <div class="mx-6 pb-6">

                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsData.list">
                        <div
                            ng-repeat="effect in $ctrl.effectsData.list track by $index"
                            context-menu="$ctrl.effectContextMenuOptions"
                            style="margin-bottom: 7.5px;"
                        >

                            <div
                                class="effect-item"
                                ng-class="{'disabled': !effect.active, 'kb-dragging': $ctrl.keyboardDragIndex === $index}"
                                tabindex="0"
                                ng-keydown="$ctrl.handleEffectKeydown($event, $index)"
                            >
                                <div class="effect-drag-handle dragHandle">
                                    <i class="fas fa-grip-vertical"></i>
                                </div>
                                <div class="effect-icon" ng-style="$ctrl.getEffectIconStyle(effect.type)">
                                    <i ng-class="$ctrl.getEffectIconById(effect.type)"></i>
                                </div>
                                <div class="pr-4 flex flex-col justify-center" style="text-overflow: ellipsis;overflow: hidden;flex-grow: 1;">
                                    <div class="effect-name truncate">{{$ctrl.getEffectNameById(effect.type)}}</div>
                                    <div ng-if="$ctrl.getEffectLabel(effect)" class="muted truncate" style="font-size: 12px;">{{$ctrl.getEffectLabel(effect)}}</div>
                                </div>
                                <span class="flex-row-center" style="flex-shrink: 0;">
                                    <!-- <span
                                        ng-if="effect.abortTimeout && effect.abortTimeout > 0"
                                        uib-tooltip="Abort Timeout"
                                        tooltip-append-to-body="true"
                                        class="muted mr-5 flex items-center justify-center"
                                    >
                                        <i class="fas fa-stopwatch"></i>
                                        <div class="ml-1">{{effect.abortTimeout}}s</div>
                                    </span>
                                    <span class="dragHandle flex items-center justify-center" style="height: 38px; width: 15px;" ng-class="{'hiddenHandle': !hovering}" ng-click="$event.stopPropagation()">
                                        <i class="fal fa-bars"></i>
                                    </span> -->
                                    <button
                                        class="effect-edit-btn"
                                        ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger, false)"
                                        aria-label="Edit Effect"
                                        uib-tooltip="Edit Effect"
                                        tooltip-append-to-body="true"
                                    >
                                        <i class="fas fa-pen"></i>
                                    </button>
                                    <div
                                        class="flex items-center justify-center"
                                        style="font-size: 20px;height: 38px;width: 35px;text-align: center;"
                                    >
                                        <a
                                            href
                                            class="effects-actions-btn"
                                            aria-label="Open effect menu"
                                            uib-tooltip="Open effect menu"
                                            tooltip-append-to-body="true"
                                            role="button"
                                            context-menu="$ctrl.effectContextMenuOptions"
                                            context-menu-on="click"
                                            context-menu-orientation="top"
                                        >
                                            <i class="fal fa-ellipsis-v"></i>
                                        </a>
                                    </div>
                                </span>
                            </div>


                        </div>
                    </div>

                    <div class="mt-4">
                        <button
                            type="button"
                            class="effect-list-add-btn"
                            ng-click="$ctrl.openNewEffectModal($ctrl.effectsData.list.length)"
                            aria-label="Add new effect"
                        >
                            <span class="effect-list-add-btn__icon-wrapper">
                                <i class="far fa-plus"></i>
                            </span>
                            <span class="effect-list-add-btn__label">
                                Add Effect
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        `,
        controller: function (
            $q: angular.IQService,
            $rootScope: FirebotRootScope,
            $scope: angular.IScope,
            $http: angular.IHttpService,
            $injector: angular.auto.IInjectorService,
            effectHelperService: EffectHelperService,
            settingsService: SettingsService,
            modalService: ModalService,
            modalFactory: ModalFactory,
            ngToast: NgToast,
            objectCopyHelper: ObjectCopyHelper
        ) {
            const $ctrl = this;

            let effectTypes: EffectType[] = [];

            $ctrl.effectsData = {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                id: randomUUID(),
                list: []
            };

            $ctrl.keyboardDragIndex = null;
            $ctrl.keyboardDragEffectId = null;
            $ctrl.keyboardOriginalEffects = null;

            $ctrl.sortableOptions = {
                handle: ".dragHandle",
                stop: () => {
                    $ctrl.effectsUpdate();
                }
            };

            //#region Default Labels
            $ctrl.effectDefaultLabels = {};

            async function getDefaultLabels() {
                const effects = $ctrl.effectsData?.list ?? [];

                const promises: Promise<{ id: string, defaultLabel?: string }>[] = [];
                for (const effect of effects) {
                    if (!effect?.id) {
                        continue;
                    }

                    const effectType = effectTypes.find(e => e.definition.id === effect.type);

                    if (!effectType?.getDefaultLabel) {
                        continue;
                    }

                    const promise = Promise.resolve(
                        $injector.invoke(
                            effectType.getDefaultLabel,
                            {},
                            {
                                effect: effect
                            }
                        )
                    )
                        .then((label) => {
                            return {
                                id: effect.id,
                                defaultLabel: label
                            };
                        })
                        .catch(() => {
                            return {
                                id: effect.id,
                                defaultLabel: null
                            };
                        });

                    promises.push(promise);
                }

                return $q.when(
                    Promise.all(promises).then((results) => {
                        return results.reduce((acc, result) => {
                            if (result?.id && result?.defaultLabel != null) {
                                acc[result.id] = result.defaultLabel;
                            }
                            return acc;
                        }, {});
                    })
                );
            }

            function updateDefaultLabels() {
                void getDefaultLabels().then((labels) => {
                    $ctrl.effectDefaultLabels = labels;
                });
            }

            $ctrl.getEffectLabel = (effect: EffectInstance) => {
                if (effect.effectLabel?.length) {
                    return effect.effectLabel;
                }

                if (effect?.id && settingsService.getSetting("DefaultEffectLabelsEnabled")) {
                    const defaultLabel = $ctrl.effectDefaultLabels[effect.id];

                    if (defaultLabel != null) {
                        return defaultLabel;
                    }
                }
                return;
            };

            $ctrl.getEffectNameById = (id: string) => {
                if (!effectTypes || effectTypes.length < 1) {
                    return "";
                }

                return effectTypes.find(e => e.definition.id === id)?.definition?.name ?? `Unknown Effect: ${id}`;
            };

            $ctrl.getEffectIconById = (id: string) => {
                if (!effectTypes || effectTypes.length < 1) {
                    return "";
                }

                return (
                    effectTypes.find(e => e.definition.id === id)?.definition?.icon?.replace("fad", "fas") ??
                    `fas fa-exclamation-triangle`
                );
            };

            $ctrl.getEffectIconStyle = (id: string) => {
                const categories = effectTypes.find(e => e.definition.id === id)?.definition?.categories ?? [];

                let color: string | undefined = undefined;
                if (categories.includes("Moderation")) {
                    color = "#ef4444";
                } else if (categories.includes("chat based")) {
                    color = "#60A5FA";
                } else if (categories.includes("twitch")) {
                    color = "#ab73ff";
                } else if (categories.includes("overlay")) {
                    color = "#F472B6";
                } else if (categories.includes("scripting")) {
                    color = "#FACC15";
                } else if (categories.includes("fun")) {
                    color = "#4ADE80";
                } else if (categories.includes("integrations")) {
                    color = "#00ffd8";
                } else if (categories.includes("advanced")) {
                    color = undefined;
                }

                if (!color) {
                    return {};
                }

                // Convert hex color to rgba with 0.1 alpha for background
                const hexToRgba = (hex: string) => {
                    const r = parseInt(hex.slice(1, 3), 16);
                    const g = parseInt(hex.slice(3, 5), 16);
                    const b = parseInt(hex.slice(5, 7), 16);
                    return `rgba(${r}, ${g}, ${b}, 0.1)`;
                };

                return {
                    "--effect-icon-color": color,
                    "--effect-icon-bg-color": hexToRgba(color)
                };
            };
            //#endregion

            //#region Weighted Effects
            $ctrl.showBottomPanel = (effect: EffectInstance) => {
                return $ctrl.weighted && effect?.active;
            };

            function ensureDefaultWeights(reset = false) {
                $ctrl.effectsData.list.forEach((e) => {
                    if (!$ctrl.weighted) {
                        e.percentWeight = null;
                    } else if (e.percentWeight == null || reset) {
                        e.percentWeight = 0.5;
                    }
                });
            }
            //#endregion

            $ctrl.effectsUpdate = function () {
                ensureDefaultWeights();
                updateDefaultLabels();
                $ctrl.update({ effects: $ctrl.effectsData });
            };

            $ctrl.$onInit = $ctrl.$onChanges = function () {
                if (!$ctrl.mode) {
                    $ctrl.mode = "sequential";
                }
                $q.when(effectHelperService.getAllEffectTypes()).then((types) => {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    effectTypes = types;

                    if ($ctrl.effects != null && !Array.isArray($ctrl.effects)) {
                        $ctrl.effectsData = $ctrl.effects;
                    }
                    if ($ctrl.effectsData.list == null) {
                        $ctrl.effectsData.list = [];
                    }
                    if ($ctrl.effectsData.id == null) {
                        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                        $ctrl.effectsData.id = randomUUID();
                    }

                    $ctrl.effectsData.list.forEach((e) => {
                        if (e.active == null) {
                            e.active = true;
                        }
                    });

                    $ctrl.effectsUpdate();

                    $scope.$broadcast("rzSliderForceRender");
                });
            };

            //#region Magic Variables
            function mergeArraysWithoutDuplicates<T>(initialArray: T[], arrayToAdd: T[], keyToCheck: keyof T) {
                const nonDupes = arrayToAdd.filter((item) => {
                    return !initialArray.some((i) => {
                        return i[keyToCheck] === item[keyToCheck];
                    });
                });
                return [...initialArray, ...nonDupes];
            }

            function stringCanBeShorthand(str: string) {
                return /^([a-z][a-z\d._-]+)([\s\S]*)$/i.test(str);
            }

            function checkEffectListForMagicVariables(
                effects: Array<EffectInstance & { name?: string }>,
                ignoreEffectId: string
            ) {
                const magicVariables = {
                    customVariables: [],
                    effectOutputs: []
                };

                if (!effects || !Array.isArray(effects)) {
                    return;
                }

                for (const effect of effects) {
                    if (effect == null || typeof effect !== "object" || effect.id === ignoreEffectId) {
                        continue;
                    }

                    if (effect.type === "firebot:customvariable" || effect.name?.length) {
                        const canBeShorthand = stringCanBeShorthand(effect.name);
                        magicVariables.customVariables = mergeArraysWithoutDuplicates(
                            magicVariables.customVariables,
                            [
                                {
                                    name: effect.name,
                                    handle: canBeShorthand ? `$$${effect.name}` : `$customVariable[${effect.name}]`,
                                    effectLabel: effect.effectLabel,
                                    examples: [
                                        ...(canBeShorthand
                                            ? [
                                                {
                                                    handle: `$$${effect.name}["path", "to", "property"]`,
                                                    description: `Access a property of "${effect.name}"`
                                                },
                                                {
                                                    handle: `$customVariable[${effect.name}]`,
                                                    description: `Long hand version of "${effect.name}"`
                                                }
                                            ]
                                            : []),
                                        {
                                            handle: `$customVariable[${effect.name}, "path.to.property"]`,
                                            description: `Access a property of "${effect.name}" using long hand`
                                        }
                                    ]
                                }
                            ],
                            "name"
                        );
                        continue;
                    }

                    const effectType = effectTypes.find(e => e.definition?.id === effect.type);
                    if (effectType != null && effectType.definition?.outputs?.length) {
                        const customOutputNames: Record<string, string> = effect.outputNames || {};

                        const outputs = effectType.definition?.outputs.map((output) => {
                            const name = customOutputNames[output.defaultName] ?? output.defaultName;
                            const canBeShorthand = stringCanBeShorthand(name);
                            return {
                                name,
                                handle: canBeShorthand ? `$&${name}` : `$effectOutput[${name}]`,
                                label: output.label,
                                description: output.description,
                                effectLabel: `${effectType.definition.name}${
                                    effect.effectLabel ? ` (${effect.effectLabel})` : ""
                                }`,
                                examples: [
                                    ...(canBeShorthand
                                        ? [
                                            {
                                                handle: `$&${name}["path", "to", "property"]`,
                                                description: `Access a property of "${name}"`
                                            },
                                            {
                                                handle: `$effectOutput[${name}]`,
                                                description: `Long hand version of "${name}"`
                                            }
                                        ]
                                        : []),
                                    {
                                        handle: `$effectOutput[${name}, "path.to.property"]`,
                                        description: `Access a property of "${name}" using long hand`
                                    }
                                ]
                            };
                        });

                        magicVariables.effectOutputs = mergeArraysWithoutDuplicates(
                            magicVariables.effectOutputs,
                            outputs,
                            "name"
                        );
                    }

                    for (const value of Object.values(effect)) {
                        if (Array.isArray(value)) {
                            const result = checkEffectListForMagicVariables(value as EffectInstance[], ignoreEffectId);
                            magicVariables.customVariables = mergeArraysWithoutDuplicates(
                                magicVariables.customVariables,
                                result.customVariables,
                                "name"
                            );
                            magicVariables.effectOutputs = mergeArraysWithoutDuplicates(
                                magicVariables.effectOutputs,
                                result.effectOutputs,
                                "name"
                            );
                        }
                    }
                }

                return magicVariables;
            }

            function determineMagicVariables(ignoreEffectId: string | null) {
                const magicVariables = {
                    customVariables: [],
                    effectOutputs: [],
                    presetListArgs:
                        $ctrl.triggerMeta?.presetListArgs?.map((a) => {
                            const canBeShorthand = stringCanBeShorthand(a.name);
                            return {
                                name: a.name,
                                handle: canBeShorthand ? `$#${a.name}` : `$presetListArg[${a.name}]`,
                                examples: canBeShorthand
                                    ? [
                                        {
                                            handle: `$presetListArg[${a.name}]`,
                                            description: "Long hand version of the preset list argument"
                                        }
                                    ]
                                    : undefined
                            };
                        }) || []
                };

                const effectsToCheck = $ctrl.triggerMeta?.rootEffects?.list || $ctrl.effectsData.list;
                const effectsResult = checkEffectListForMagicVariables(effectsToCheck, ignoreEffectId);
                magicVariables.customVariables = mergeArraysWithoutDuplicates(
                    magicVariables.customVariables,
                    effectsResult.customVariables,
                    "name"
                );
                magicVariables.effectOutputs = mergeArraysWithoutDuplicates(
                    magicVariables.effectOutputs,
                    effectsResult.effectOutputs,
                    "name"
                );

                return magicVariables;
            }
            //#endregion

            //#region List Modifications
            $ctrl.removeEffectAtIndex = function (index: number) {
                $ctrl.effectsData.list.splice(index, 1);
                $ctrl.effectsUpdate();
            };

            $ctrl.removeAllEffects = function () {
                $ctrl.effectsData.list = [];
                $ctrl.effectsUpdate();
            };

            $ctrl.duplicateEffectAtIndex = function (index: number) {
                const clonedEffect = objectCopyHelper.cloneEffect($ctrl.effectsData.list[index]);
                $ctrl.effectsData.list.splice(index + 1, 0, clonedEffect);
                $ctrl.effectsUpdate();
            };

            $ctrl.hasCopiedEffects = function () {
                return objectCopyHelper.hasCopiedEffects();
            };

            $ctrl.pasteEffects = async function (append = false) {
                if (objectCopyHelper.hasCopiedEffects()) {
                    if (append) {
                        $ctrl.effectsData.list = $ctrl.effectsData.list.concat(
                            await objectCopyHelper.getCopiedEffects($ctrl.trigger, $ctrl.triggerMeta)
                        );
                    } else {
                        $ctrl.effectsData.list = await objectCopyHelper.getCopiedEffects(
                            $ctrl.trigger,
                            $ctrl.triggerMeta
                        );
                    }
                    $ctrl.effectsUpdate();
                }
            };

            $ctrl.pasteEffectsAtIndex = async (index: number, above: boolean) => {
                if (objectCopyHelper.hasCopiedEffects()) {
                    if (!above) {
                        index++;
                    }
                    const copiedEffects = await objectCopyHelper.getCopiedEffects($ctrl.trigger, $ctrl.triggerMeta);
                    $ctrl.effectsData.list.splice(index, 0, ...copiedEffects);
                    $ctrl.effectsUpdate();
                }
            };

            $ctrl.copyEffectAtIndex = function (index: number) {
                objectCopyHelper.copyEffects([$ctrl.effectsData.list[index]]);
            };

            $ctrl.copyEffects = function () {
                objectCopyHelper.copyEffects($ctrl.effectsData.list);
            };

            $ctrl.moveEffectAtIndex = function (fromIndex: number, toIndex: number) {
                if (
                    fromIndex === toIndex ||
                    fromIndex < 0 ||
                    toIndex < 0 ||
                    fromIndex >= $ctrl.effectsData.list.length ||
                    toIndex >= $ctrl.effectsData.list.length
                ) {
                    return;
                }

                const item = $ctrl.effectsData.list[fromIndex];
                $ctrl.effectsData.list.splice(fromIndex, 1);
                $ctrl.effectsData.list.splice(toIndex, 0, item);
                $ctrl.effectsUpdate();

                setTimeout(() => {
                    const newElement = document.querySelectorAll(".effect-item")[toIndex] as HTMLElement;
                    newElement?.focus();
                }, 0);
            };

            $ctrl.handleEffectKeydown = function (event: KeyboardEvent, index: number) {
                const key = event.key;

                // Start drag mode with Enter/Return
                if (key === "Enter" && $ctrl.keyboardDragIndex == null) {
                    event.preventDefault();
                    // snapshot original order so cancel (Escape) can restore it
                    $ctrl.keyboardOriginalEffects = $ctrl.effectsData.list.slice();
                    $ctrl.keyboardDragEffectId = $ctrl.effectsData.list[index]?.id ?? null;
                    $ctrl.keyboardDragIndex = index;
                    return;
                }

                // If not currently in drag mode, ignore other keys
                if ($ctrl.keyboardDragIndex == null) {
                    return;
                }

                // Cancel drag with Escape
                if (key === "Escape") {
                    event.preventDefault();
                    if ($ctrl.keyboardOriginalEffects != null) {
                        $ctrl.effectsData.list = $ctrl.keyboardOriginalEffects.slice();
                        $ctrl.effectsUpdate();

                        setTimeout(() => {
                            let focusIndex = index;
                            if ($ctrl.keyboardDragEffectId != null) {
                                const restoredIndex = $ctrl.effectsData.list.findIndex(
                                    e => e.id === $ctrl.keyboardDragEffectId
                                );
                                if (restoredIndex >= 0) {
                                    focusIndex = restoredIndex;
                                }
                            }
                            const originalElement = document.querySelectorAll(".effect-item")[
                                focusIndex
                            ] as HTMLElement;
                            originalElement?.focus();

                            $ctrl.keyboardDragIndex = null;
                            $ctrl.keyboardDragEffectId = null;
                            $ctrl.keyboardOriginalEffects = null;
                        }, 0);
                    }
                    return;
                }

                // Drop item with Enter
                if (key === "Enter") {
                    event.preventDefault();
                    $ctrl.keyboardDragIndex = null;
                    $ctrl.keyboardDragEffectId = null;
                    $ctrl.keyboardOriginalEffects = null;
                    return;
                }

                const currentIndex = $ctrl.keyboardDragIndex;

                // Move item with Arrow keys while in drag mode
                if (key === "ArrowUp" && currentIndex > 0) {
                    event.preventDefault();
                    const newIndex = currentIndex - 1;
                    $ctrl.moveEffectAtIndex(currentIndex, newIndex);
                    $ctrl.keyboardDragIndex = newIndex;
                } else if (key === "ArrowDown" && currentIndex < $ctrl.effectsData.list.length - 1) {
                    event.preventDefault();
                    const newIndex = currentIndex + 1;
                    $ctrl.moveEffectAtIndex(currentIndex, newIndex);
                    $ctrl.keyboardDragIndex = newIndex;
                }
            };
            //#endregion

            //#region Effect Modals
            $ctrl.openEditEffectModal = (
                effect: EffectInstance,
                index: number | null,
                trigger: TriggerType,
                isNew: boolean
            ) => {
                const magicVariables = determineMagicVariables(effect.id);
                modalFactory.showEditEffectModal(
                    effect,
                    index,
                    trigger,
                    (response) => {
                        if (response.action === "add") {
                            $ctrl.effectsData.list.splice(index + 1, 0, response.effect);
                        } else if (response.action === "update") {
                            $ctrl.effectsData.list[response.index] = response.effect;
                        } else if (response.action === "delete") {
                            $ctrl.removeEffectAtIndex(response.index);
                        }
                        $ctrl.effectsUpdate();
                    },
                    { ...(($ctrl.triggerMeta as any) ?? {}), magicVariables },
                    isNew
                );
            };

            $ctrl.openNewEffectModal = (index?: number) => {
                modalService.showModal({
                    component: "addNewEffectModal",
                    backdrop: true,
                    windowClass: "no-padding-modal",
                    resolveObj: {
                        trigger: () => $ctrl.trigger,
                        triggerMeta: () => $ctrl.triggerMeta
                    },
                    closeCallback: (resp: { selectedEffectDef: EffectDefinition }) => {
                        if (resp == null) {
                            return;
                        }

                        const { selectedEffectDef } = resp;

                        const newEffect = {
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
                            id: randomUUID(),
                            type: selectedEffectDef.id,
                            active: true
                        };

                        if (index == null) {
                            $ctrl.openEditEffectModal(newEffect, null, $ctrl.trigger, true);
                            return;
                        }

                        $ctrl.openEditEffectModal(newEffect, index, $ctrl.trigger, true);
                    }
                });
            };

            $ctrl.editLabelForEffectAtIndex = function (index: number) {
                const effect = $ctrl.effectsData.list[index];
                const label = effect.effectLabel;

                modalFactory.openGetInputModal(
                    {
                        model: label,
                        label: label == null || label.length === 0 ? "Add Label" : "Edit Label",
                        saveText: "Save Label"
                    },
                    (newLabel) => {
                        if (newLabel == null || newLabel.length === 0) {
                            effect.effectLabel = null;
                        } else {
                            effect.effectLabel = newLabel;
                        }
                    }
                );
            };

            $ctrl.editTimeoutForEffectAtIndex = function (index: number) {
                const effect = $ctrl.effectsData.list[index];
                const timeout = effect.abortTimeout;
                modalFactory.openGetInputModal(
                    {
                        model: timeout,
                        label: "Set Effect Timeout",
                        descriptionText:
                            "Enter the number of seconds to wait before Firebot automatically aborts this effect.",
                        saveText: "Save Timeout",
                        inputType: "number",
                        inputPlaceholder: "Enter seconds",
                        validationFn: (value) => {
                            return new Promise((resolve) => {
                                if (value == null) {
                                    resolve(true);
                                }
                                if (isNaN(value) || value < 0) {
                                    resolve(false);
                                }
                                resolve(true);
                            });
                        },
                        validationText: "Please enter a valid number of seconds"
                    },
                    (newTimeout) => {
                        effect.abortTimeout = newTimeout;
                    }
                );
            };
            //#endregion

            $ctrl.effectContextMenuOptions = [
                {
                    html: `<a href ><i class="far fa-edit mr-4"></i> Edit Effect</a>`,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const $index = $itemScope.$index;
                        const effect = $itemScope.effect;
                        $ctrl.openEditEffectModal(effect, $index, $ctrl.trigger, false);
                    },
                    enabled: function ($itemScope: ContextMenuItemScope) {
                        const effect = $itemScope.effect;
                        return !!effectTypes.find(e => e.definition.id === effect.type);
                    }
                },
                {
                    html: `<a href ><i class="far fa-tag mr-4"></i> Edit Label</a>`,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const $index = $itemScope.$index;
                        $ctrl.editLabelForEffectAtIndex($index);
                    }
                },
                {
                    html: `<a href ><i class="far fa-toggle-off mr-4"></i>  {{effect.active ? "Disable Effect" : "Enable Effect"}}</a>`,
                    compile: true,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const effect = $itemScope.effect;
                        effect.active = !effect.active;
                    }
                },
                {
                    html: `<a href ><i class="far fa-clone mr-4"></i> Duplicate</a>`,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const $index = $itemScope.$index;
                        $ctrl.duplicateEffectAtIndex($index);
                    }
                },
                {
                    html: `<a href ><span class="iconify mr-4" data-icon="mdi:content-copy"></span> Copy</a>`,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const $index = $itemScope.$index;
                        $ctrl.copyEffectAtIndex($index);
                    }
                },
                {
                    html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt mr-4"></i> Delete</a>`,
                    click: function ($itemScope: ContextMenuItemScope) {
                        const $index = $itemScope.$index;
                        $ctrl.removeEffectAtIndex($index);
                    }
                },
                {
                    text: "Advanced...",
                    hasTopDivider: true,
                    children: [
                        {
                            html: `<a href ><i class="far fa-stopwatch mr-4"></i> Edit Timeout</a>`,
                            enabled: function ($itemScope: ContextMenuItemScope) {
                                const effect = $itemScope.effect;
                                const effectType = effectTypes.find(e => e.definition.id === effect.type);
                                return !effectType?.definition.exemptFromTimeouts;
                            },
                            click: function ($itemScope: ContextMenuItemScope) {
                                const $index = $itemScope.$index;
                                $ctrl.editTimeoutForEffectAtIndex($index);
                            }
                        },
                        {
                            html: `<a href role="menuitem"><i class="fal fa-fingerprint mr-4"></i> Copy Effect ID</a>`,
                            click: function ($itemScope: ContextMenuItemScope) {
                                const effect = $itemScope.effect;
                                $rootScope.copyTextToClipboard(effect.id);
                                ngToast.create({
                                    className: "success",
                                    content: `Copied ${effect.id} to clipboard.`
                                });
                            }
                        }
                    ]
                },
                {
                    text: "Paste...",
                    hasTopDivider: true,
                    enabled: function () {
                        return $ctrl.hasCopiedEffects();
                    },
                    children: [
                        {
                            html: `<a href><span class="iconify mr-4" data-icon="mdi:content-paste"></span> Before</a>`,
                            click: function ($itemScope: ContextMenuItemScope) {
                                const $index = $itemScope.$index;
                                if ($ctrl.hasCopiedEffects()) {
                                    $ctrl.pasteEffectsAtIndex($index, true);
                                }
                            }
                        },
                        {
                            html: `<a href><span class="iconify mr-4" data-icon="mdi:content-paste"></span> After</a>`,
                            click: function ($itemScope: ContextMenuItemScope) {
                                const $index = $itemScope.$index;
                                if ($ctrl.hasCopiedEffects()) {
                                    $ctrl.pasteEffectsAtIndex($index, false);
                                }
                            }
                        }
                    ]
                },
                {
                    text: "Add new...",
                    children: [
                        {
                            html: `<a href><i class="far fa-plus mr-4"></i> Before</a>`,
                            click: function ($itemScope: ContextMenuItemScope) {
                                const $index = $itemScope.$index;
                                $ctrl.openNewEffectModal($index - 1);
                            }
                        },
                        {
                            html: `<a href><i class="far fa-plus mr-4"></i> After</a>`,
                            click: function ($itemScope: ContextMenuItemScope) {
                                const $index = $itemScope.$index;
                                $ctrl.openNewEffectModal($index);
                            }
                        }
                    ]
                }
            ];
        }
    };

    // @ts-ignore
    angular.module("firebotApp").component("effectListNew", effectListNew);
})();
