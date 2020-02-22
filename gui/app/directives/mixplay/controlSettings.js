"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp")
        .component("controlSettings", {
            bindings: {
                control: "=",
                kind: "<",
                updateMode: "<",
                trigger: "@",
                triggerMeta: "<"
            },
            template: `
            <div ng-switch="$ctrl.kind" style="padding-bottom: 10px;font-size: 15px;font-weight: 600;">
                
                <div ng-switch-when="button">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Button Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.text" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
                    </div>

                    <div class="expandable-item smaller-item"
                        style="justify-content: space-between;" 
                        ng-init="hidePanel = true" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}">    
                            <div style="flex-basis: 30%;padding-left: 15px;font-size: 14px;">Styling Options</div>

                            <div style="display: flex; align-items: center;">
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>
                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded smaller-item">
                        <div style="padding: 15px 20px 10px 20px;">
                            <div class="input-group settings-buttontext">
                                <span class="input-group-addon" id="basic-addon3">Text Size <tooltip text="'Supports any CSS size unit. If only a number is provided, \\'px\\' is assumed.'"></tooltip></span>
                                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.textSize" replace-variables disable-variable-menu="!$ctrl.updateMode">
                            </div>

                            <control-color-picker model="$ctrl.control.mixplay.textColor" label="Text Color"></control-color-picker>

                            <control-color-picker model="$ctrl.control.mixplay.accentColor" label="Accent Color"></control-color-picker>

                            <control-color-picker model="$ctrl.control.mixplay.borderColor" label="Border Color"></control-color-picker>

                            <control-color-picker model="$ctrl.control.mixplay.focusColor" label="Focus Color"></control-color-picker>

                            <control-color-picker model="$ctrl.control.mixplay.backgroundColor" label="Background Color"></control-color-picker>

                            <div class="input-group settings-buttontext">
                                <span class="input-group-addon" id="basic-addon3">Background Image URL</span>
                                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.backgroundImage" replace-variables disable-variable-menu="!$ctrl.updateMode">
                            </div>
                        </div>
                    </div>         

                    <div class="input-group settings-buttontext" style="margin-top: 15px;">
                        <span class="input-group-addon" id="basic-addon3">Tooltip</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.tooltip" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
                    </div>
                
                    <div class="input-group settings-sparkcost">
                        <span class="input-group-addon" id="basic-addon3">Spark Cost</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="{{$ctrl.updateMode ? 'text' : 'number' }}" ng-model="$ctrl.control.mixplay.cost" replace-variables="number" disable-variable-menu="!$ctrl.updateMode">
                    </div>
                
                    <div class="input-group settings-cooldown" ng-hide="$ctrl.updateMode">
                        <span class="input-group-addon" id="basic-addon3">Cooldown (sec)</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.cooldown">
                    </div>

                    <div class="input-group settings-progress">
                        <span class="input-group-addon" id="basic-addon3">Progress Bar (%)</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="{{$ctrl.updateMode ? 'text' : 'number' }}" ng-model="$ctrl.control.mixplay.progress" replace-variables="number" disable-variable-menu="!$ctrl.updateMode">
                    </div>

                    <div class="input-group settings-cooldown">
                        <div style="margin-bottom: 3px;font-size: 14px;font-weight: 400;">Keyboard Control <tooltip text="'Allow viewers to trigger this button with a keyboard press.'"></tooltip></div>
                        <key-capture key-code="$ctrl.control.mixplay.keyCode"></key-capture>
                    </div>
                
                    <!--<div class="input-group settings-cooldown">
                        <span class="input-group-addon" id="basic-addon3">Threshold <tooltip text="'The number of clicks before button effects are run. A progress bar is shown on the button.'"></tooltip></span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.threshold">
                    </div>-->
                </div>

                <div ng-switch-when="image">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Image URL</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.imageUrl" replace-variables disable-variable-menu="!$ctrl.updateMode">
                    </div>

                    <div class="input-group settings-buttontext" style="margin-top: 15px;">
                        <span class="input-group-addon" id="basic-addon3">Tooltip</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.tooltip" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
                    </div>

                    <div class="expandable-item smaller-item"
                        style="justify-content: space-between;" 
                        ng-init="hidePanel = true" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}">    
                            <div style="flex-basis: 30%;padding-left: 15px;font-size: 14px;">Styling Options</div>

                            <div style="display: flex; align-items: center;">
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>
                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded smaller-item">
                        <div style="padding: 15px 20px 10px 20px;">
                            <div class="input-group settings-buttontext">
                                <span class="input-group-addon" id="basic-addon3">Border Radius<tooltip text="'Supports any CSS size unit. If only a number is provided, \\'px\\' is assumed.'"></tooltip></span>
                                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.borderRadius" replace-variables disable-variable-menu="!$ctrl.updateMode" placeholder="40px">
                            </div>

                            <control-color-picker model="$ctrl.control.mixplay.borderColor" label="Border Color"></control-color-picker>
                        </div>
                    </div>  

                </div>

                <div ng-switch-when="label">

                    <div class="input-group settings-buttontext">
                        <span class="input-group-addon" id="basic-addon3">Label Text</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.text" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
                    </div>


                    <div class="expandable-item smaller-item"
                        style="justify-content: space-between;" 
                        ng-init="hidePanel = true" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}">    
                            <div style="flex-basis: 30%;padding-left: 15px;font-size: 14px;">Styling Options</div>

                            <div style="display: flex; align-items: center;">
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>
                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded smaller-item">
                        <div style="padding: 15px 20px 10px 20px;">

                            <div class="input-group settings-buttontext">
                                <span class="input-group-addon" id="basic-addon3">Text Size <tooltip text="'Supports any CSS size unit. If only a number is provided, \\'px\\' is assumed.'"></tooltip></span>
                                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.textSize" replace-variables disable-variable-menu="!$ctrl.updateMode">
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

                            <div class="input-group">
                                <div style="margin-bottom: 3px;font-size: 14px;font-weight: 400;">Justification <tooltip text="'Text justification within the container.'"></tooltip></div>
                                <div class="controls-fb-inline">
                                    <label class="control-fb control--radio">Left
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="left"/>
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label class="control-fb control--radio">Center
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="center"/>
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label class="control-fb control--radio">Right
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="right"/>
                                        <div class="control__indicator"></div>
                                    </label>             
                                </div>        
                            </div>
                        </div>
                    </div>
                </div>

                <div ng-switch-when="viewerStat">

                    <div class="input-group">
                        <div style="margin-bottom: 3px;font-size: 14px;font-weight: 400;">Stat Type <tooltip text="'Which stat to display to the viewer. This display is unique to each viewer so they will always see their own stat value.'"></tooltip></div>
                        <div class="dropdown">
                            <button class="btn btn-default dropdown-toggle" type="button" id="options-themes" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                                <span class="dropdown-text">{{$ctrl.getSelectedStatType()}}</span>
                                <span class="caret"></span>
                            </button>
                            <ul class="dropdown-menu">
                                <li ng-repeat="stat in $ctrl.statTypes"><a href ng-click="$ctrl.control.mixplay.statDataField = stat.field">{{stat.name}}</a></li>
                            </ul>
                        </div>
                    </div>

                    <div class="expandable-item smaller-item"
                        style="justify-content: space-between;" 
                        ng-init="hidePanel = true" 
                        ng-click="hidePanel = !hidePanel" 
                        ng-class="{'expanded': !hidePanel}">    
                            <div style="flex-basis: 30%;padding-left: 15px;font-size: 14px;">Styling Options</div>

                            <div style="display: flex; align-items: center;">
                                <div style="width:30px;">
                                    <i class="fas" ng-class="{'fa-chevron-right': hidePanel, 'fa-chevron-down': !hidePanel}"></i>
                                </div>
                            </div>
                    </div>
                    <div uib-collapse="hidePanel" class="expandable-item-expanded smaller-item">
                        <div style="padding: 15px 20px 10px 20px;">

                            <div class="input-group settings-buttontext">
                                <span class="input-group-addon" id="basic-addon3">Text Size <tooltip text="'Supports any CSS size unit. If only a number is provided, \\'px\\' is assumed.'"></tooltip></span>
                                <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.textSize" replace-variables disable-variable-menu="!$ctrl.updateMode">
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

                            <div class="input-group">
                                <div style="margin-bottom: 3px;font-size: 14px;font-weight: 400;">Justification <tooltip text="'Text justification within the container.'"></tooltip></div>
                                <div class="controls-fb-inline">
                                    <label class="control-fb control--radio">Left
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="left"/>
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label class="control-fb control--radio">Center
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="center"/>
                                        <div class="control__indicator"></div>
                                    </label>
                                    <label class="control-fb control--radio">Right
                                        <input type="radio" ng-model="$ctrl.control.mixplay.justification" value="right"/>
                                        <div class="control__indicator"></div>
                                    </label>             
                                </div>        
                            </div>

                        </div>
                    </div>
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
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.placeholder" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
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
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="$ctrl.control.mixplay.submitText" placeholder="Submit" replace-variables disable-variable-menu="!$ctrl.updateMode" ng-trim="false">
                    </div>

                    <div class="input-group settings-sparkcost">
                        <span class="input-group-addon" id="basic-addon3">Spark Cost</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="{{$ctrl.updateMode ? 'text' : 'number' }}" ng-model="$ctrl.control.mixplay.cost" replace-variables disable-variable-menu="!$ctrl.updateMode">
                    </div>

                    <div class="input-group settings-cooldown" ng-hide="$ctrl.updateMode">
                        <span class="input-group-addon" id="basic-addon3">Cooldown (sec)</span>
                        <input class="form-control" aria-describedby="basic-addon3" type="number" ng-model="$ctrl.control.mixplay.cooldown">
                    </div>

                </div>


            </div>
            `,
            controller: function($scope, currencyService) {
                let $ctrl = this;

                $ctrl.$onInit = function() {
                    if (!$ctrl.control.mixplay) {
                        $ctrl.control.mixplay = {};
                    }

                    $scope.trigger = $ctrl.trigger;
                    $scope.triggerMeta = $ctrl.triggerMeta;


                    if (($ctrl.kind === "label" || $ctrl.kind === "viewerStat") && $ctrl.control.mixplay.justification == null) {
                        $ctrl.control.mixplay.justification = "center";
                    }

                    if ($ctrl.kind === "viewerStat") {

                        if ($ctrl.control.mixplay.statDataField == null) {
                            $ctrl.control.mixplay.statDataField = "viewTime";
                        }

                        $ctrl.statTypes = [
                            {
                                name: "View Time",
                                field: "viewTime"
                            },
                            {
                                name: "MixPlay Interactions",
                                field: "mixplayInteractions"
                            },
                            {
                                name: "Chat Messages",
                                field: "chatMessages"
                            }
                        ];

                        let currencies = currencyService.getCurrencies();
                        for (let currency of currencies) {
                            $ctrl.statTypes.push({
                                name: `${currency.name} (Currency)`,
                                field: `currency:${currency.id}`
                            });
                        }
                    }
                };

                $ctrl.getSelectedStatType = () => {
                    let stat = $ctrl.statTypes.find(st => st.field === $ctrl.control.mixplay.statDataField);
                    if (stat) {
                        return stat.name;
                    }
                    return "Unknown Stat";
                };
            }
        });
}());
