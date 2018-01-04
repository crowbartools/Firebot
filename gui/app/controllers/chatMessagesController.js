'use strict';
(function() {

    //This handles the Settings tab

    angular
        .module('firebotApp')
        .controller('chatMessagesController', function($scope, $timeout, $q, $sce, chatMessagesService) {

            $scope.chatMessagesService = chatMessagesService;
            $scope.$sce = $sce;

        });
}());
