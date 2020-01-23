"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("createControlModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Create Control</h4>
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
                        Type
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

                $ctrl.nameError = false;
                $ctrl.kindError = false;

                $ctrl.controlKinds = [
                    {
                        kind: "button",
                        display: "Button",
                        description: "A simple button.",
                        iconClass: "fa-bullseye-pointer"
                    },
                    {
                        kind: "label",
                        display: "Label",
                        description: "Just some text that can't be interacted with.",
                        iconClass: "fa-tag"
                    },
                    {
                        kind: "textbox",
                        display: "Textbox",
                        description: "A way for viewers to input text.",
                        iconClass: "fa-font"
                    },
                    {
                        kind: "joystick",
                        display: "Joystick",
                        description: "Allows viewers to control your mouse.",
                        iconClass: "fa-gamepad"
                    }
                    /*{
                        kind: "screen",
                        display: "Mouse",
                        description: "Another mouse control. Tracks viewers cursor position over the stream area.",
                        iconClass: "fa-mouse-pointer"
                    }*/
                ];

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
                            kind: $ctrl.kind
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
