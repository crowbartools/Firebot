"use strict";


(function() {

    const deepmerge = require("deepmerge");

    angular
        .module('firebotApp')
        .component("editableTags", {
            bindings: {
                model: "=",
                settings: "<",
                onUpdate: '&'
            },
            template: `
                <div>
                    <div class="fb-tag" ng-repeat="item in $ctrl.model track by $index">
                        <span
                            class="tag-name clickable"
                            ng-click="$ctrl.editItem($index)"
                            aria-label="{{item + ' (Click to edit)'}}"
                        >
                            {{item}}
                        </span>
                        <span
                            class="tag-remove clickable"
                            ng-click="$ctrl.removeItem($index)"
                            aria-label="Remove item"
                        >
                            <i class="far fa-times"></i>
                        </span>
                    </div>
                    <button
                        class="filter-bar clickable"
                        ng-click="$ctrl.addItem()"
                        uib-tooltip="{{$ctrl.settings.addLabel}}"
                        tooltip-append-to-body="true"
                        aria-label="{{$ctrl.settings.addLabel}}"
                    >
                        <i class="far fa-plus"></i>
                    </button>
                </div>
            `,
            controller: function(utilityService, ngToast) {

                const $ctrl = this;

                const defaultSettings = {
                    addLabel: "Add",
                    editLabel: "Edit",
                    validationText: "Text cannot be empty",
                    noDuplicates: false
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
                            validationText: $ctrl.settings.validationText
                        },
                        cb);
                }

                $ctrl.editItem = (index) => {
                    openGetInputModal($ctrl.model[index], false, (newItem) => {
                        const foundDuplicate = $ctrl.model.filter((_, i) => i !== index).some(i => i === newItem);
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