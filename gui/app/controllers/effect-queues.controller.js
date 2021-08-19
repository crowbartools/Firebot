"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("effectQueuesController", function(
            $scope,
            effectQueuesService
        ) {
            $scope.activeTab = 0;

            $scope.eqs = effectQueuesService;

            $scope.addOrEditQueue = (queueId) => {
                effectQueuesService.showAddEditEffectQueueModal(queueId);
            };

            $scope.deleteQueue = (queueId) => {
                effectQueuesService.showDeleteEffectQueueModal(queueId);
            };

            $scope.getQueueModeName = (modeId) => {
                const mode = effectQueuesService.queueModes.find(m => m.id === modeId);
                return mode ? mode.display : "Unknown";
            };
        });
}());
