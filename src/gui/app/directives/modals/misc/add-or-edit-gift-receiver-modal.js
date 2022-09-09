"use strict";

(function() {
    angular.module("firebotApp")
        .component("addOrEditGiftReceiverModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">{{$ctrl.isNew ? 'Add' : 'Edit'}} Gift Receiver</h4>
                </div>
                <div class="modal-body">

                    <form name="giftReceiver">

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('gifteeUsername')}">
                            <label for="gifteeUsername" class="control-label">Giftee Username</label>
                            <input
                                type="text"
                                id="gifteeUsername"
                                name="gifteeUsername"
                                class="form-control input-md"
                                placeholder="Enter giftee username"
                                ng-model="$ctrl.giftReceiver.gifteeUsername"
                                ui-validate="'$value != null && $value.length > 0'"
                                required
                                menu-position="under"
                            />
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('giftSubMonths')}">
                            <label for="giftSubMonths" class="control-label">Gift Sub Months</label>
                            <input
                                type="number"
                                id="giftSubMonths"
                                name="giftSubMonths"
                                class="form-control input-md"
                                placeholder="Enter months"
                                ng-model="$ctrl.giftReceiver.giftSubMonths"
                                ui-validate="'$value != null && $value > 0'"
                                required
                                menu-position="under"
                                style="width: 50%;"
                            />
                        </div>

                    </form>
                </div>
                <div class="modal-footer">
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

                $ctrl.isNew = true;

                $ctrl.giftReceiver = {
                    gifteeUsername: null,
                    giftSubMonths: null
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.giftReceiver.$submitted || $scope.giftReceiver[fieldName].$touched)
                        && $scope.giftReceiver[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {
                    if ($ctrl.resolve.giftReceiver != null) {
                        $ctrl.giftReceiver = JSON.parse(angular.toJson($ctrl.resolve.giftReceiver));
                        $ctrl.isNew = false;
                    }
                };

                $ctrl.save = () => {
                    $scope.giftReceiver.$setSubmitted();
                    if ($scope.giftReceiver.$invalid) {
                        return;
                    }

                    $ctrl.close({
                        $value: $ctrl.giftReceiver
                    });
                };
            }
        });
}());
