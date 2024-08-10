'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("editViewerRankModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" aria-label="Close" ng-click="$ctrl.dismiss()"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title">Edit Rank</h4>
            </div>
            <div class="modal-body">
                <div class="form-group mb-0">
                    <label for="rank" class="control-label">Rank</label>
                    <firebot-searchable-select
                        name="rank"
                        ng-model="$ctrl.rankId"
                        placeholder="Select rank"
                        items="$ctrl.rankOptions"
                    >
                    </firebot-searchable-select>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-link" ng-click="$ctrl.dismiss()">Cancel</button>
                <button type="button" class="btn btn-primary" ng-click="$ctrl.save()">Save</button>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function(viewerRanksService) {
                const $ctrl = this;

                $ctrl.rankLadderId = undefined;
                $ctrl.rankId = undefined;

                $ctrl.rankOptions = [];

                $ctrl.$onInit = function () {
                    if ($ctrl.resolve.rankLadderId) {
                        $ctrl.rankLadderId = $ctrl.resolve.rankLadderId;
                    }

                    if ($ctrl.resolve.currentRankId) {
                        $ctrl.rankId = $ctrl.resolve.currentRankId;
                    }

                    const ranks = viewerRanksService.getRankLadder($ctrl.rankLadderId)?.ranks?.map(r => ({
                        id: r.id,
                        name: r.name
                    })) ?? [];
                    $ctrl.rankOptions = [
                        { id: undefined, name: "No rank" },
                        ...ranks
                    ];
                };

                $ctrl.save = function() {
                    $ctrl.close({ $value: $ctrl.rankId });
                };
            }
        });
}());
