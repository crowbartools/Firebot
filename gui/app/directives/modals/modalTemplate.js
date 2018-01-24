'use strict';

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular
        .module('firebotApp')
        .component("templateModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Modal Title</h4>
            </div>
            <div class="modal-body">
                
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" ng-click="$ctrl.close()">Close</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function() {
                let $ctrl = this;

                $ctrl.$onInit = function () {
                    // When the compontent is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
