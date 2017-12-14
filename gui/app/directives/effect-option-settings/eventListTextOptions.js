'use strict';
(function() {

    angular
        .module('firebotApp')
        .component("eventListTextOptions", {
            bindings: {
                model: '=',
                isGlobal: "<"
            },
            template: `
                <div>
                    <eos-container header="Text Settings" ng-hide="$ctrl.isGlobal">
                        <label class="control-fb control--radio">Use Presets <span class="muted"><br />Presets are editable in Settings > Overlay or by clicking <a href ng-click="$event.stopPropagation();$ctrl.openPresetModal();">here</a>. </span>
                            <input type="radio" ng-model="$ctrl.model.override" ng-value="false"/> 
                            <div class="control__indicator"></div>
                        </label>
                        <label class="control-fb control--radio" >Customize <span class="muted"><br />Override the presets</span>
                            <input type="radio" ng-model="$ctrl.model.override" ng-value="true"/>
                            <div class="control__indicator"></div>
                        </label>
                    </eos-container>

                    <div ng-if="$ctrl.model.override || $ctrl.isGlobal">
                        <eos-container>
                            <div class="input-group">
                                <span class="input-group-addon">Text</span>
                                <input 
                                type="text" 
                                class="form-control" 
                                aria-describedby="showEvents-text-effect-type" 
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
                        </eos-container>
                        
                        <eos-container>
                            <div class="input-group">
                                <span class="input-group-addon">Color</span>
                                <input 
                                type="text" 
                                class="form-control" 
                                aria-describedby="showEvents-text-effect-type" 
                                ng-model="$ctrl.model.color"
                                placeholder="#CCCCCC">
                            </div>
                        </eos-container>

                        <eos-container>
                            <div class="input-group">
                                <span class="input-group-addon">Background Color</span>
                                <input 
                                type="text" 
                                class="form-control" 
                                aria-describedby="showEvents-text-effect-type" 
                                ng-model="$ctrl.model.backgroundColor"
                                placeholder="#000000 or transparent"
                                >
                            </div>
                        </eos-container>

                        <eos-container>
                            <div class="input-group">
                                <span class="input-group-addon">Font Size</span>
                                <input 
                                type="text" 
                                class="form-control" 
                                aria-describedby="showEvents-text-effect-type" 
                                ng-model="$ctrl.model.size"
                                placeholder="20px"
                                >
                            </div>
                        </eos-container>

                        <eos-container>
                            <div class="input-group" style="width: 100%">
                                <span class="input-group-addon">Text Alignment</span>
                                <select class="fb-select form-control" ng-model="$ctrl.model.textAlignment">
                                    <option label="Left" value="left" selected="selected">Left</option>
                                    <option label="Center" value="center">Center</option>
                                    <option label="Right" value="right">Right</option>
                                </select>
                            </div>
                        </eos-container>

                        <eosEnterExitAnimations model="$ctrl.model"></eosEnterExitAnimations>

                        <eos-container>
                            <div class="input-group">
                                <span class="input-group-addon">Duration(sec)</span>
                                <input 
                                type="number"
                                class="form-control" 
                                aria-describedby="showEvents-length-effect-type" 
                                ng-model="$ctrl.model.length">
                            </div>
                        </eos-container>
                    </div>
                    
                </div>
                `,
            controller: function(utilityService) {
                let ctrl = this;

                ctrl.openPresetModal = function() {
                    utilityService.showOverlayEventsModal();
                };

                ctrl.$onInit = function() {
                    if (ctrl.model.text == null) {
                        ctrl.model.text = "$(user) pressed $(text)!";
                    }
                    if (ctrl.model.override == null) {
                        ctrl.model.override = false;
                    }
                };
            }
        });
}());
