"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp")
        .component("controlSettings", {
            bindings: {
                control: "="
            },
            template: `
            <div ng-switch="$ctrl.control.kind" style="padding-bottom: 10px;font-size: 15px;font-weight: 600;">
                
                <div ng-switch-when="button">
                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Button Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.text">
                    </div>

                    <eos-collapsable-panel show-label="Show Styling Options" hide-label="Hide Styling Options" hide-info-box="true">

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Text Size</span>
                            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.textSize">
                        </div>

                        <control-color-picker model="$ctrl.control.textColor" label="Text Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.accentColor" label="Accent Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.borderColor" label="Border Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.focusColor" label="Focus Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.backgroundColor" label="Background Color"></control-color-picker>

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Background Image URL</span>
                            <input type="url" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.backgroundImage">
                        </div>

                    </eos-collapsable-panel>              

                    <div class="input-group settings-buttontext" style="margin-top: 15px;">
                        <span class="input-group-addon" id="basic-addon3">Tooltip</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.tooltip">
                    </div>
                
                    <div class="input-group settings-sparkcost">
                        <span class="input-group-addon" id="basic-addon3">Spark Cost</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.cost">
                    </div>
                
                    <div class="input-group settings-cooldown">
                        <span class="input-group-addon" id="basic-addon3">Cooldown (sec)</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.cooldown">
                    </div>
                
                    <div class="input-group settings-cooldown">
                        <span class="input-group-addon" id="basic-addon3">Threshold <tooltip text="'The number of clicks before button effects are run. A progress bar is shown on the button.'"></tooltip></span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.threshold">
                    </div>
                </div>


                <div ng-switch-when="label">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Button Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.text">
                    </div>

                    <eos-collapsable-panel show-label="Show Styling Options" hide-label="Hide Styling Options" hide-info-box="true">

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Text Size</span>
                            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.textSize">
                        </div>

                        <control-color-picker model="$ctrl.control.textColor" label="Text Color"></control-color-picker>

                        <label class="control-fb control--checkbox noselect"> Bold
                            <input type="checkbox" ng-model="$ctrl.control.bold" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                        <label class="control-fb control--checkbox noselect"> Italic
                            <input type="checkbox" ng-model="$ctrl.control.italic" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                        <label class="control-fb control--checkbox noselect"> Underline
                            <input type="checkbox" ng-model="$ctrl.control.underline" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                    </eos-collapsable-panel>              
                </div>


            </div>
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.$onInit = function() {

                };
            }
        });
}());
