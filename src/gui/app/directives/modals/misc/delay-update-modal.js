"use strict";

(function() {
    angular.module("firebotApp")
        .component("delayUpdateModal", {
            template: `
                <div class="modal-header">
                    <h4 class="modal-title">New Feature Update</h4>
                </div>
                <div class="modal-body">

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.close()">Delay Update</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    // When the component is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
