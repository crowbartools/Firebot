"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("pluginManagerModal", {
            template: `
                <div class="modal-header sticky-header" style="border-bottom: 2px solid rgb(128 128 128 / 0.33);">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Plugin Manager</h4>
                </div>
                <div class="modal-body mx-4 my-8">
                    <plugin-settings />
                </div>
                <div class="modal-footer sticky-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Close</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() { }
        });
}());