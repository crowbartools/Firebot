'use strict';
(function() {

    angular
        .module('firebotApp')
        .component("showEventsSettings", {
            bindings: {
                model: '=',
                global: '='
            },
            template: `
                <div>
                    <eos-container class="setting-padtop" ng-if="$ctrl.model.override === true || $ctrl.global">
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
                        
                        <eos-overlay-position effect="$ctrl.model" class="setting-padtop" ng-if="$ctrl.global"></eos-overlay-position>
                        
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
                        
                        <eos-overlay-instance effect="$ctrl.model" class="setting-padtop"></eos-overlay-instance>
                    </eos-container>
                </div>
                `,
            controller: function() {
                let ctrl = this;

                ctrl.$onInit = function() {

                };
            }
        });
}());
