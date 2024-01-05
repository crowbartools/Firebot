"use strict";

(function() {
    angular.module("firebotApp")
        .component("twitchDcfModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" aria-label="Close" ng-click="$ctrl.close()"><span aria-hidden="true">&times;</span></button>
                    <h3 class="modal-title" style="text-transform: capitalize">Connect {{$ctrl.accountType}} Account</h3>
                </div>
                <div class="modal-body">
                    <dcf-code-display type="{{$ctrl.accountType}}" on-complete-or-close="$ctrl.dismiss()" />
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = function() {
                    $ctrl.accountType = $ctrl.resolve.accountType;
                };
            }
        });
}());
