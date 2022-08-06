"use strict";

(function() {
    angular.module("firebotApp")
        .component("giveCurrencyModal", {
            template: `
                <div class="modal-header">
                    <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                    <h4 class="modal-title">Give Currency</h4>
                </div>
                <div class="modal-body">

                    <form name="currencyInfo">

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('currency')}">
                            <label for="currency" class="control-label">Currency</label>
                            <select
                                id="currency"
                                name="currency"
                                required
                                class="fb-select form-control input-lg"
                                ng-model="$ctrl.currencyInfo.currencyId"
                                ng-options="currency.id as currency.name for currency in $ctrl.currencies">
                                <option value="" disabled selected>Select currency...</option>
                            </select>
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('username')}">
                            <label for="targetType" class="control-label">Target</label>
                            <div class="permission-type">
                                <label class="control-fb control--radio">All Online Chat Users
                                    <input type="radio" ng-model="$ctrl.currencyInfo.targetType" value="allOnline"/>
                                    <div class="control__indicator"></div>
                                </label>
                                <label class="control-fb control--radio">All Online Chat Users In Role
                                    <input type="radio" ng-model="$ctrl.currencyInfo.targetType" value="allOnlineInRole"/>
                                    <div class="control__indicator"></div>
                                </label>
                                <div uib-dropdown ng-show="$ctrl.currencyInfo.targetType === 'allOnlineInRole'" class="mb-8">
                                    <button id="single-button" type="button" class="btn btn-default" uib-dropdown-toggle>
                                        {{$ctrl.selectedRole}} <span class="caret"></span>
                                    </button>
                                    <ul class="dropdown-menu" uib-dropdown-menu role="menu" aria-labelledby="single-button">
                                        <li role="none" ng-repeat="role in $ctrl.roles" ng-click="$ctrl.selectRole(role)">
                                            <a href role="menuitem">{{role.name}}</a>
                                        </li>
                                    </ul>
                                </div>
                                <label class="control-fb control--radio">Single User
                                    <input type="radio" ng-model="$ctrl.currencyInfo.targetType" value="individual"/>
                                    <div class="control__indicator"></div>
                                </label>
                                <input
                                    ng-show="$ctrl.currencyInfo.targetType === 'individual'"
                                    type="text"
                                    id="username"
                                    name="username"
                                    ui-validate-watch="'$ctrl.currencyInfo.targetType'"
                                    ui-validate="'$ctrl.currencyInfo.targetType !== individual || ($value != null && $value.length > 0)'"
                                    class="form-control input-lg"
                                    placeholder="Enter username"
                                    uib-typeahead="username for username in $ctrl.usernames | filter:$viewValue | limitTo:8"
                                    typeahead-min-length="0"
                                    ng-model="$ctrl.currencyInfo.username"
                                />
                            </div>
                        </div>

                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('amount')}">
                            <label for="amount" class="control-label">Amount</label>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                class="form-control input-lg"
                                placeholder="Enter amount"
                                ng-model="$ctrl.currencyInfo.amount"
                                ui-validate="'$value > 0 || $value < 0'"
                                required
                            />
                            <p class="help-block">Tip: You can enter a negative amount to remove currency.</p>
                        </div>

                        <div class="form-group flex-row jspacebetween mb-0">
                            <div>
                                <label class="control-label m-0">Send Chat Message</label>
                                <p class="help-block">Send a message to chat detailing the currency given</p>
                            </div>
                            <div>
                                <toggle-button toggle-model="$ctrl.currencyInfo.sendChatMessage" auto-update-value="true" font-size="32"></toggle-button>
                            </div>
                        </div>

                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-default" ng-click="$ctrl.dismiss()">Cancel</button>
                    <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Give</button>
                </div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($scope, ngToast, backendCommunicator, currencyService, chatMessagesService, viewerRolesService) {
                const $ctrl = this;

                $scope.individual = "individual";

                $ctrl.currencies = currencyService.getCurrencies();

                $ctrl.usernames = chatMessagesService.chatUsers.map(u => u.username);

                $ctrl.roles = viewerRolesService.getAllRoles();
                $ctrl.selectedRole = "Select...";

                $ctrl.selectRole = (role) => {
                    $ctrl.currencyInfo.role = role.id;
                    $ctrl.selectedRole = role.name;
                };

                $ctrl.currencyInfo = {
                    currencyId: $ctrl.currencies.length > 0 ? $ctrl.currencies[0].id : null,
                    targetType: "allOnline",
                    username: "",
                    amount: 1,
                    sendChatMessage: true,
                    role: ""
                };

                $ctrl.formFieldHasError = (fieldName) => {
                    return ($scope.currencyInfo.$submitted || $scope.currencyInfo[fieldName].$touched)
                        && $scope.currencyInfo[fieldName].$invalid;
                };

                $ctrl.$onInit = () => {};

                $ctrl.save = () => {
                    $scope.currencyInfo.$setSubmitted();
                    if ($scope.currencyInfo.$invalid) {
                        return;
                    }

                    backendCommunicator.fireEventAsync("give-currency", $ctrl.currencyInfo);

                    ngToast.create({
                        className: 'success',
                        content: "Successfully gave currency!"
                    });

                    $ctrl.dismiss();
                };
            }
        });
}());
