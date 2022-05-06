'use strict';

// generic modal for asking the user for text input

(function() {
    angular
        .module('firebotApp')
        .component("errorDetailModal", {
            template: `
            <div class="modal-header" style="text-align: center;">
                <h4 class="modal-title">{{$ctrl.title}}</h4>
            </div>
            <div class="modal-body"style="text-align: center;">
                <div ng-repeat="detail in $ctrl.details" style="margin-bottom: 12px;">
                    <div class="muted" style="font-size: 13px;text-transform: uppercase;font-weight: 200;">{{detail.title}}</div>
                    <div style="font-size: 16px;">{{detail.message}}</div>
                </div>
            </div>
            <div class="modal-footer" style="text-align: center;">
                <button type="button" class="btn btn-primary" ng-click="$ctrl.dismiss()">Ok</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.title = "Error";
                $ctrl.details = [];


                $ctrl.$onInit = function() {
                    if ($ctrl.resolve.title) {
                        $ctrl.title = $ctrl.resolve.title;
                    }
                    if ($ctrl.resolve.details) {
                        $ctrl.details = $ctrl.resolve.details;
                    }
                };
            }
        });
}());
