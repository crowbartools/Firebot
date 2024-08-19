"use strict";

(function() {

    angular
        .module('firebotApp')
        .component("firebotList", {
            bindings: {
                model: "=ngModel",
                settings: "<?",
                onEditClicked: "&",
                onDeleteClicked: "&",
                onAddNewClicked: "&"
            },
            require: {
                ngModelCtrl: 'ngModel'
            },
            template: `
                <div>
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.model">
                        <div ng-repeat="item in $ctrl.model track by $index">
                            <div class="list-item" style="height: unset;" ng-style="{ 'margin-bottom': $ctrl.storedSettings.connectItems ? '0' : '5px' }">
                                <div style="display: flex;align-items: center;column-gap: 10px;">
                                    <span ng-show="$ctrl.storedSettings.sortable" class="dragHandle" style="width: 15px; align-items: center; justify-content: center; display: flex">
                                        <i class="fal fa-bars" aria-hidden="true"></i>
                                    </span>
                                    <span ng-if="$ctrl.storedSettings.showIndex" class="muted">{{ $ctrl.populateTemplate($ctrl.storedSettings.indexTemplate, item, $index) }}</span>
                                    <div style="font-weight: 400;" aria-label="{{ item[$ctrl.storedSettings.nameProperty]}}">{{ item[$ctrl.storedSettings.nameProperty] }}</div>
                                    <span ng-if="$ctrl.storedSettings.hintTemplate != null" class="muted">{{ $ctrl.populateTemplate($ctrl.storedSettings.hintTemplate, item, $index) }}</span>
                                </div>
                                <div class="flex items-center justify-center">
                                    <div uib-tooltip="Edit" class="clickable mr-4" style="color: white;" ng-click="$ctrl.onEdit($index)" aria-label="Edit item">
                                        <i class="fas fa-edit" aria-hidden="true"></i>
                                    </div>
                                    <div uib-tooltip="Remove" class="clickable" style="color: #fb7373;" ng-click="$ctrl.onDelete($index)" aria-label="Remove item">
                                        <i class="fad fa-trash-alt" aria-hidden="true"></i>
                                    </div>
                                </div>
                            </div>
                            <div ng-if="$ctrl.storedSettings.connectItems" class="flex items-center justify-center">
                                <div class="fb-arrow-wrapper up">
                                    <div class="arrow-line"></div>
                                    <div class="arrow-tip"></div>
                                </div>
                            </div>
                        </div>
                        <p class="muted" ng-show="$ctrl.model.length < 1">{{$ctrl.storedSettings.noneAddedText}}</p>
                    </div>
                    <div
                        class="list-add-btn-wrapper"
                        ng-class="{ 'connected': $ctrl.storedSettings.connectItems && $ctrl.model.length }"
                    >
                        <button
                            ng-click="$ctrl.onAddNew()"
                            ng-disabled="$ctrl.maxItemsReached()"
                            class="list-add-btn"
                            ng-class="{ muted: $ctrl.maxItemsReached() }"
                            uib-tooltip="{{!$ctrl.maxItemsReached() ? '' : 'Maximum reached' }}"
                            tooltip-append-to-body="true"
                            aria-label="{{$ctrl.storedSettings.addLabel}}"
                            type="button"
                        >
                            <i class="far fa-plus mr-2"></i> {{$ctrl.storedSettings.addLabel}}
                        </button>
                    </div>
                </div>
            `,
            controller: function($scope) {

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
                    nameProperty: "name",
                    hintTemplate: undefined,
                    addLabel: "Add",
                    noneAddedText: "None saved",
                    maxItems: undefined,
                    connectItems: false
                };

                $ctrl.storedSettings = defaultSettings;

                $ctrl.resolvedTemplates = {};

                $ctrl.populateTemplate = (templateString, item, index) => {
                    let resolvedTemplate = templateString
                        .replace(/{index}/, $ctrl.storedSettings.indexZeroBased ? index : index + 1);
                    const props = [...new Set(templateString.match(/(?<={)[a-zA-Z]+(?=})/gm))];
                    for (const prop of props) {
                        resolvedTemplate = resolvedTemplate.replace(new RegExp(`{${prop}}`), item[prop] ?? '-');
                    }
                    return resolvedTemplate;
                };


                const setSettings = function() {
                    if ($ctrl.settings == null) {
                        $ctrl.storedSettings = defaultSettings;
                    } else {
                        $ctrl.storedSettings = {
                            ...defaultSettings,
                            ...$ctrl.settings
                        };
                    }
                };

                $ctrl.$onInit = () => {
                    setSettings();

                    if ($ctrl.model == null) {
                        $ctrl.model = [];
                    }
                };

                $ctrl.onAddNew = () => {
                    $ctrl.ngModelCtrl.$setDirty();
                    $ctrl.ngModelCtrl.$setTouched();
                    $ctrl.onAddNewClicked();
                };

                $ctrl.onDelete = (index) => {
                    $ctrl.ngModelCtrl.$setDirty();
                    $ctrl.ngModelCtrl.$setTouched();
                    $ctrl.onDeleteClicked({ index });
                };

                $ctrl.onEdit = (index) => {
                    $ctrl.ngModelCtrl.$setDirty();
                    $ctrl.ngModelCtrl.$setTouched();
                    $ctrl.onEditClicked({ index });
                };

                $ctrl.$onChanges = () => {
                    setSettings();
                };

                $ctrl.maxItemsReached = () => {
                    return $ctrl.storedSettings.maxItems != null && $ctrl.model.length >= $ctrl.storedSettings.maxItems;
                };
            }
        });
}());