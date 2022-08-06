'use strict';

// generic modal for asking the user for text input

(function() {
    angular
        .module('firebotApp')
        .component("selectModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">{{$ctrl.label}}</h4>
            </div>
            <div class="modal-body">
                <div ng-class="{'has-error': $ctrl.hasValidationError}">
                    <ui-select ng-model="$ctrl.model" theme="bootstrap" class="control-type-list">
                        <ui-select-match placeholder="{{$ctrl.selectPlaceholder}}">{{$select.selected.name}}</ui-select-match>
                        <ui-select-choices repeat="option.id as option in $ctrl.options | filter: { name: $select.search }" style="position:relative;">
                            <div class="flex-row-center">
                                <div style="padding-left: 10px;">
                                    <div ng-bind-html="option.name | highlight: $select.search"></div>
                                    <small class="muted" ng-show="option.description">{{option.description}}</small>
                                </div>                 
                            </div>                  
                        </ui-select-choices>
                    </ui-select>
                    <div id="helpBlock2" class="help-block" ng-show="$ctrl.hasValidationError">{{$ctrl.validationText}}</div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">{{$ctrl.saveText}}</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.model = null;
                $ctrl.options = [];

                $ctrl.label = "Enter Text";
                $ctrl.selectPlaceholder = "Select one";
                $ctrl.saveText = "Save";
                $ctrl.validationText = "Please select an item from the list.";
                $ctrl.hasValidationError = false;

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.model) {
                        $ctrl.model = $ctrl.resolve.model;
                    }

                    if ($ctrl.resolve.options) {
                        $ctrl.options = $ctrl.resolve.options;
                        console.log("in modal options");
                        console.log($ctrl.options);
                    }

                    if ($ctrl.resolve.label) {
                        $ctrl.label = $ctrl.resolve.label;
                    }

                    if ($ctrl.resolve.selectPlaceholder) {
                        $ctrl.selectPlaceholder = $ctrl.resolve.selectPlaceholder;
                    }

                    if ($ctrl.resolve.saveText) {
                        $ctrl.saveText = $ctrl.resolve.saveText;
                    }

                    if ($ctrl.resolve.validationText) {
                        $ctrl.validationText = $ctrl.resolve.validationText;
                    }
                };

                $ctrl.save = function() {

                    if ($ctrl.model === null) {
                        $ctrl.hasValidationError = true;
                        return;
                    }

                    $ctrl.close({ $value: {
                        model: $ctrl.model
                    }});
                };
            }
        });
}());
