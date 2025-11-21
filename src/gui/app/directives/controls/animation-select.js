"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("animationSelect", {
            bindings: {
                type: "@",
                model: "=ngModel"
            },
            require: {
                ngModelCtrl: 'ngModel'
            },
            template: `
            <div>
                <select
                    class="fb-select"
                    ng-model="$ctrl.model.class"
                    ng-options="ani.class as ani.name group by ani.category for ani in $ctrl.animations[$ctrl.type]"
                ></select>
                <div ng-hide="$ctrl.model.class === 'none'">
                    <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 5px 0 15px 25px; align-items: center;">
                        <firebot-checkbox
                            label="Custom Duration"
                            ng-init="customDuration = ($ctrl.model.duration != null && $ctrl.model.duration !== '')"
                            model="customDuration"
                            style="margin: 0px 15px 0px 0px"
                            ng-click="$ctrl.model.duration = undefined"
                        />
                        <div ng-show="customDuration">
                            <input
                                type="number"
                                class="form-control"
                                ng-model="$ctrl.model.duration"
                                style="width: 125px;"
                                placeholder="Seconds"
                            />
                        </div>
                    </div>
                </div>
            </div>
            `,
            controller: function(animationService) {
                const $ctrl = this;

                $ctrl.animations = animationService.animations;

                $ctrl.$onInit = () => {
                    if (!["enter", "exit", "inbetween"].includes($ctrl.type)) {
                        throw new Error(`Invalid animation type: ${$ctrl.type}`);
                    }

                    if ($ctrl.model == null) {
                        $ctrl.model = {
                            class: "none",
                            duration: undefined
                        };
                    }
                };
            }
        });
}());
