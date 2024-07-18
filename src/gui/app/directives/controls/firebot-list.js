"use strict";

const deepmerge = require("deepmerge");

(function() {
    angular
        .module('firebotApp')
        .component("firebotList", {
            bindings: {
                model: "=",
                settings: "<?",
                onEditClicked: "&",
                onAddNewClicked: "&"
            },
            template: `
                <div>
                    <div ui-sortable="$ctrl.sortableOptions" ng-model="$ctrl.model" ui-sortable-update="callBackFunction1">
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
                    hintTemplate: undefined,
                    copyTemplate: "{name}",
                    addLabel: "Add",
                    editLabel: "Edit",
                    noneAddedText: "None saved",
                    maxItems: undefined
                };

                $ctrl.onOrderChanged = () => {
                }


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


            }
        });
}());