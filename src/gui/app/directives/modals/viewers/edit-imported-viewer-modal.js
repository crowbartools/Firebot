"use strict";

(function() {
    angular.module("firebotApp")
        .component("editImportedViewerModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Edit Viewer</h4>
                </div>
                <div class="modal-body">
                    <form name="importedViewer">
                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('username')}">
                            <label for="username" class="control-label">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                class="form-control input-lg"
                                ng-model="$ctrl.viewer.name"
                                ui-validate="'$value != null && $value.length > 0'"
                                required
                            />
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('viewHours')}">
                            <label for="viewHours" class="control-label">View Hours</label>
                            <input
                                type="number"
                                id="viewHours"
                                name="viewHours"
                                class="form-control input-lg"
                                ng-model="$ctrl.viewer.viewHours"
                                ui-validate="'$value != null'"
                                required
                            />
                        </div>

                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-danger pull-left" ng-click="$ctrl.delete()">Delete</button>
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope) {
                const $ctrl = this;

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.importedViewer.$submitted || $scope.importedViewer[fieldName].$touched)
                        && $scope.importedViewer[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {
                    $ctrl.viewer = $ctrl.resolve.viewer;
                };

                $ctrl.save = () => {
                    $scope.importedViewer.$setSubmitted();
                    if ($scope.importedViewer.$invalid) {
                        return;
                    }

                    $ctrl.close({
                        $value: {
                            viewer: $ctrl.viewer,
                            action: "edit"
                        }
                    });
                };

                $ctrl.delete = function() {
                    $ctrl.close({
                        $value: {
                            viewer: $ctrl.viewer,
                            action: "delete"
                        }
                    });
                };
            }
        });
}());
