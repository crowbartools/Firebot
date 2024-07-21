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
                    <div class="action text-4xl">Create Rank Ladder</div>
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
                            <span ng-if="ladderSettings.name.$error.required" class="help-block">Name is required.</span>
                            <span ng-if="ladderSettings.name.$error.minlength" class="help-block">Name must be 3 or more characters.</span>
                            <span ng-if="ladderSettings.name.$error.taken" class="help-block">This name is already in use.</span>
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
                                    ng-required="$ctrl.rankLadder.mode == 'auto' && $ctrl.rankLadder.settings.trackBy == 'currency'"
                                ></searchable-currency-select>
                            </div>
                        </div>
                    </div>

                    <div class="form-group flex justify-between">
                        <div>
                            <label class="control-label" style="margin:0;">Announce Promotions in Chat</label>
                            <p class="help-block">If enabled, send a chat message when a viewer moves to a higher rank only if that viewer is active in chat.</p>
                        </div>
                        <div>
                            <toggle-button toggle-model="$ctrl.rankLadder.settings.announcePromotionsInChat" auto-update-value="true" font-size="32"></toggle-button>
                        </div>
                    </div>

                    <div
                        class="form-group"
                        ng-if="$ctrl.rankLadder.mode === 'manual' || $ctrl.rankLadder.settings.trackBy != null"
                        ng-class="{'has-error': $ctrl.formFieldHasError('ranks')}"
                    >
                        <label class="control-label">Ranks</label>
                        <div ng-if="$ctrl.formFieldHasError('ranks')">
                            <span ng-if="ladderSettings.ranks.$error.valid" class="help-block">All ranks must have a value set.</span>
                        </div>
                        <div>
                            <firebot-list
                                ng-model="$ctrl.rankLadder.ranks"
                                name="ranks"
                                id="ranks"
                                settings="$ctrl.rankListSettings"
                                ui-validate="{valid:'$ctrl.ranksAreValid($value)'}"
                                on-add-new-clicked="$ctrl.addNewRank()"
                                on-edit-clicked="$ctrl.editRank(index)"
                                on-delete-clicked="$ctrl.deleteRank(index)"
                            ></firebot-list>
                        </div>
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
            dismiss: "&",
            modalInstance: "<"
        },
        controller: function($scope, ngToast, viewerRanksService, utilityService, currencyService) {
            const $ctrl = this;

            $ctrl.isNewLadder = true;

            $ctrl.rankLadder = {
                name: "",
                mode: undefined,
                settings: {
                    trackBy: undefined,
                    currencyId: undefined,
                    announcePromotionsInChat: undefined
                },
                ranks: []
            };

            $ctrl.rankListSettings = {};

            const getRankListSettings = () => {
                let hintTemplate = undefined;
                if ($ctrl.rankLadder.mode === 'auto') {
                    if ($ctrl.rankLadder.settings.trackBy === 'view_time') {
                        hintTemplate = '({value} hours)';
                    } else if ($ctrl.rankLadder.settings.trackBy === 'currency') {
                        const currency = currencyService.getCurrency($ctrl.rankLadder.settings.currencyId);
                        hintTemplate = `({value} ${currency?.name ?? 'currency'})`;
                    } else {
                        hintTemplate = '({value})';
                    }
                }
                return {
                    sortable: $ctrl.rankLadder.mode === 'manual',
                    nameProperty: 'name',
                    connectItems: true,
                    showIndex: true,
                    addLabel: 'Add Rank',
                    hintTemplate,
                    noneAddedText: 'No ranks added yet.'
                };
            };

            $ctrl.formFieldHasError = (fieldName) => {
                return ($scope.ladderSettings.$submitted || $scope.ladderSettings[fieldName]?.$touched)
                    && $scope.ladderSettings[fieldName]?.$invalid;
            };

            $ctrl.$onInit = () => {
                if ($ctrl.resolve.rankLadder != null) {
                    $ctrl.rankLadder = JSON.parse(angular.toJson($ctrl.resolve.rankLadder));
                    $ctrl.isNewLadder = false;
                }
                $ctrl.rankListSettings = getRankListSettings();
            };

            $ctrl.onSettingUpdated = () => {
                $ctrl.rankListSettings = getRankListSettings();
            };

            $ctrl.ranksAreValid = (ranks) => {
                if ($ctrl.rankLadder.mode === 'auto' &&
                    ranks?.some(r => r.value == null)
                ) {
                    return false;
                }
                return true;
            };

            $scope.$watch("$ctrl.rankLadder.mode", function() {
                $ctrl.rankListSettings = getRankListSettings();
            });

            $scope.$watch("$ctrl.rankLadder.settings.trackBy", function() {
                $ctrl.rankListSettings = getRankListSettings();
            });

            $scope.$watch("$ctrl.rankLadder.settings.currencyId", function() {
                $ctrl.rankListSettings = getRankListSettings();
            });

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

            const sortRanks = () => {
                if ($ctrl.rankLadder.mode !== 'auto') {
                    return;
                }
                $ctrl.rankLadder.ranks = [
                    ...$ctrl.rankLadder.ranks.sort((a, b) => {
                        if (b.value == null) {
                            return -1;
                        }
                        if (a.value == null) {
                            return 1;
                        }
                        return b.value - a.value;
                    })
                ];
            };

            const openAddOrEditRankModal = (rank) => {
                utilityService.showModal({
                    component: "addOrEditRankModal",
                    size: "sm",
                    resolveObj: {
                        rank: () => rank,
                        ladderMode: () => $ctrl.rankLadder.mode,
                        ladderTrackBy: () => $ctrl.rankLadder.settings.trackBy,
                        currentRanks: () => $ctrl.rankLadder.ranks
                    },
                    closeCallback: (resp) => {
                        if (resp.action === "add") {
                            $ctrl.rankLadder.ranks.push(resp.rank);
                            sortRanks();
                        } else if (resp.action === "edit") {
                            const index = $ctrl.rankLadder.ranks.findIndex(r => r.id === resp.rank.id);
                            $ctrl.rankLadder.ranks[index] = resp.rank;
                            sortRanks();
                        }
                    }
                });
            };


            $ctrl.addNewRank = () => {
                openAddOrEditRankModal();
            };

            $ctrl.editRank = (index) => {
                openAddOrEditRankModal($ctrl.rankLadder.ranks[index]);
            };

            $ctrl.deleteRank = (index) => {
                const rank = $ctrl.rankLadder.ranks[index];
                if (rank.id == null) {
                    return;
                }
                utilityService
                    .showConfirmationModal({
                        title: "Delete Rank",
                        question: `Are you sure you want to delete the rank '${rank.name}'?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            $ctrl.rankLadder.ranks.splice(index, 1);
                        }
                    });
            };

            $ctrl.save = () => {
                if ($scope.ladderSettings.$invalid) {
                    console.log("Invalid form");
                    console.log($scope.ladderSettings);
                    return;
                }
                console.log("valid!");

                viewerRanksService
                    .saveRankLadder($ctrl.rankLadder)
                    .then((successful) => {
                        if (successful) {
                            $ctrl.dismiss();
                        } else {
                            ngToast.create("Failed to save rank ladder. Please try again or view logs for details.");
                        }
                    });
            };
        }
    });
}());
