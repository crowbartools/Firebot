"use strict";

(function() {

    const deepmerge = require("deepmerge");

    angular
        .module('firebotApp')
        .component("editableList", {
            bindings: {
                model: "=",
                settings: "<",
                onUpdate: '&'
            },
            template: `
                <div>
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.model">
                        <div ng-repeat="item in $ctrl.model track by $index" class="list-item">
                            <div style="display: flex;align-items: center;column-gap: 10px;">
                                <span ng-show="$ctrl.settings.sortable" class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                                    <i class="fal fa-bars" aria-hidden="true"></i>
                                </span>
                                <span ng-if="$ctrl.settings.showIndex" class="muted">{{ $ctrl.settings.indexTemplate.replace("{index}", $ctrl.settings.indexZeroBased ? $index : $index + 1).replace("{name}", item) }}</span>
                                <div style="font-weight: 400;" aria-label="{{item}}">{{item}}</div>
                                <span ng-if="$ctrl.settings.hintTemplate != null" class="muted">{{ $ctrl.settings.hintTemplate.replace("{index}", $ctrl.settings.indexZeroBased ? $index : $index + 1).replace("{name}", item) }}</span>
                            </div>
                            <div class="flex items-center justify-center">
                                <div ng-if="$ctrl.settings.showCopyButton" uib-tooltip="Copy" class="clickable mr-4" style="color: white;" ng-click="$ctrl.copyItem($index);" aria-label="Edit item">
                                    <i class="fas fa-copy" aria-hidden="true"></i>
                                </div>
                                <div uib-tooltip="Edit" class="clickable mr-4" style="color: white;" ng-click="$ctrl.editItem($index);" aria-label="Edit item">
                                    <i class="fas fa-edit" aria-hidden="true"></i>
                                </div>
                                <div uib-tooltip="Remove" class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeItem($index);$event.stopPropagation();" aria-label="Remove item">
                                    <i class="fad fa-trash-alt" aria-hidden="true"></i>
                                </div>
                            </div>
                        </div>
                        <p class="muted" ng-show="$ctrl.model.length < 1">{{$ctrl.settings.noneAddedText}}</p>
                    </div>
                    <div style="margin: 5px 0 10px 0px;">
                        <button
                            ng-click="$ctrl.addItem()"
                            ng-disabled="$ctrl.maxItemsReached()"
                            class="filter-bar"
                            ng-class="{ muted: $ctrl.maxItemsReached() }"
                            uib-tooltip="{{!$ctrl.maxItemsReached() ? $ctrl.settings.addLabel : 'Maximum reached' }}"
                            tooltip-append-to-body="true"
                            aria-label="{{$ctrl.settings.addLabel}}"
                        >
                            <i class="far fa-plus"></i>
                        </button>
                    </div>
                </div>
            `,
            controller: function(utilityService, ngToast, $rootScope) {

                const $ctrl = this;

                $ctrl.sortableOptions = {
                    handle: ".dragHandle",
                    stop: () => {}
                };

                const defaultSettings = {
                    sortable: false,
                    showIndex: false,
                    indexZeroBased: false,
                    indexTemplate: "{index}.",
                    showCopyButton: false,
                    hintTemplate: undefined,
                    copyTemplate: "{name}",
                    addLabel: "Add",
                    editLabel: "Edit",
                    customValidators: undefined,
                    validationText: "Text cannot be empty",
                    noneAddedText: "None saved",
                    noDuplicates: false,
                    maxItems: undefined,
                    trigger: undefined,
                    triggerMeta: undefined,
                    inputPlaceholder: undefined
                };


                $ctrl.$onInit = () => {
                    if ($ctrl.settings == null) {
                        $ctrl.settings = defaultSettings;
                    } else {
                        $ctrl.settings = deepmerge(defaultSettings, $ctrl.settings);
                    }

                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                $ctrl.maxItemsReached = () => {
                    return $ctrl.settings.maxItems != null && $ctrl.model.length >= $ctrl.settings.maxItems;
                };

                function openGetInputModal(model, isNew = true, cb) {
                    utilityService.openGetInputModal(
                        {
                            model: model,
                            label: isNew ? $ctrl.settings.addLabel : $ctrl.settings.editLabel,
                            useTextArea: $ctrl.settings.useTextArea,
                            saveText: "Save",
                            validationFn: $ctrl.settings.validationFn ?? ((value, initialValue) => {
                                return new Promise(async (resolve) => {
                                    if (value == null || value.trim().length < 1) {
                                        resolve({
                                            success: false,
                                            reason: "Text cannot be empty"
                                        });
                                    } else if ($ctrl.settings.noDuplicates && value !== initialValue && $ctrl.model.some(i => i === value)) {
                                        resolve({
                                            success: false,
                                            reason: "Must be unique"
                                        });
                                    } else {
                                        if ($ctrl.settings.customValidators) {
                                            for (const validator of $ctrl.settings.customValidators) {
                                                try {
                                                    const result = await validator(value, initialValue);
                                                    const failed = result != null && (result === false || (typeof result === "object" && result.success == false));
                                                    if (failed) {
                                                        resolve(result);
                                                        return;
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    resolve({
                                                        success: false,
                                                        reason: "An error occurred"
                                                    });
                                                    return;
                                                }
                                            }
                                        }
                                        resolve(true);
                                    }
                                });
                            }),
                            validationText: $ctrl.settings.validationText,
                            trigger: $ctrl.settings.trigger,
                            triggerMeta: $ctrl.settings.triggerMeta,
                            inputPlaceholder: $ctrl.settings.inputPlaceholder
                        },
                        cb);
                }

                $ctrl.editItem = (index) => {
                    openGetInputModal($ctrl.model[index], false, (newItem) => {
                        const foundDuplicate = [...$ctrl.model].splice(index, 1).some(i => i === newItem);
                        if (!$ctrl.settings.noDuplicates || !foundDuplicate) {
                            $ctrl.model[index] = newItem;
                        } else {
                            ngToast.create("Cannot edit: Duplicate found");
                        }
                    });
                };

                $ctrl.copyItem = (index) => {
                    const item = $ctrl.model[index];
                    const copyText = $ctrl.settings.copyTemplate
                        .replace("{name}", item)
                        .replace("{index}", index);
                    $rootScope.copyTextToClipboard(copyText);

                    ngToast.create({
                        className: 'info',
                        content: `Copied '${copyText}' to clipboard`
                    });
                };

                $ctrl.addItem = () => {
                    openGetInputModal("", true, (newItem) => {
                        const foundDuplicate = $ctrl.model.some(i => i === newItem);
                        if (!$ctrl.settings.noDuplicates || !foundDuplicate) {
                            $ctrl.model.push(newItem);
                        } else {
                            ngToast.create("Cannot add: Duplicate found");
                        }
                    });
                };

                $ctrl.removeItem = (index) => {
                    $ctrl.model.splice(index, 1);
                };

            }
        });
}());