"use strict";
(function() {

    angular.module("firebotApp").component("addOrEditRankLadderModal", {
        template: `
            <div class="modal-header">
                <button
                    type="button"
                    class="close"
                    aria-label="Close"
                    ng-click="$ctrl.dismiss()"
                >
                    <i class="fal fa-times" aria-hidden="true"></i>
                </button>
                <h4 class="modal-title">
                    <div class="action text-4xl">Add Rank Ladder</div>
                </h4>
            </div>
            <div class="modal-body">
                <form name="ladderSettings">
                    <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('name')}">
                        <label for="name" class="control-label">Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            ng-minlength="3"
                            ui-validate="{taken:'!$ctrl.nameIsTaken($value)'}"
                            required
                            class="form-control input-lg"
                            placeholder="Give the ladder a name"
                            ng-model="$ctrl.rankLadder.name"
                        />
                        <div ng-if="$ctrl.formFieldHasError('name')">
                            <span ng-if="macroSettings.name.$error.required" class="help-block">Name is required.</span>
                            <span ng-if="macroSettings.name.$error.minlength" class="help-block">Name must be 3 or more characters.</span>
                            <span ng-if="macroSettings.name.$error.taken" class="help-block">This name is already in use.</span>
                        </div>
                    </div>

                    <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('ladderMode')}">
                        <label for="ladderMode" class="control-label">Mode</label>
                        <firebot-radio-cards
                            options="$ctrl.ladderModes"
                            ng-model="$ctrl.rankLadder.mode"
                            id="ladderMode"
                            name="ladderMode"
                            required
                        ></firebot-radio-cards>
                    </div>

                    <div ng-show="$ctrl.rankLadder.mode == 'auto'">
                        <div class="form-group" ng-class="{'has-error': $ctrl.formFieldHasError('trackBy')}">
                            <label for="trackBy" class="control-label">Track By</label>
                            <firebot-radio-cards
                                options="$ctrl.trackByOptions"
                                ng-model="$ctrl.rankLadder.settings.trackBy"
                                id="trackBy"
                                name="trackBy"
                                ng-required="$ctrl.rankLadder.mode == 'auto'"
                            ></firebot-radio-cards>
                            <div ng-show="$ctrl.rankLadder.settings.trackBy == 'currency'" class="form-group mb-0 mt-2" ng-class="{'has-error': $ctrl.formFieldHasError('currency')}">
                                <label for="currency" class="control-label" style="display: none;">Currency</label>
                                <searchable-currency-select
                                    ng-model="$ctrl.rankLadder.settings.currencyId"
                                    id="currency"
                                    name="currency"
                                    required="$ctrl.rankLadder.mode == 'auto' && $ctrl.rankLadder.settings.trackBy == 'currency'"
                                ></searchable-currency-select>
                            </div>
                        </div>
                    </div>

                    <div class="form-group flex justify-between">
                        <div>
                            <label class="control-label" style="margin:0;">Announce Promotions in Chat</label>
                            <p class="help-block">If enabled, send a chat message when users move to a higher rank.</p>
                        </div>
                        <div>
                            <toggle-button toggle-model="$ctrl.rankLadder.settings.announcePromotionsInChat" auto-update-value="true" font-size="32"></toggle-button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="control-label">Ranks</label>

                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, viewerRanksService, ngToast) {
            const $ctrl = this;

            $ctrl.isNewLadder = true;

            $ctrl.rankLadder = {
                name: "",
                mode: undefined,
                settings: {
                    trackBy: undefined,
                    currencyId: undefined,
                    announcePromotionsInChat: undefined
                }
            };

            $ctrl.formFieldHasError = (fieldName) => {
                return ($scope.ladderSettings.$submitted || $scope.ladderSettings[fieldName]?.$touched)
                    && $scope.ladderSettings[fieldName]?.$invalid;
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.rankLadder != null) {
                    $ctrl.rankLadder = angular.copy($ctrl.resolve.rankLadder);
                    $ctrl.isNewLadder = false;
                }
            };

            $ctrl.ladderModes = viewerRanksService.ladderModes.map(mode => ({
                value: mode.id,
                label: mode.name,
                description: mode.description,
                iconClass: mode.iconClass
            }));

            $ctrl.trackByOptions = [
                { value: "view_time", label: "View Time", iconClass: "fa-clock" },
                { value: "currency", label: "Currency", iconClass: "fa-money-bill" }
            ];

            $ctrl.nameIsTaken = (name) => {
                if (name == null) {
                    return false;
                }
                const matchingLadder = viewerRanksService.getRankLadderByName(name);

                if (matchingLadder != null && ($ctrl.isNewLadder || matchingLadder.id !== $ctrl.rankLadder.id)) {
                    return true;
                }
                return false;
            };

            $ctrl.save = () => {
                console.log($scope.ladderSettings);
                $scope.ladderSettings.$setSubmitted();
                if ($scope.ladderSettings.$invalid) {
                    return;
                }

                // variableMacroService.saveMacro($ctrl.macro).then((successful) => {
                //     if (successful) {
                //         $ctrl.dismiss();
                //     } else {
                //         ngToast.create("Failed to save macro. Please try again or view logs for details.");
                //     }
                // });
            };
        }
    });
}());
