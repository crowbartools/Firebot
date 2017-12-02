'use strict';
(function() {

    angular
        .module('firebotApp')
        .component("showTextSettings", {
            bindings: {
                model: '='
            },
            template: `
                <div>
                    <eos-container header="Shoutout">
                        <div class="input-group">
                            <span class="input-group-addon">Shoutout Text</span>
                            <input 
                            type="text" 
                            class="form-control" 
                            aria-describedby="shoutout-text-effect-type" 
                            ng-model="$ctrl.model.text">
                        </div>
                        <eos-collapsable-panel show-label="Show Variables" hide-label="Hide Variables">
                            <ul>
                                <li><b>$(user)</b> - Replaced by the name of the person running the button or using the command.</li>
                                <li><b>$(text)</b> - Replaced by the interactive button text or the chat command ID.</li>
                                <li><b>$(cost)</b> - Replaced by the cost of the command or button.</li>
                                <li><b>$(cooldown)</b> - Replaced by the cooldown of the command or button.</li>
                            </ul>
                        </eos-collapsable-panel>
                    
                        <div class="input-group">
                            <span class="input-group-addon">Color</span>
                            <input 
                            type="text" 
                            class="form-control" 
                            aria-describedby="shoutout-text-effect-type" 
                            ng-model="$ctrl.model.color"
                            placeholder="#CCCCCC"
                            >
                        </div>
                        <div class="input-group">
                            <span class="input-group-addon">Font Size</span>
                            <input 
                            type="text" 
                            class="form-control" 
                            aria-describedby="shoutout-text-effect-type" 
                            ng-model="$ctrl.model.size"
                            placeholder="20px"
                            >
                        </div>
                    </eos-container>
                    
                    <eos-overlay-position effect="$ctrl.model" class="setting-padtop"></eos-overlay-position>
                    
                    <eos-enter-exit-animations effect="$ctrl.model" class="setting-padtop"></eos-enter-exit-animations>
                    
                    <eos-container header="Dimensions" class="setting-padtop">
                        <div class="input-group">
                            <span class="input-group-addon">Width</span>
                            <input 
                            type="number"
                            class="form-control" 
                            aria-describeby="shoutout-width-setting-type"
                            ng-model="$ctrl.model.width"
                            placeholder="px">
                            <span class="input-group-addon">Height</span>
                            <input 
                            type="number"
                            class="form-control" 
                            aria-describeby="shoutout-height-setting-type"
                            ng-model="$ctrl.model.height"
                            placeholder="px">
                        </div>
                    </eos-container>
                    
                    <eos-container header="Duration" class="setting-padtop">
                        <div class="input-group">
                            <span class="input-group-addon">Seconds</span>
                            <input 
                            type="number"
                            class="form-control" 
                            aria-describedby="shoutout-length-effect-type" 
                            ng-model="$ctrl.model.length">
                        </div>
                    </eos-container>
                    
                    <eos-overlay-instance effect="$ctrl.model" class="setting-padtop"></eos-overlay-instance>
                </div>
                `,
            controller: function() {
                let ctrl = this;

                ctrl.$onInit = function() {
                };
            }
        });
}());
