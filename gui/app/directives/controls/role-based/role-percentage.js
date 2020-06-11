"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("rolePercentage", {
            bindings: {
                roleName: "@",
                roleId: "<",
                model: "=",
                onUpdate: '&'
            },
            template: `
            <div style="display:flex;flex-direction: row;align-items: center;padding: 0 15px;justify-content: space-between;">
                <div style="width:85px;overflow: hidden;">{{$ctrl.label}}</div>
                <rzslider rz-slider-model="$ctrl.model" rz-slider-options="$ctrl.sliderOptions" style="transform: translateY(-8px);width: 315px;"></rzslider>
                <div style="width:39px;text-align:right;">{{$ctrl.model}}%</div>
            </div>
            `,
            controller: function(viewerRolesService) {

                const $ctrl = this;

                $ctrl.sliderOptions = {
                    floor: 0,
                    ceil: 100,
                    step: 5,
                    showTicks: false,
                    showSelectionBar: true,
                    hidePointerLabels: true,
                    hideLimitLabels: true
                };

                $ctrl.label = "";

                $ctrl.$onInit = () => {
                    if ($ctrl.model === null || $ctrl.model === undefined) {
                        $ctrl.model = 50;
                    }

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
