"use strict";
(function() {
    angular
        .module("firebotApp")
        .controller("effectsController", function(
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

        });
}());
