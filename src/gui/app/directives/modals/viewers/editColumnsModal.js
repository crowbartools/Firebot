"use strict";

(function() {
    angular.module("firebotApp").component("editColumnsModal", {
        template: `
            <div class="modal-header" style="text-align: center">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">Edit Viewer Columns</h4>
            </div>
            <div class="modal-body" style="text-align: center; padding: 0 35px">
              <p>Select which columns you'd like to show in the main table</p>
              <div class="viewer-db-switches">
                <div ng-repeat="column in $ctrl.columns">
                  <div style="display: flex;align-items: center;justify-content: space-between;margin-bottom:5px;">
                      <span style="font-weight: 900;">{{column.headerName}}</span>
                      <span>
                          <input class="tgl tgl-light sr-only" id="{{column.field}}" type="checkbox"
                            ng-checked="$ctrl.columnIsChecked(column)"
                            ng-click="$ctrl.flipColumnPreference(column)"/>
                        <label class="tgl-btn" for="{{column.field}}"></label>
                      </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="text-align: center">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(viewersService) {
            const $ctrl = this;

            //turns the object into an array so we can ng-repeat it. we don't need the keys since they are also in the object
            $ctrl.columns = Object.values(viewersService.fieldDefs);

            $ctrl.flipColumnPreference = function(column) {
                $ctrl.userColumnPrefs[column.field] = !$ctrl.userColumnPrefs[
                    column.field
                ];
            };

            $ctrl.columnIsChecked = function(column) {
                return $ctrl.userColumnPrefs[column.field] === true;
            };

            $ctrl.userColumnPrefs = {};

            $ctrl.$onInit = function() {
                $ctrl.userColumnPrefs = $ctrl.resolve.columnPrefs;

                $ctrl.version = firebotAppDetails.version;
            };

            $ctrl.save = function() {
                $ctrl.close({
                    $value: {
                        preferences: $ctrl.userColumnPrefs
                    }
                });
            };
        }
    });
}());
