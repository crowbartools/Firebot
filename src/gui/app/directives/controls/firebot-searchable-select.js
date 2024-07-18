"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotSearchableSelect", {
            bindings: {
                modelValue: "=ngModel",
                placeholder: "@?",
                name: "@?",
                id: "@?",
                required: "<?",
                items: "<"
            },
            template: `
                <ui-select input-id="{{$ctrl.id || ''}}" name="{{$ctrl.name || ''}}" ng-required="$ctrl.required" ng-model="$ctrl.modelValue" theme="bootstrap" class="control-type-list">
                    <ui-select-match placeholder="{{$ctrl.placeholder || ''}}">{{$select.selected.name}}</ui-select-match>
                    <ui-select-choices repeat="item.id as item in $ctrl.items | filter: { name: $select.search }" style="position:relative;">
                        <div class="flex-row-center">
                            <div ng-if="item.iconClass" class="my-0 mx-4" style="width: 20px;height: 100%;font-size:16px;text-align: center;flex-shrink: 0;">
                                <i class="fas" ng-class="item.iconClass"></i>
                            </div>
                            <div>
                                <div ng-bind-html="item.name | highlight: $select.search"></div>
                                <small ng-if="item.description" class="muted">{{item.description}}</small>
                            </div>
                        </div>
                    </ui-select-choices>
                </ui-select>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    console.log($ctrl.items);
                };
            }
        });
}());
