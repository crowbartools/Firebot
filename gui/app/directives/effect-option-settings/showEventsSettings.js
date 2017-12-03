'use strict';
(function() {

    angular
        .module('firebotApp')
        .component("showEventsSettings", {
            bindings: {
                model: '=',
                global: '=',
            },
            template: `
                <div>
                    <eos-container header="Override Global Settings" ng-if="$ctrl.global === false">
                            <div class="controls-fb-inline" style="padding-bottom: 5px;">
                                <label class="control-fb control--radio">No
                                    <input type="radio" ng-model="$ctrl.model.override" value="no"/> 
                                    <div class="control__indicator"></div>
                                </label>
                                <label class="control-fb control--radio">Yes
                                    <input type="radio" ng-model="$ctrl.model.override" value="yes"/>
                                    <div class="control__indicator"></div>
                                </label>
                            </div>
                    </eos-container>
                    <eos-container class="setting-padtop" ng-if="$ctrl.model.override === 'yes' || $ctrl.global">
                        <eos-container header="Display Style">
                            <div class="controls-fb-inline" style="padding-bottom: 5px;">
                                <label class="control-fb control--radio">List
                                    <input type="radio" ng-model="$ctrl.model.textType" value="list"/> 
                                    <div class="control__indicator"></div>
                                </label>
                                <label class="control-fb control--radio">Replace
                                    <input type="radio" ng-model="$ctrl.model.textType" value="replace"/>
                                    <div class="control__indicator"></div>
                                </label>
                            </div>
                        </eos-container>
                        <eos-container header="Text" class="setting-padtop">
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
                        <eos-container header="Text Details" class="setting-padtop">
                            <div class="effect-setting-container setting-padtop">
                                <div class="input-group">
                                    <span class="input-group-addon">Color</span>
                                    <input 
                                    type="text" 
                                    class="form-control" 
                                    aria-describedby="showEvents-text-effect-type" 
                                    ng-model="$ctrl.model.color"
                                    placeholder="#CCCCCC"
                                    >
                                </div>
                            </div>
                            <div class="effect-setting-container setting-padtop">
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
                            </div>
                            <div class="effect-setting-container setting-padtop">
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
                            </div>
                            <div class="effect-setting-container setting-padtop">
                                <div class="input-group" style="width: 100%">
                                    <span class="input-group-addon">Text Alignment</span>
                                    <select class="fb-select form-control" ng-model="$ctrl.model.textAlignment">
                                        <option label="Left" value="left" selected="selected">Left</option>
                                        <option label="Center" value="center">Center</option>
                                        <option label="Right" value="right">Right</option>
                                    </select>
                                </div>
                            </div>
                        </eos-container>
                        
                        <eos-overlay-position effect="$ctrl.model" class="setting-padtop" ng-if="$ctrl.global"></eos-overlay-position>
                        
                        <eos-enter-exit-animations effect="$ctrl.model" class="setting-padtop"></eos-enter-exit-animations>
                        
                        <eos-container header="Dimensions" class="setting-padtop">
                            <div class="input-group">
                                <span class="input-group-addon">Width</span>
                                <input 
                                type="number"
                                class="form-control" 
                                aria-describeby="showEvents-width-setting-type"
                                ng-model="$ctrl.model.width"
                                placeholder="px">
                                <span class="input-group-addon">Height</span>
                                <input 
                                type="number"
                                class="form-control" 
                                aria-describeby="showEvents-height-setting-type"
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
                                aria-describedby="showEvents-length-effect-type" 
                                ng-model="$ctrl.model.length">
                            </div>
                        </eos-container>
                        
                        <eos-overlay-instance effect="$ctrl.model" class="setting-padtop"></eos-overlay-instance>
                    </eos-container>
                </div>
                `,
            controller: function() {
                let ctrl = this;
                ctrl.global = ctrl.global ? ctrl.global : false;

                ctrl.$onInit = function() {
                    ctrl.model.textAlignment = ctrl.model.textAlignment ? ctrl.model.textAlignment : 'left';

                    if(ctrl.model.override === null || ctrl.model.override === undefined){
                        ctrl.model.override = 'no';
                    }

                    // If we're looking at the global setting modal, then set override to true so all settings show.
                    if(ctrl.global === true){
                        ctrl.model.override = true;
                    }
                };
            }
        });
}());
