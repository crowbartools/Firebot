"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("roleNumber", {
            bindings: {
                roleName: "@",
                roleId: "<",
                model: "=",
                maxValue: "<",
                minValue: "<",
                onUpdate: '&'
            },
            template: `
                <div style="display:flex;flex-direction: row;align-items: center;padding: 0 15px;">
                    <div style="width:85px;overflow: hidden;">{{$ctrl.label}}</div>
                    <div style="flex-grow:1; margin-left: 10px;">
                        <input type="text" class="form-control" ng-model="$ctrl.model" placeholder="Enter number" ng-blur="$ctrl.onBlur()">
                    </div>    
                </div>
            `,
            controller: function(viewerRolesService) {

                const $ctrl = this;

                $ctrl.label = "";

                $ctrl.onBlur = () => {
                    if (!isNaN($ctrl.maxValue) && $ctrl.maxValue > 0) {
                        if ($ctrl.model > $ctrl.maxValue) {
                            $ctrl.model = $ctrl.maxValue;
                        }
                    }
                    if (!isNaN($ctrl.minValue)) {
                        if ($ctrl.model == null || $ctrl.model < $ctrl.minValue) {
                            $ctrl.model = $ctrl.minValue;
                        }
                    }
                };

                $ctrl.$onInit = () => {

                    if ($ctrl.roleId != null) {
                        const role = viewerRolesService.getRoleById($ctrl.roleId);
                        if (role) {
                            $ctrl.label = role.name;
                        }
                    } else {
                        $ctrl.label = $ctrl.roleName;
                    }
                };
            }
        });
}());
