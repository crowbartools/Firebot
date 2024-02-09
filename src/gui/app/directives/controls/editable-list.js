"use strict";

const deepmerge = require("deepmerge");

(function() {
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
                        <div ng-repeat="item in $ctrl.model track by $index" class="list-item selectable" ng-click="$ctrl.editItem($index)">
                            <div style="display: flex;align-items: center;column-gap: 10px;>
                                <span ng-show="$ctrl.settings.sortable" class="dragHandle" style="height: 38px; width: 15px; align-items: center; justify-content: center; display: flex">
                                    <i class="fal fa-bars" aria-hidden="true"></i>
                                </span>
                                <span ng-if="$ctrl.settings.showIndex" class="muted">{{ $ctrl.settings.indexTemplate.replace("{index}", $ctrl.settings.indexZeroBased ? $index : $index + 1) }}</span>
                                <div uib-tooltip="Click to edit"  style="font-weight: 400;" aria-label="{{item + ' (Click to edit)'}}">{{item}}</div>
                            </div>
                            <span class="clickable" style="color: #fb7373;" ng-click="$ctrl.removeItem($index);$event.stopPropagation();" aria-label="Remove item">
                                <i class="fad fa-trash-alt" aria-hidden="true"></i>
                            </span>
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
            controller: function(utilityService, ngToast) {

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
                    addLabel: "Add",
                    editLabel: "Edit",
                    validationText: "Text cannot be empty",
                    noneAddedText: "None saved",
                    noDuplicates: false,
                    maxItems: undefined,
                    trigger: undefined,
                    triggerMeta: undefined
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
                            validationFn: (value) => {
                                return new Promise(resolve => {
                                    if (value == null || value.trim().length < 1) {
                                        resolve(false);
                                    } else {
                                        resolve(true);
                                    }
                                });
                            },
                            validationText: $ctrl.settings.validationText,
                            trigger: $ctrl.settings.trigger,
                            triggerMeta: $ctrl.settings.triggerMeta
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