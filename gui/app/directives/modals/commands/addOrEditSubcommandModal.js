"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditSubcommandModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Add Subcommand</h4>
            </div>
            <div class="modal-body">
            
                <div>
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Name <tooltip text="'A name to help you identify this control. Viewers wont see this.'">
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.nameError}">
                            <input type="text" id="nameField" class="form-control" ng-model="$ctrl.name" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter name">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.nameError">Please provide a name.</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Arg Type
                    </div>
                    <div ng-class="{'has-error': $ctrl.kindError}">
                        <ui-select ng-model="$ctrl.kind" theme="bootstrap" class="control-type-list">
                            <ui-select-match placeholder="Select control type">{{$select.selected.display}}</ui-select-match>
                            <ui-select-choices repeat="control.kind as control in $ctrl.controlKinds | filter: { display: $select.search }" style="position:relative;">
                                <div class="flex-row-center">
                                    <div style="width: 30px;height: 100%;font-size:20px;margin: 0 11px;text-align: center;flex-shrink: 0;">
                                        <i class="fas" ng-class="control.iconClass"></i>
                                    </div>
                                    <div>
                                        <div ng-bind-html="control.display | highlight: $select.search"></div>
                                        <small class="muted">{{control.description}}</small>
                                    </div>
                                    
                                </div>
                                
                            </ui-select-choices>
                        </ui-select>
                        <div id="helpBlock2" class="help-block" ng-show="$ctrl.kindError">Please select a control type.</div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Options
                    </div>
                    <div>
                        <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity.0.9;"> Add to grids <tooltip text="'Immediately add this control to all grid sizes (if there is room)'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.addToGrids">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Add</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($timeout) {
                let $ctrl = this;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);

                $ctrl.name = "";
                $ctrl.kind = "button";

                $ctrl.addToGrids = true;

                $ctrl.nameError = false;
                $ctrl.kindError = false;

                $ctrl.argTypes = ["Custom"];

                function validateControlName() {
                    let name = $ctrl.name;
                    return name != null && name.length > 0;
                }

                function validateControlType() {
                    let kind = $ctrl.kind;
                    return kind != null && kind.length > 0;
                }


                $ctrl.save = function() {

                    $ctrl.nameError = false;
                    $ctrl.kindError = false;

                    if (!validateControlName()) {
                        $ctrl.nameError = true;
                    }

                    if (!validateControlType()) {
                        $ctrl.kindError = true;
                    }

                    if ($ctrl.nameError || $ctrl.kindError) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            name: $ctrl.name,
                            kind: $ctrl.kind,
                            addToGrids: $ctrl.addToGrids
                        }
                    });


                };

                $ctrl.$onInit = function() {
                    if (!$ctrl.resolve.hasNumberArg) {
                        $ctrl.argTypes.push("Number");
                    }
                };
            }
        });
}());
