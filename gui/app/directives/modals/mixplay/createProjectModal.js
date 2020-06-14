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
                            <input type="text" id="nameField" class="form-control" ng-model="$ctrl.name" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="nameHelpBlock" placeholder="Enter name">
                            <span id="nameHelpBlock" class="help-block" ng-show="$ctrl.nameError">Please provide a name.</span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 15px;">
                    <div class="mixplay-header" style="padding: 0 0 4px 0">
                        Options
                    </div>
                    <div>
                        <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity.0.9;"> Import controls
                            <input type="checkbox" ng-model="$ctrl.shouldImport">
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                    <div ng-show="$ctrl.shouldImport">
                        <div style="margin-top:10px;padding-left:10px;">
                            <label class="control-fb control--radio"> From a DevLab project <tooltip text="'Select if you want to import controls from Mixer\\'s DevLab (what Firebot v4 used).'"></tooltip>
                                <input type="radio" ng-model="$ctrl.importType" value="devlab"/> 
                                <div class="control__indicator"></div>
                            </label>
                            <label class="control-fb control--radio" > With a share code <tooltip text="'Select if someone has shared a Firebot MixPlay project share code with you.'"></tooltip>
                                <input type="radio" ng-model="$ctrl.importType" value="sharecode"/>
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                    </div>
                    
                    <div ng-show="$ctrl.shouldImport && $ctrl.importType === 'devlab'" style="margin-top:10px;padding-left:10px;">
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
                    
                    <div ng-show="$ctrl.shouldImport && $ctrl.importType === 'sharecode'" style="margin-top:10px;padding-left:10px;">
                        <div class="mixplay-header" style="padding: 0 0 4px 0">
                            MixPlay Share Code <tooltip text="'You can generate share codes for Firebot MixPlay projects and send them to others to import here.'"></tooltip>
                        </div>
                        <div style="width: 100%; position: relative;">
                            <div class="form-group" ng-class="{'has-error': $ctrl.shareCodeError}">
                                <input type="text" id="shareCodeField" class="form-control" ng-model="$ctrl.shareCode" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="shareHelpBlock" placeholder="Enter share code">
                                <span id="shareHelpBlock" class="help-block" ng-show="$ctrl.shareCodeError">Please enter a valid MixPlay share code or uncheck "Import" above.</span>
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
            controller: function($timeout, mixplayService, $http) {
                let $ctrl = this;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);

                $ctrl.name = "";

                $ctrl.nameError = false;
                $ctrl.codeError = false;
                $ctrl.shareCodeError = false;

                $ctrl.setAsActive = true;

                $ctrl.importType = 'devlab';

                $ctrl.hasActiveProject = mixplayService.getActiveMixplayProjectId() != null;

                function validateName() {
                    let name = $ctrl.name;
                    return name != null && name.length > 0;
                }

                function getSharedMixplayProject(code) {
                    return $http.get(`https://bytebin.lucko.me/${code}`)
                        .then(resp => {
                            if (resp.status === 200) {
                                return resp.data ? JSON.parse(unescape(JSON.stringify(resp.data.mixplayProject))) : null;
                            }
                            return null;
                        }, () => {
                            return null;
                        });
                }

                let performingSave = false;
                $ctrl.save = async function() {
                    if (performingSave) return;
                    performingSave = true;

                    $ctrl.nameError = false;
                    $ctrl.codeError = false;
                    $ctrl.shareCodeError = false;

                    if (!validateName()) {
                        $ctrl.nameError = true;
                    }

                    if ($ctrl.shouldImport && $ctrl.importType === 'devlab' && ($ctrl.devlabCode == null || $ctrl.devlabCode < 1)) {
                        $ctrl.codeError = true;
                    }

                    if ($ctrl.shouldImport && $ctrl.importType === 'sharecode') {
                        if ($ctrl.shareCode != null && $ctrl.shareCode !== "") {
                            let project = await getSharedMixplayProject($ctrl.shareCode);
                            if (project == null) {
                                $ctrl.shareCodeError = true;
                            }
                        } else {
                            $ctrl.shareCodeError = true;
                        }
                    }

                    if ($ctrl.nameError || $ctrl.codeError || $ctrl.shareCodeError) {
                        performingSave = false;
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            name: $ctrl.name,
                            shouldImport: $ctrl.shouldImport === true,
                            importType: $ctrl.importType,
                            devlabProjectId: $ctrl.devlabCode,
                            shareCode: $ctrl.shareCode,
                            setAsActive: $ctrl.setAsActive
                        }
                    });
                    performingSave = false;
                };

                $ctrl.$onInit = function() {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
