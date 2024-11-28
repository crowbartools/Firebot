"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("extensionPageController", function($scope, $routeParams, uiExtensionsService) {
            $scope.page = uiExtensionsService.getPage($routeParams.extensionId, $routeParams.pageId);
        });
}());
