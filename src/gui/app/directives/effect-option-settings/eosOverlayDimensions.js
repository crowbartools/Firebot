"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("eosOverlayDimensions", {
            bindings: {
                effect: '=',
                padTop: "<"
            },
            template: `
            <eos-container header="Dimensions" pad-top="$ctrl.padTop">
                <div class="input-group">
                    <span class="input-group-addon">Width</span>
                    <input
                        type="number"
                        class="form-control"
                        aria-describeby="image-width-setting-type"
                        type="number"
                        ng-model="$ctrl.effect.width"
                        placeholder="px"
                    >
                    <span class="input-group-addon">Height</span>
                    <input
                        type="number"
                        class="form-control"
                        aria-describeby="image-height-setting-type"
                        type="number"
                        ng-model="$ctrl.effect.height"
                        placeholder="px">
                </div>
            </eos-container>`,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = function() {
                    // do stuff on init
                };
            }
        });
}());
