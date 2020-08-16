"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("effectsController", function(
            $scope,
            effectQueuesService,
            presetEffectListsService
        ) {
            $scope.activeTab = 0;

            $scope.eqs = effectQueuesService;

            $scope.addOrEditQueue = (queueId) => {
                effectQueuesService.showAddEditEffectQueueModal(queueId);
            };

            $scope.deleteQueue = (queueId) => {
                effectQueuesService.showDeleteEffectQueueModal(queueId);
            };

            $scope.pels = presetEffectListsService;

            $scope.addOrEditPresetEffectList = (presetListId) => {
                presetEffectListsService.showAddEditPresetEffectListModal(presetListId);
            };

            $scope.deletePresetEffectList = (presetListId) => {
                presetEffectListsService.showDeletePresetEffectListModal(presetListId);
            };
        });
}());
