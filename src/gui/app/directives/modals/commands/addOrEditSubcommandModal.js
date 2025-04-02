"use strict";

(function() {
    const { v4: uuid } = require("uuid");
    angular.module("firebotApp")
        .component("addOrEditSubcommandModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">{{$ctrl.isNewArg ? 'Add' : 'Edit'}} Subcommand</h4>
            </div>
            <div class="modal-body">
                <div>
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Arg Type
                    </div>
                    <div ng-class="{'has-error': $ctrl.kindError}">
                        <firebot-searchable-select
                            ng-model="$ctrl.arg.type"
                            ng-change="$ctrl.onTypeChange()"
                            items="$ctrl.argTypes"
                            item-id="type"
                            item-name="type"
                            placeholder="Select arg type"
                        />
                        <div id="helpBlock2" class="help-block" ng-show="$ctrl.kindError">{{$ctrl.kindErrorText}}</div>
                    </div>
                </div>

                <div ng-show="$ctrl.arg.type === 'Custom'" style="margin-top: 15px;">
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Arg Trigger Text <tooltip text="'The text that should trigger this subcommand'">
                    </div>
                    <div style="width: 100%; position: relative;">
                        <div class="form-group" ng-class="{'has-error': $ctrl.nameError}">
                            <input type="text" id="nameField" class="form-control" ng-model="$ctrl.arg.arg" ng-keyup="$event.keyCode == 13 && $ctrl.save() " aria-describedby="helpBlock" placeholder="Enter trigger text" ng-keydown="$event.keyCode != 32 ? $event:$event.preventDefault()">
                            <span id="helpBlock" class="help-block" ng-show="$ctrl.nameError">{{$ctrl.nameErrorText}}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">{{$ctrl.isNewArg ? 'Add' : 'Save'}}</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($timeout) {
                const $ctrl = this;

                $ctrl.kindErrorText = "";
                $ctrl.nameErrorText = 'Please provide trigger text.';

                $ctrl.kindError = false;
                $ctrl.nameError = false;

                $timeout(() => {
                    angular.element("#nameField").trigger("focus");
                }, 50);

                $ctrl.arg = {
                    active: true,
                    id: uuid(),
                    type: "Custom",
                    arg: "",
                    regex: false
                };

                $ctrl.onTypeChange = () => {
                    $ctrl.arg.usage = null;
                    $ctrl.arg.arg = null;
                    $ctrl.kindError = false;
                };

                $ctrl.argTypes = [
                    {
                        type: "Custom",
                        description: "An arg that triggers on specific text"
                    }
                ];

                function validateArgTriggerText() {
                    if ($ctrl.arg.type !== "Custom") {
                        return true;
                    }

                    const triggerText = $ctrl.arg.arg;
                    if (triggerText == null || triggerText.length < 1) {
                        $ctrl.nameErrorText = 'Please provide trigger text.';
                        return false;
                    }
                    if ($ctrl.resolve.otherArgNames.some(a => a === triggerText.toLowerCase())) {
                        $ctrl.nameErrorText = 'This trigger text already exists.';
                        return false;
                    }
                    return true;
                }

                function validateArgType() {
                    const type = $ctrl.arg.type;

                    if (type == null || !type.length) {
                        $ctrl.kindErrorText = "Please select an arg type.";
                        return false;
                    } else if (type === "Fallback" && !$ctrl.resolve.hasAnyArgs) {
                        $ctrl.kindErrorText = "You must add another arg type before adding a fallback.";
                        return false;
                    }

                    $ctrl.kindErrorText = "";
                    return true;
                }

                const numberRegex = "\\d+";
                const usernameRegex = "@\\w+";

                $ctrl.save = function() {

                    $ctrl.nameError = false;
                    $ctrl.kindError = false;


                    if (!validateArgType()) {
                        $ctrl.kindError = true;
                    }

                    if ($ctrl.arg.arg != null) {
                        $ctrl.arg.arg = $ctrl.arg.arg.trim().toLowerCase().replace(/ /g, "");
                    }

                    if (!validateArgTriggerText()) {
                        $ctrl.nameError = true;
                    }

                    if ($ctrl.nameError || $ctrl.kindError) {
                        return;
                    }

                    $ctrl.arg.regex = false;
                    $ctrl.arg.fallback = false;
                    if ($ctrl.arg.type === "Number") {
                        $ctrl.arg.regex = true;
                        $ctrl.arg.usage = "[number]";
                        $ctrl.arg.arg = numberRegex;
                    } else if ($ctrl.arg.type === "Username") {
                        $ctrl.arg.regex = true;
                        $ctrl.arg.usage = "@username";
                        $ctrl.arg.arg = usernameRegex;
                    } else if ($ctrl.arg.type === "Fallback") {
                        $ctrl.arg.fallback = true;
                        $ctrl.arg.regex = true;
                        $ctrl.arg.id = "fallback-subcommand";
                        $ctrl.arg.usage = "[anything]";
                        $ctrl.arg.arg = ".+";
                    }

                    $ctrl.close({
                        $value: $ctrl.arg
                    });
                };

                $ctrl.isNewArg = true;

                $ctrl.$onInit = function() {
                    if (!$ctrl.resolve.hasNumberArg ||
                        ($ctrl.resolve.arg && $ctrl.resolve.arg.arg === numberRegex)) {
                        $ctrl.argTypes.push({
                            type: "Number",
                            description: "An arg that triggers on any number"
                        });
                    }

                    if (!$ctrl.resolve.hasUsernameArg ||
                        ($ctrl.resolve.arg && $ctrl.resolve.arg.arg === usernameRegex)) {
                        $ctrl.argTypes.push({
                            type: "Username",
                            description: "An arg that triggers on text that starts with an @ symbol"
                        });
                    }

                    if (!$ctrl.resolve.hasFallbackArg ||
                        ($ctrl.resolve.arg && $ctrl.resolve.arg.fallback)) {
                        $ctrl.argTypes.push({
                            type: "Fallback",
                            description: "An arg that triggers if none of the other args are matched"
                        });
                    }

                    if ($ctrl.resolve.arg) {
                        $ctrl.arg = JSON.parse(angular.toJson($ctrl.resolve.arg));
                        $ctrl.isNewArg = false;
                    }
                };
            }
        });
}());
