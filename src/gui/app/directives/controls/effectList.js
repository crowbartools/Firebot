"use strict";
(function () {

    const { v4: uuid } = require("uuid");

    angular
        .module('firebotApp')
        .component("effectList", {
            bindings: {
                trigger: "@",
                triggerMeta: "<",
                effects: "<",
                update: '&',
                modalId: "@",
                header: "@",
                headerClasses: "@",
                effectContainerClasses: "@",
                hideNumbers: "<",
                weighted: "<"
            },
            template: `
            <div class="effect-list">
                <div class="flex-row-center jspacebetween effect-list-header">
                    <div class="flex items-center">
                        <h3 class="{{$ctrl.headerClasses}} m-0" style="display:inline;font-weight: 600;">Effects</h3>
                        <span class="ml-1" style="font-size: 11px;"><tooltip text="$ctrl.header" ng-if="$ctrl.header"></tooltip></span>
                    </div>

                    <div class="flex items-center">
                        <div class="mr-7" ng-if="$ctrl.getSelectedQueueModeIsCustom()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;" aria-label="Effects duration: The total duration in seconds the queue should wait after triggering this effect list before running the next one">
                                EFFECTS DURATION
                                <tooltip role="tooltip" aria-label="The total duration in seconds the queue should wait after triggering this effect list before running the next one." text="'The total duration (in secs) the queue should wait after triggering this effect list before running the next one'"></tooltip>
                            </div>
                            <div
                                class="flex justify-end items-center"
                                style="font-size: 12px;"
                                ng-click="$ctrl.openEditQueueDurationModal()"
                                aria-label="Effects duration: {{$ctrl.effectsData.queueDuration || 0}} seconds"
                                role="button"
                            >
                                <b>{{$ctrl.effectsData.queueDuration || 0}}</b>s<span class="muted ml-2" style="font-size: 9px;"><i class="fal fa-edit"></i></span>
                            </div>
                        </div>

                        <div class="mr-7" ng-if="$ctrl.validQueueSelected()">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;" aria-label="Queue Priority: If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.">
                                QUEUE PRIORITY
                                <tooltip role="tooltip" aria-label="If an effect list has priority, it will get added in front of other lists in the queue that do not have priority." text="'If an effect list has priority, it will get added in front of other lists in the queue that do not have priority.'"></tooltip>
                            </div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <a href role="button" class="ddtext" style="font-size: 12px;" aria-label="Selected: {{$ctrl.getSelectedQueuePriority() === 'Yes' ? 'high queue priority' : 'no queue priority'}}">
                                    {{$ctrl.getSelectedQueuePriority()}}<span class="fb-arrow down ddtext"></span>
                                </a>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                    <li role="none">
                                        <a href ng-click="$ctrl.effectsData.queuePriority = 'high'" class="pl-4" role="menuitem" aria-label="High priority">Yes</a>
                                    </li>
                                    <li role="none">
                                        <a href ng-click="$ctrl.effectsData.queuePriority = 'none'" class="pl-4" role="menuitem" aria-label="No priority">No</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="flex flex-col items-end mr-8">
                            <div style="font-size: 10px;opacity: 0.8;text-align: right;">
                                QUEUE
                                <tooltip role="tooltip" aria-label="Effect queues allow you to queue up effects so they don't overlap each other. Particularly useful for events." text="'Effect queues allow you to queue up effects so they don\\'t overlap each other. Particularly useful for events!'"></tooltip>
                            </div>
                            <div class="text-dropdown filter-mode-dropdown" uib-dropdown uib-dropdown-toggle>
                                <a href role="button" class="ddtext" style="font-size: 12px;">{{$ctrl.getSelectedEffectQueueName()}}<span class="fb-arrow down ddtext"></span></a>
                                <ul class="dropdown-menu" uib-dropdown-menu role="menu">
                                    <li role="none">
                                        <a
                                            href
                                            class="pl-4"
                                            ng-click="$ctrl.effectsData.queue = null"
                                            role="menuitem"
                                        >
                                            Unset <tooltip role="tooltip" aria-label="Effects will always play immediately when triggered" text="'Effects will always play immediately when triggered.'"></tooltip>
                                            <span ng-show="$ctrl.effectsData.queue == null" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>
                                        </a>
                                    </li>

                                    <li ng-repeat="queue in $ctrl.eqs.getEffectQueues() track by queue.id" role="none">
                                        <a href class="pl-4" ng-click="$ctrl.toggleQueueSelection(queue.id)" role="menuitem" aria-label="Queue: {{queue.name}}">
                                            <span>{{queue.name}}</span>
                                            <span ng-show="$ctrl.effectsData.queue === queue.id" style="color:green;display: inline-block;"><i class="fas fa-check"></i></span>
                                        </a>
                                    </li>

                                    <li ng-show="$ctrl.eqs.getEffectQueues().length < 1" role="none">
                                        <a class="muted pl-4" role="menuitem">No queues created.</a>
                                    </li>

                                    <li role="separator" class="divider"></li>
                                    <li role="none">
                                        <a href class="pl-4" ng-click="$ctrl.showAddEditEffectQueueModal()" role="menuitem">Create new queue</a>
                                    </li>

                                    <li role="none" ng-show="$ctrl.validQueueSelected()">
                                        <a href class="pl-4" ng-click="$ctrl.showAddEditEffectQueueModal($ctrl.effectsData.queue)" role="menuitem">Edit "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>

                                    <li role="none" ng-show="$ctrl.validQueueSelected()">
                                        <a href class="pl-4" ng-click="$ctrl.showDeleteEffectQueueModal($ctrl.effectsData.queue)" role="menuitem">Delete "{{$ctrl.getSelectedEffectQueueName()}}"</a>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div class="test-effects-btn clickable" uib-tooltip="Test Effects" aria-label="Test effects" ng-click="$ctrl.testEffects()" role="button">
                            <i class="far fa-play-circle"></i>
                        </div>

                        <div>
                            <a
                                href role="button"
                                aria-label="Open effects menu"
                                class="effects-actions-btn"
                                context-menu="$ctrl.createAllEffectsMenuOptions()"
                                context-menu-on="click"
                                uib-tooltip="Open effects menu"
                                tooltip-append-to-body="true"
                            >
                                <i class="fal fa-ellipsis-v"></i>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="{{$ctrl.effectContainerClasses}} mx-6 pb-6">
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.effectsData.list">
                        <div
                            ng-repeat="effect in $ctrl.effectsData.list track by $index"
                            context-menu="$ctrl.createEffectMenuOptions(effect)"
                            style="margin-bottom: 7.5px;"
                        >
                            <div
                                role="button"
                                class="effect-bar"
                                ng-class="{'disabled': !effect.active, 'has-bottom-panel': $ctrl.showBottomPanel(effect)}"
                                ng-click="$ctrl.openEditEffectModal(effect, $index, $ctrl.trigger, false)"
                                ng-mouseenter="hovering = true"
                                ng-mouseleave="hovering = false"
                            >
                                <span class="pr-4" style="display: inline-block;text-overflow: ellipsis;overflow: hidden;line-height: 20px;white-space: nowrap;">
                                    <span class="muted" ng-hide="$ctrl.hideNumbers === true">{{$index + 1}}. </span>
                                    {{$ctrl.getEffectNameById(effect.type)}}
                                    <span ng-if="$ctrl.getEffectLabel(effect)" class="muted"> ({{$ctrl.getEffectLabel(effect)}})</span>
                                </span>
                                <span class="flex-row-center">
                                    <span
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
                                    </span>
                                    <div
                                        class="flex items-center justify-center"
                                        style="font-size: 20px;height: 38px;width: 35px;text-align: center;"
                                        ng-click="$event.stopPropagation()"
                                    >
                                        <a
                                            href
                                            class="effects-actions-btn"
                                            aria-label="Open effect menu"
                                            uib-tooltip="Open effect menu"
                                            tooltip-append-to-body="true"
                                            role="button"
                                            context-menu="$ctrl.createEffectMenuOptions(effect)"
                                            context-menu-on="click"
                                            context-menu-orientation="top"
                                        >
                                            <i class="fal fa-ellipsis-v"></i>
                                        </a>
                                    </div>
                                </span>
                            </div>
                            <div ng-if="$ctrl.showBottomPanel(effect)" class="effect-weight-panel">
                                <div class="volume-slider-wrapper small-slider" style="flex-grow: 1">
                                    <i class="fas fa-balance-scale-left mr-5" uib-tooltip="Weight"></i>
                                    <rzslider rz-slider-model="effect.percentWeight" rz-slider-options="{floor: 0.0001, ceil: 1.0, step: 0.0001, precision: 4, hideLimitLabels: true, hidePointerLabels: true, showSelectionBar: true}"></rzslider>
                                </div>
                                <div class="ml-5 mr-5" style="width: 1px;height: 70%;background: rgb(255 255 255 / 25%);border-radius: 2px;flex-grow: 0; flex-shrink: 0;"></div>
                                <div>
                                    <span uib-tooltip="Calculated Chance">
                                        <i class="fas fa-dice mr-2"></i>
                                        <span style="font-family: monospace; width: 52px; display: inline-block; text-align: end;">{{$ctrl.getPercentChanceForEffect(effect)}}%</span>
                                    </span>
                                    <i class="fas fa-edit ml-2 muted" uib-tooltip="Set target percentage" tooltip-append-to-body="true" ng-click="$ctrl.openSetTargetChancePercentageModal(effect)"></i>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="add-more-functionality mt-7 ml-5">
                        <a href role="button" class="clickable" ng-click="$ctrl.openNewEffectModal($ctrl.effectsData.list.length)" aria-label="Add new effect">
                            <i class="far fa-plus-circle mr-2"></i>Add New Effect
                        </a>
                    </div>
                </div>

            </div>
            `,
            controller: function ($q, $rootScope, $scope, utilityService, effectHelperService, objectCopyHelper, effectQueuesService, presetEffectListsService,
                settingsService, backendCommunicator, ngToast, $http, $injector) {
                const ctrl = this;

                ctrl.effectsData = {
                    list: []
                };

                let effectDefinitions = [];

                const ensureDefaultWeights = (reset = false) => {
                    ctrl.effectsData.list.forEach((e) => {
                        if (!ctrl.weighted) {
                            e.percentWeight = null;
                        } else if (e.percentWeight == null || reset) {
                            e.percentWeight = 0.5;
                        }
                    });
                };

                function createEffectsData() {
                    if (ctrl.effects != null && !Array.isArray(ctrl.effects)) {
                        ctrl.effectsData = ctrl.effects;
                    }
                    if (ctrl.effectsData.list == null) {
                        ctrl.effectsData.list = [];
                    }
                    if (ctrl.effectsData.id == null) {
                        ctrl.effectsData.id = uuid();
                    }

                    ctrl.effectsData.list.forEach((e) => {
                        if (e.active == null) {
                            e.active = true;
                        }
                    });

                    ctrl.effectsUpdate();

                    $scope.$broadcast('rzSliderForceRender');
                }

                $scope.$watch("$ctrl.weighted", (newValue, oldValue) => {
                    if (!oldValue && newValue) {
                        ensureDefaultWeights(true);
                    } else {
                        ensureDefaultWeights();
                    }
                    ctrl.effectsUpdate();
                });

                const getSumOfAllWeights = () => {
                    ensureDefaultWeights();
                    const sumOfAllWeights = ctrl
                        .effectsData.list
                        .filter(e => e.active)
                        .reduce((acc, e) => acc + (e.percentWeight ?? 0.5), 0);
                    return sumOfAllWeights;
                };


                ctrl.getPercentChanceForEffect = (effect) => {
                    const sumOfAllWeights = getSumOfAllWeights();
                    const percentChance = (effect.percentWeight / sumOfAllWeights) * 100;
                    return percentChance.toFixed(2);
                };

                ctrl.openSetTargetChancePercentageModal = (effect) => {
                    utilityService.openGetInputModal(
                        {
                            model: parseFloat(ctrl.getPercentChanceForEffect(effect) || "0.5"),
                            label: "Set Target Percentage",
                            descriptionText: "Enter the target chance percentage for this effect. The weights of this and other effects will be adjusted as needed to reach the percentage.",
                            inputType: "number",
                            saveText: "Save",
                            inputPlaceholder: "Enter percentage",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    if (value == null || isNaN(value) || value < 0.0001 || value >= 100.0) {
                                        resolve(false);
                                    }
                                    resolve(true);
                                });
                            },
                            validationText: "Please enter a valid percentage greater than 0 and less than 100"
                        },
                        (newPercentage) => {
                            const sumOfAllWeights = getSumOfAllWeights();
                            const currentThisWeight = effect.percentWeight ?? 0.5;
                            const sumOfOtherWeights = sumOfAllWeights - currentThisWeight;

                            const newThisWeight = (newPercentage / 100) * sumOfAllWeights;
                            effect.percentWeight = newThisWeight;

                            const newSumOfOtherWeights = sumOfAllWeights - newThisWeight;

                            const otherEffects = ctrl.effectsData.list.filter(e => e.active && e.id !== effect.id);
                            let imperfect = false;
                            for (const otherEffect of otherEffects) {
                                let newWeight = (otherEffect.percentWeight ?? 0.5) * (newSumOfOtherWeights / sumOfOtherWeights);
                                if (newWeight < 0.0001) {
                                    imperfect = true;
                                    newWeight = 0.0001;
                                }
                                otherEffect.percentWeight = newWeight;
                            }

                            ngToast.create({
                                className: imperfect ? "warning" : "success",
                                content: imperfect ? "Couldn't perfectly match target percent as some weights hit the minimum value." : "The weights were adjusted to fit the target percentage."
                            });

                            ctrl.effectsUpdate();
                        });
                };


                ctrl.showBottomPanel = (effect) => {
                    return ctrl.weighted && effect?.active;
                };

                ctrl.createAllEffectsMenuOptions = () => {
                    const allEffectsMenuOptions = [
                        {
                            html: `<a href role="menuitem"><span class="iconify mr-4" data-icon="mdi:content-copy"></span> Copy all effects</a>`,
                            click: () => {
                                ctrl.copyEffects();
                            },
                            enabled: ctrl.effectsData.list.length > 0
                        },
                        {
                            html: `<a href role="menuitem"><span class="iconify mr-4" data-icon="mdi:content-paste"></span> Paste effects</a>`,
                            click: function () {
                                ctrl.pasteEffects(true);
                            },
                            enabled: ctrl.hasCopiedEffects()
                        },
                        {
                            html: `<a href role="menuitem" style="color: #fb7373;"><i class="far fa-trash-alt mr-4"></i>  Delete all effects</a>`,
                            click: function () {
                                ctrl.removeAllEffects();
                            },
                            enabled: ctrl.effectsData.list.length > 0
                        },
                        {
                            text: "Advanced...",
                            hasTopDivider: true,
                            children: [
                                {
                                    html: `<a href role="menuitem"><i class="fal fa-magic mr-4"></i> Convert to Preset Effect List</a>`,
                                    click: function () {
                                        ctrl.convertToPresetEffectList();
                                    },
                                    enabled: ctrl.effectsData.list.length > 0
                                },
                                {
                                    html: `<a href role="menuitem"><i class="fal fa-fingerprint mr-4"></i> Copy Effect List ID</a>`,
                                    click: function () {
                                        $rootScope.copyTextToClipboard(ctrl.effectsData.id);
                                        ngToast.create({
                                            className: "success",
                                            content: `Copied ${ctrl.effectsData.id} to clipboard.`
                                        });
                                    }
                                }
                            ]
                        },
                        {
                            html: `<a href role="menuitem"><i class="far fa-share-alt mr-4"></i> Share effects</a>`,
                            click: function () {
                                ctrl.shareEffects();
                            },
                            enabled: ctrl.effectsData.list.length > 0,
                            hasTopDivider: true
                        },
                        {
                            html: `<a href ><i class="far fa-cloud-download-alt mr-4"></i> Import shared effect</a>`,
                            click: function () {
                                ctrl.importSharedEffects();
                            }
                        }
                    ];

                    return allEffectsMenuOptions;
                };

                ctrl.createEffectMenuOptions = (effect) => {
                    const effectMenuOptions = [
                        {
                            html: `<a href ><i class="far fa-edit mr-4"></i> Edit Effect</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                const effect = $itemScope.effect;
                                ctrl.openEditEffectModal(effect, $index, ctrl.trigger, false);
                            }
                        },
                        {
                            html: `<a href ><i class="far fa-tag mr-4"></i> Edit Label</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                ctrl.editLabelForEffectAtIndex($index);
                            }
                        },
                        {
                            html: `<a href ><i class="fal fa-toggle-off mr-4"></i>  ${effect.active ? "Disable Effect" : "Enable Effect"}</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                ctrl.toggleEffectActiveState($index);
                            }
                        },
                        {
                            html: `<a href ><i class="far fa-clone mr-4"></i> Duplicate</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                ctrl.duplicateEffectAtIndex($index);
                            }
                        },
                        {
                            html: `<a href ><span class="iconify mr-4" data-icon="mdi:content-copy"></span> Copy</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                ctrl.copyEffectAtIndex($index);
                            }
                        },
                        {
                            html: `<a href style="color: #fb7373;"><i class="far fa-trash-alt mr-4"></i> Delete</a>`,
                            click: function ($itemScope) {
                                const $index = $itemScope.$index;
                                ctrl.removeEffectAtIndex($index);
                            }
                        },
                        {
                            text: "Advanced...",
                            hasTopDivider: true,
                            children: [
                                {
                                    html: `<a href ><i class="far fa-stopwatch mr-4"></i> Edit Timeout</a>`,
                                    enabled: function ($itemScope) {
                                        const effect = $itemScope.effect;
                                        const effectDefinition = effectDefinitions.find(e => e.id === effect.type);
                                        return !effectDefinition?.exemptFromTimeouts;
                                    },
                                    click: function ($itemScope) {
                                        const $index = $itemScope.$index;
                                        ctrl.editTimeoutForEffectAtIndex($index);
                                    }
                                },
                                {
                                    html: `<a href role="menuitem"><i class="fal fa-fingerprint mr-4"></i> Copy Effect ID</a>`,
                                    click: function ($itemScope) {
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
                            enabled: ctrl.hasCopiedEffects(),
                            children: [
                                {
                                    html: `<a href><span class="iconify mr-4" data-icon="mdi:content-paste"></span> Before</a>`,
                                    click: function ($itemScope) {
                                        const $index = $itemScope.$index;
                                        if (ctrl.hasCopiedEffects()) {
                                            ctrl.pasteEffectsAtIndex($index, true);
                                        }
                                    }
                                },
                                {
                                    html: `<a href><span class="iconify mr-4" data-icon="mdi:content-paste"></span> After</a>`,
                                    click: function ($itemScope) {
                                        const $index = $itemScope.$index;
                                        if (ctrl.hasCopiedEffects()) {
                                            ctrl.pasteEffectsAtIndex($index, false);
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
                                    click: function ($itemScope) {
                                        const $index = $itemScope.$index;
                                        ctrl.openNewEffectModal($index - 1);
                                    }
                                },
                                {
                                    html: `<a href><i class="far fa-plus mr-4"></i> After</a>`,
                                    click: function ($itemScope) {
                                        const $index = $itemScope.$index;
                                        ctrl.openNewEffectModal($index);
                                    }
                                }
                            ]
                        }
                    ];

                    return effectMenuOptions;
                };

                ctrl.convertToPresetEffectList = async () => {
                    $q.when(presetEffectListsService.showAddEditPresetEffectListModal({
                        effects: {
                            list: ctrl.effectsData.list
                        }
                    })).then((savedPresetEffectsList) => {
                        if (!savedPresetEffectsList) {
                            return;
                        }

                        ctrl.effectsData.list = [{
                            id: uuid(),
                            type: "firebot:run-effect-list",
                            active: true,
                            listType: "preset",
                            presetListId: savedPresetEffectsList.id,
                            presetListArgs: {}
                        }];
                    });
                };

                ctrl.shareEffects = async () => {
                    const shareCode = await backendCommunicator.fireEventAsync("getEffectsShareCode", ctrl.effectsData.list);
                    if (shareCode == null) {
                        ngToast.create("Unable to share effects.");
                    } else {
                        utilityService.showModal({
                            component: "copyShareCodeModal",
                            size: 'sm',
                            resolveObj: {
                                shareCode: () => shareCode,
                                title: () => "Effects Share Code",
                                message: () => "Share the below code so others can import these effects."
                            }
                        });
                    }
                };

                function getSharedEffects(code) {
                    return $http.get(`https://bytebin.lucko.me/${code}`)
                        .then((resp) => {
                            if (resp.status === 200) {
                                return JSON.parse(unescape(JSON.stringify(resp.data)));
                            }
                            return null;
                        }, () => {
                            return null;
                        });
                }

                ctrl.importSharedEffects = () => {
                    utilityService.openGetInputModal(
                        {
                            model: "",
                            label: "Enter Effects Share Code",
                            saveText: "Add",
                            inputPlaceholder: "Enter code",
                            validationFn: (shareCode) => {
                                return new Promise(async (resolve) => {
                                    if (shareCode == null || shareCode.trim().length < 1) {
                                        resolve(false);
                                    }

                                    const effectsData = await getSharedEffects(shareCode);

                                    if (effectsData == null || effectsData.effects == null) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: "Not a valid effects share code."

                        },
                        async (shareCode) => {
                            const effectsData = await getSharedEffects(shareCode);
                            if (effectsData.effects != null) {
                                ctrl.effectsData.list = ctrl.effectsData.list.concat(effectsData.effects);
                                ensureDefaultWeights();
                            }
                        });
                };

                ctrl.getEffectNameById = (id) => {
                    if (!effectDefinitions || effectDefinitions.length < 1) {
                        return "";
                    }

                    return effectDefinitions.find(e => e.definition.id === id).definition.name;
                };

                /**
                 * @type {{ [effectId: string]: string }}
                 */
                ctrl.effectDefaultLabels = {};

                async function getDefaultLabels() {
                    const effects = ctrl.effectsData?.list ?? [];

                    /**
                     * @type {Promise<{ id: string; defaultLabel?: string; }>[]}
                     */
                    const promises = [];
                    for (const effect of effects) {
                        if (!effect?.id) {
                            continue;
                        }

                        const effectDef = effectDefinitions.find(e => e.definition.id === effect.type);

                        if (!effectDef?.getDefaultLabel) {
                            continue;
                        }

                        const promise = Promise.resolve(
                            $injector.invoke(effectDef.getDefaultLabel, {}, {
                                effect: effect
                            })
                        ).then((label) => {
                            return {
                                id: effect.id,
                                defaultLabel: label
                            };
                        }).catch(() => {
                            return {
                                id: effect.id,
                                defaultLabel: null
                            };
                        });

                        promises.push(promise);
                    }

                    return $q.when(Promise.all(promises).then((results) => {
                        return results.reduce((acc, result) => {
                            if (result?.id && result?.defaultLabel != null) {
                                acc[result.id] = result.defaultLabel;
                            }
                            return acc;
                        }, {});
                    }));
                }

                function updateDefaultLabels() {
                    getDefaultLabels().then((labels) => {
                        ctrl.effectDefaultLabels = labels;
                    });
                }

                ctrl.getEffectLabel = (effect) => {
                    if (effect.effectLabel?.length) {
                        return effect.effectLabel;
                    }

                    if (effect?.id && settingsService.getSetting("DefaultEffectLabelsEnabled")) {
                        const defaultLabel = ctrl.effectDefaultLabels[effect.id];

                        if (defaultLabel != null) {
                            return defaultLabel;
                        }
                    }

                    return;
                };

                // when the element is initialized
                ctrl.$onInit = async function () {
                    createEffectsData();
                    effectDefinitions = await effectHelperService.getAllEffectTypes();
                    updateDefaultLabels();
                };

                ctrl.$onChanges = function () {
                    createEffectsData();
                    updateDefaultLabels();
                };

                ctrl.effectsUpdate = function () {
                    ensureDefaultWeights();
                    updateDefaultLabels();
                    ctrl.update({ effects: ctrl.effectsData });
                };

                ctrl.effectTypeChanged = function (effectType, index) {
                    ctrl.effectsData.list[index].type = effectType.id;
                    updateDefaultLabels();
                };
                ctrl.testEffects = function () {
                    ipcRenderer.send('runEffectsManually', { effects: ctrl.effectsData });
                };

                ctrl.getLabelButtonTextForLabel = function (labelModel) {
                    if (labelModel == null || labelModel.length === 0) {
                        return "Add Label";
                    }
                    return "Edit Label";
                };

                ctrl.editLabelForEffectAtIndex = function (index) {
                    const effect = ctrl.effectsData.list[index];
                    const label = effect.effectLabel;
                    utilityService.openGetInputModal(
                        {
                            model: label,
                            label: ctrl.getLabelButtonTextForLabel(label),
                            saveText: "Save Label"
                        },
                        (newLabel) => {
                            if (newLabel == null || newLabel.length === 0) {
                                effect.effectLabel = null;
                            } else {
                                effect.effectLabel = newLabel;
                            }
                        });
                };

                ctrl.editTimeoutForEffectAtIndex = function (index) {
                    const effect = ctrl.effectsData.list[index];
                    const timeout = effect.abortTimeout;
                    utilityService.openGetInputModal(
                        {
                            model: timeout,
                            label: "Set Effect Timeout",
                            descriptionText: "Enter the number of seconds to wait before Firebot automatically aborts this effect.",
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
                        });
                };

                ctrl.toggleEffectActiveState = (index) => {
                    const effect = ctrl.effectsData.list[index];
                    effect.active = !effect.active;
                };

                ctrl.duplicateEffectAtIndex = function (index) {
                    const effect = JSON.parse(angular.toJson(ctrl.effectsData.list[index]));
                    effect.id = uuid();
                    ctrl.effectsData.list.splice(index + 1, 0, effect);
                    ctrl.effectsUpdate();
                };

                ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.removeEffectAtIndex = function (index) {
                    ctrl.effectsData.list.splice(index, 1);
                    ctrl.effectsUpdate();
                };

                ctrl.removeAllEffects = function () {
                    ctrl.effectsData.list = [];
                    ctrl.effectsUpdate();
                };

                ctrl.hasCopiedEffects = function () {
                    return objectCopyHelper.hasCopiedEffects();
                };

                ctrl.pasteEffects = async function (append = false) {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (append) {
                            ctrl.effectsData.list = ctrl.effectsData.list.concat(
                                await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta)
                            );
                        } else {
                            ctrl.effectsData.list = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        }
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.pasteEffectsAtIndex = async (index, above) => {
                    if (objectCopyHelper.hasCopiedEffects()) {
                        if (!above) {
                            index++;
                        }
                        const copiedEffects = await objectCopyHelper.getCopiedEffects(ctrl.trigger, ctrl.triggerMeta);
                        ctrl.effectsData.list.splice(index, 0, ...copiedEffects);
                        ctrl.effectsUpdate();
                    }
                };

                ctrl.copyEffectAtIndex = function (index) {
                    objectCopyHelper.copyEffects([ctrl.effectsData.list[index]]);
                };

                ctrl.copyEffects = function () {
                    objectCopyHelper.copyEffects(ctrl.effectsData.list);
                };

                ctrl.openNewEffectModal = (index) => {
                    utilityService.showModal({
                        component: "addNewEffectModal",
                        autoSlide: false,
                        backdrop: true,
                        windowClass: "no-padding-modal",
                        resolveObj: {
                            trigger: () => ctrl.trigger,
                            triggerMeta: () => ctrl.triggerMeta
                        },
                        closeCallback: (resp) => {
                            if (resp == null) {
                                return;
                            }

                            const { selectedEffectDef } = resp;

                            const newEffect = {
                                id: uuid(),
                                type: selectedEffectDef.id,
                                active: true
                            };

                            if (index == null) {
                                ctrl.openEditEffectModal(newEffect, null, ctrl.trigger, true);
                                return;
                            }

                            ctrl.openEditEffectModal(newEffect, index, ctrl.trigger, true);
                        }
                    });
                };

                function mergeArraysWithoutDuplicates(initialArray, arrayToAdd, keyToCheck) {
                    const nonDupes = arrayToAdd.filter((item) => {
                        return !initialArray.some((i) => {
                            return i[keyToCheck] === item[keyToCheck];
                        });
                    });
                    return [...initialArray, ...nonDupes];
                }

                function stringCanBeShorthand(str) {
                    return /^([a-z][a-z\d._-]+)([\s\S]*)$/i.test(str);
                }

                function checkEffectListForMagicVariables(effects, ignoreEffectId) {
                    const magicVariables = {
                        customVariables: [],
                        effectOutputs: []
                    };

                    if (!effects || !Array.isArray(effects)) {
                        return;
                    }

                    for (const effect of effects) {
                        if (effect == null || typeof (effect) !== "object" || effect.id === ignoreEffectId) {
                            continue;
                        }

                        if (effect.type === "firebot:customvariable" || effect.name?.length) {
                            const canBeShorthand = stringCanBeShorthand(effect.name);
                            magicVariables.customVariables = mergeArraysWithoutDuplicates(magicVariables.customVariables, [{
                                name: effect.name,
                                handle: canBeShorthand ? `$$${effect.name}` : `$customVariable[${effect.name}]`,
                                effectLabel: effect.effectLabel,
                                examples: [
                                    ...(canBeShorthand ? [
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
                            }], "name");
                            continue;
                        }

                        const effectDefinition = effectDefinitions.find(e => e.id === effect.type);
                        if (effectDefinition != null && effectDefinition.outputs?.length) {
                            const customOutputNames = effect.outputNames || {};

                            const outputs = effectDefinition.outputs.map((output) => {
                                const name = customOutputNames[output.defaultName] ?? output.defaultName;
                                const canBeShorthand = stringCanBeShorthand(name);
                                return {
                                    name,
                                    handle: canBeShorthand ? `$&${name}` : `$effectOutput[${name}]`,
                                    label: output.label,
                                    description: output.description,
                                    effectLabel: `${effectDefinition.name}${effect.effectLabel ? ` (${effect.effectLabel})` : ""}`,
                                    examples: [
                                        ...(canBeShorthand ? [
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

                            magicVariables.effectOutputs = mergeArraysWithoutDuplicates(magicVariables.effectOutputs, outputs, "name");

                        }

                        for (const value of Object.values(effect)) {
                            if (Array.isArray(value)) {
                                const result = checkEffectListForMagicVariables(value, ignoreEffectId);
                                magicVariables.customVariables = mergeArraysWithoutDuplicates(magicVariables.customVariables, result.customVariables, "name");
                                magicVariables.effectOutputs = mergeArraysWithoutDuplicates(magicVariables.effectOutputs, result.effectOutputs, "name");
                            }
                        }
                    }

                    return magicVariables;
                }


                function determineMagicVariables(ignoreEffectId) {
                    const magicVariables = {
                        customVariables: [],
                        effectOutputs: [],
                        presetListArgs: ctrl.triggerMeta?.presetListArgs?.map((a) => {
                            const canBeShorthand = stringCanBeShorthand(a.name);
                            return {
                                name: a.name,
                                handle: canBeShorthand ? `$#${a.name}` : `$presetListArg[${a.name}]`,
                                examples: canBeShorthand ? [
                                    {
                                        handle: `$presetListArg[${a.name}]`,
                                        description: "Long hand version of the preset list argument"
                                    }
                                ] : undefined
                            };
                        }) || []
                    };

                    const effectsToCheck = ctrl.triggerMeta?.rootEffects?.list || ctrl.effectsData.list;
                    const effectsResult = checkEffectListForMagicVariables(effectsToCheck, ignoreEffectId);
                    magicVariables.customVariables = mergeArraysWithoutDuplicates(magicVariables.customVariables, effectsResult.customVariables, "name");
                    magicVariables.effectOutputs = mergeArraysWithoutDuplicates(magicVariables.effectOutputs, effectsResult.effectOutputs, "name");

                    return magicVariables;
                }

                ctrl.openEditEffectModal = (effect, index, trigger, isNew) => {
                    const magicVariables = determineMagicVariables(effect.id);
                    utilityService.showEditEffectModal(effect, index, trigger, (response) => {
                        if (response.action === "add") {
                            ctrl.effectsData.list.splice(index + 1, 0, response.effect);
                        } else if (response.action === "update") {
                            ctrl.effectsData.list[response.index] = response.effect;
                        } else if (response.action === "delete") {
                            ctrl.removeEffectAtIndex(response.index);
                        }
                        ctrl.effectsUpdate();
                    }, { ...(ctrl.triggerMeta ?? {}), magicVariables }, isNew);
                };

                //effect queue

                ctrl.eqs = effectQueuesService;

                ctrl.getSelectedEffectQueueName = () => {
                    const unsetDisplay = "Not set";
                    if (ctrl.effectsData.queue == null) {
                        return unsetDisplay;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) {
                        return unsetDisplay;
                    }

                    return queue.name;
                };

                ctrl.getSelectedQueuePriority = () => {
                    const priority = ctrl.effectsData.queuePriority;
                    return priority === 'high' ? 'Yes' : 'No';
                };

                ctrl.getSelectedQueueModeIsCustom = () => {
                    if (ctrl.effectsData.queue == null) {
                        return false;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    if (queue == null) {
                        return false;
                    }

                    return queue.mode === "custom";
                };

                ctrl.toggleQueueSelection = (queueId) => {
                    if (ctrl.effectsData.queue !== queueId) {
                        ctrl.effectsData.queue = queueId;
                    } else {
                        ctrl.effectsData.queue = null;
                    }
                };

                ctrl.validQueueSelected = () => {
                    if (ctrl.effectsData.queue == null) {
                        return false;
                    }

                    const queue = effectQueuesService.getEffectQueue(ctrl.effectsData.queue);
                    return queue != null;
                };

                ctrl.showAddEditEffectQueueModal = (queueId) => {
                    effectQueuesService.showAddEditEffectQueueModal(queueId)
                        .then((id) => {
                            ctrl.effectsData.queue = id;
                        });
                };

                ctrl.showDeleteEffectQueueModal = (queueId) => {
                    effectQueuesService.showDeleteEffectQueueModal(queueId)
                        .then((confirmed) => {
                            if (confirmed) {
                                ctrl.effectsData.queue = undefined;
                            }
                        });
                };

                ctrl.openEditQueueDurationModal = () => {
                    utilityService.openGetInputModal(
                        {
                            model: ctrl.effectsData.queueDuration || 0,
                            label: "Edit Effects Duration",
                            saveText: "Save",
                            inputPlaceholder: "Enter secs",
                            validationFn: (value) => {
                                return new Promise((resolve) => {
                                    if (value == null || value < 0) {
                                        return resolve(false);
                                    }
                                    resolve(true);
                                });
                            },
                            validationText: "Value must be greater than 0."

                        },
                        (newDuration) => {
                            ctrl.effectsData.queueDuration = newDuration;
                        }
                    );
                };

            }
        });
}());
