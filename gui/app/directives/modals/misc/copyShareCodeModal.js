"use strict";

(function() {
    angular.module("firebotApp")
        .component("copyShareCodeModal", {
            template: `
                <div class="modal-header" style="text-align:center;">
                    <h4 class="modal-title">{{$ctrl.resolve.title}}</h4>
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                </div>
                <div class="modal-body">
                    <div style="text-align:center;">
                        <p class="muted">{{$ctrl.resolve.message}} Note: Code only valid for <strong>1 hour</strong>.</p>
                        <div class="input-group">
                            <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.shareCode" disabled>
                            <span class="input-group-btn">
                                <button class="btn btn-primary" type="button" ng-click="$ctrl.copy()">Copy</button>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($rootScope, ngToast) {
                const $ctrl = this;

                $ctrl.shareCode = ``;

                $ctrl.$onInit = () => {
                    $ctrl.shareCode = $ctrl.resolve.shareCode;
                };

                $ctrl.copy = function() {
                    $rootScope.copyTextToClipboard($ctrl.shareCode || '');

                    ngToast.create({
                        className: 'success',
                        content: 'Share code copied!'
                    });
                };
            }
        });
}());
