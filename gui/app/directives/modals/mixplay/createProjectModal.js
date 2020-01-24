"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("createProjectModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Create MixPlay Project</h4>
            </div>
            <div class="modal-body"> 

                <div>
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Project Name
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
                        Options
                    </div>
                    <div>
                        <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity.0.9;"> Import controls from a DevLab project <tooltip text="'Check if you want to import controls from Mixer\\'s DevLab (what Firebot v4 used).'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.importDevLab">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                    
                    <div ng-show="$ctrl.importDevLab" style="margin-top:10px;padding-left:10px;">
                        <div class="mixplay-header" style="padding: 0 0 4px 0">
                            DevLab Project Code <tooltip text="'You can find a project\\'s code on the Code tab of the DevLab'"></tooltip>
                        </div>
                        <div style="width: 100%; position: relative;">
                            <div class="form-group" ng-class="{'has-error': $ctrl.codeError}">
                                <input type="number" id="codeField" class="form-control" ng-model="$ctrl.devlabCode" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter project code">
                                <span id="helpBlock" class="help-block" ng-show="$ctrl.codeError">Please provide a DevLab Project Code or uncheck "Import" above.</span>
                            </div>
                        </div>
                    </div>   
                </div>

                <div style="margin-top: 15px;" ng-show="$ctrl.hasActiveProject">
                    <div>
                        <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity.0.9;"> Set as active project <tooltip text="'Automatically set this new project as the active project (aka the project that is used when Firebot connects to MixPlay). You can always change this later.'"></tooltip>
                            <input type="checkbox" ng-model="$ctrl.setAsActive">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">{{$ctrl.importDevLab ? "Import" : "Create"}}</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($timeout, mixplayService) {
                let $ctrl = this;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);

                $ctrl.name = "";

                $ctrl.nameError = false;
                $ctrl.codeError = false;

                $ctrl.hasActiveProject = mixplayService.getActiveMixplayProjectId() != null;

                function validateName() {
                    let name = $ctrl.name;
                    return name != null && name.length > 0;
                }

                $ctrl.save = function() {

                    $ctrl.nameError = false;
                    $ctrl.codeError = false;

                    if (!validateName()) {
                        $ctrl.nameError = true;
                    }

                    if ($ctrl.importDevLab && ($ctrl.devlabCode == null || $ctrl.devlabCode < 1)) {
                        $ctrl.codeError = true;
                    }

                    if ($ctrl.nameError || $ctrl.codeError) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            name: $ctrl.name,
                            importDevLab: $ctrl.importDevLab === true,
                            devlabProjectId: $ctrl.devlabCode,
                            setAsActive: $ctrl.setAsActive
                        }
                    });
                };

                $ctrl.$onInit = function() {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
