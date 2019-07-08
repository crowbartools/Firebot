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
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.text">
                    </div>

                    <eos-collapsable-panel show-label="Show Styling Options" hide-label="Hide Styling Options" hide-info-box="true">

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Text Size</span>
                            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.textSize">
                        </div>

                        <control-color-picker model="$ctrl.control.mixplay.textColor" label="Text Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.mixplay.accentColor" label="Accent Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.mixplay.borderColor" label="Border Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.mixplay.focusColor" label="Focus Color"></control-color-picker>

                        <control-color-picker model="$ctrl.control.mixplay.backgroundColor" label="Background Color"></control-color-picker>

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Background Image URL</span>
                            <input type="url" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.backgroundImage">
                        </div>

                    </eos-collapsable-panel>              

                    <div class="input-group settings-buttontext" style="margin-top: 15px;">
                        <span class="input-group-addon" id="basic-addon3">Tooltip</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.tooltip">
                    </div>
                
                    <div class="input-group settings-sparkcost">
                        <span class="input-group-addon" id="basic-addon3">Spark Cost</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.cost">
                    </div>
                
                    <div class="input-group settings-cooldown">
                        <span class="input-group-addon" id="basic-addon3">Cooldown (sec)</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.cooldown">
                    </div>
                
                    <!--<div class="input-group settings-cooldown">
                        <span class="input-group-addon" id="basic-addon3">Threshold <tooltip text="'The number of clicks before button effects are run. A progress bar is shown on the button.'"></tooltip></span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.threshold">
                    </div>-->
                </div>


                <div ng-switch-when="label">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Label Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.text">
                    </div>

                    <eos-collapsable-panel show-label="Show Styling Options" hide-label="Hide Styling Options" hide-info-box="true">

                        <div class="input-group settings-buttontext">
                            <span class="input-group-addon" id="basic-addon3">Text Size</span>
                            <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.textSize">
                        </div>

                        <control-color-picker model="$ctrl.control.mixplay.textColor" label="Text Color"></control-color-picker>

                        <label class="control-fb control--checkbox noselect"> Bold
                            <input type="checkbox" ng-model="$ctrl.control.mixplay.bold" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                        <label class="control-fb control--checkbox noselect"> Italic
                            <input type="checkbox" ng-model="$ctrl.control.mixplay.italic" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                        <label class="control-fb control--checkbox noselect"> Underline
                            <input type="checkbox" ng-model="$ctrl.control.mixplay.underline" aria-label="...">
                            <div class="control__indicator"></div>
                        </label>

                    </eos-collapsable-panel>              
                </div>


                <div ng-switch-when="joystick">

                    <div class="input-group">
                        <span class="input-group-addon" id="basic-addon3">Sample Rate <tooltip text="'How often a Joystick should report its coordinates. In milliseconds. (Default: 50)'"></tooltip></span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.sampleRate" placeholder="50">
                    </div>

                </div>


                <div ng-switch-when="textbox">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Placeholder</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.placeholder">
                    </div>

                    <label class="control-fb control--checkbox noselect"> Multiline
                        <input type="checkbox" ng-model="$ctrl.control.mixplay.multiline" aria-label="...">
                        <div class="control__indicator"></div>
                    </label>

                    <label class="control-fb control--checkbox noselect"> Show Submit Button <tooltip text="'Whether or not a submit button should be shown. Note: submit button is always shown if a spark cost is set.'"></tooltip>
                        <input type="checkbox" ng-model="$ctrl.control.mixplay.hasSubmit" aria-label="...">
                        <div class="control__indicator"></div>
                    </label>

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Submit Button Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.submitText" placeholder="Submit">
                    </div>

                    <div class="input-group settings-sparkcost">
                        <span class="input-group-addon" id="basic-addon3">Spark Cost</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.cost">
                    </div>

                </div>


            </div>
            `,
            controller: function() {
                let $ctrl = this;

                $ctrl.$onInit = function() {
                    if (!$ctrl.control.mixplay) {
                        $ctrl.control.mixplay = {};
                    }
                };
            }
        });
}());
