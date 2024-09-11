"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("eosOverlayRotation", {
            bindings: {
                effect: '=',
                padTop: "<"
            },
            template: `
            <eos-container header="Rotation" pad-top="$ctrl.padTop">
                <div style="display: flex; flex-direction: row; width: 100%; align-items: center;">
                    <firebot-input
                        style="flex-grow:1"
                        input-title="Rotation"
                        model="$ctrl.effect.rotation"
                        placeholder-text="Enter rotation"
                        data-type="number"
                    />
                    <dropdown-select 
                        style="margin: 0 0 0 10px;"
                        options=" $ctrl.selectOptions"
                        selected="$ctrl.effect.rotType">
                    </dropdown-select>
                </div>
            </eos-container>
       `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = function() {
                    // do stuff on init
                    $ctrl.selectOptions = {
                        deg: 'deg',
                        rad: 'rad',
                        turn: 'turn'
                    };

                    if ($ctrl.effect.rotType == null) {
                        $ctrl.effect.rotType = "deg";
                    }
                };
            }
        });
}());
