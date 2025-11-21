"use strict";

(function() {

    const deepmerge = require("deepmerge");

    angular
        .module('firebotApp')
        .component("multiselectList", {
            bindings: {
                model: "=",
                settings: "<",
                onUpdate: '&'
            },
            template: `
                <div>
                    <ui-select multiple ng-model="$ctrl.model" theme="bootstrap" close-on-select="false" class="control-type-list" title="Choose options">
                        <ui-select-match placeholder="Select...">{{$item.name}}<span ng-if="$item.description" class="ml-2 muted">({{$item.description}})</span></ui-select-match>
                        <ui-select-choices repeat="item.id as item in $ctrl.settings.options | filter: {name: $select.search}" style="position:relative;">
                            <div class="flex-row-center">
                                <div ng-if="item.iconClass" class="my-0 mx-4" style="width: 20px;height: 100%;font-size:16px;text-align: center;flex-shrink: 0;">
                                    <i class="fas" ng-class="item.iconClass"></i>
                                </div>
                                <div ng-class="{ 'px-4': !item.iconClass }">
                                    <div ng-bind-html="item.name | highlight: $select.search"></div>
                                    <small ng-if="item.description" ng-bind-html="item.description | highlight: $select.search" class="muted"></small>
                                </div>
                            </div>
                        </ui-select-choices>

                    </ui-select>
                </div>
            `,
            controller: function() {

                const $ctrl = this;

                const defaultSettings = {
                    options: []
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

            }
        });
}());
