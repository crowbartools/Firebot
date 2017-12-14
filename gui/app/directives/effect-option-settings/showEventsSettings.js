'use strict';
(function() {

    angular
        .module('firebotApp')
        .component("showEventsSettings", {
            bindings: {
                model: '='
            },
            template: `
                <div>
                    <eos-container header="Display Style">
                        <div class="controls-fb-inline">
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
                        
                    <eos-overlay-position effect="$ctrl.model" class="setting-padtop" hide-random="true"></eos-overlay-position>
                        
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
                </div>
                `,
            controller: function() {
                let ctrl = this;

                ctrl.$onInit = function() {
                    if (ctrl.model.textType == null) {
                        ctrl.model.textType = "list";
                    }

                    if (ctrl.model.width == null) {
                        ctrl.model.width = 150;
                    }

                    if (ctrl.model.height == null) {
                        ctrl.model.height = 100;
                    }
                };
            }
        });
}());
