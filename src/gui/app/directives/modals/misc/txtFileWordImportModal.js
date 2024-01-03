"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp")
        .component("txtFileWordImportModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Import Items From TXT</h4>
            </div>
            <div class="modal-body">

                <div>
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Txt File
                    </div>
                    <file-chooser model="$ctrl.filePath" options="{ filters: [ {name:'Text',extensions:['txt']} ]}"></file-chooser>
                </div>

                <div style="margin-top: 15px;">
                    <div class="modal-subheader" style="padding: 0 0 4px 0">
                        Separator <tooltip text="'Tell Firebot how the items in the txt file are separated'"></tooltip>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-default dropdown-toggle" type="button" id="options-sounds" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                            <span class="dropdown-text" style="text-transform: capitalize;">{{$ctrl.delimiter}}</span>
                            <span class="caret"></span>
                        </button>
                        <ul class="dropdown-menu" aria-labelledby="options-sounds">
                            <li><a href ng-click="$ctrl.delimiter = 'newline'">Newline</a></li>
                            <li><a href ng-click="$ctrl.delimiter = 'comma'">Comma</a></li>
                            <li><a href ng-click="$ctrl.delimiter = 'space'">Space</a></li>
                        </ul>
                    </div>
                </div>

            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.import()">Import</button>
            </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function() {
                const $ctrl = this;

                $ctrl.filePath = "";

                $ctrl.delimiter = "newline";

                $ctrl.import = () => {

                    if ($ctrl.filePath === "" || $ctrl.filePath == null) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            filePath: $ctrl.filePath,
                            delimiter: $ctrl.delimiter
                        }
                    });
                };

                $ctrl.$onInit = function() {
                    // When the component is initialized
                    // This is where you can start to access bindings, such as variables stored in 'resolve'
                    // IE $ctrl.resolve.shouldDelete or whatever
                };
            }
        });
}());
