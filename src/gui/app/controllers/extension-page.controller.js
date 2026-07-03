"use strict";

(function() {
    angular
        .module("firebotApp")
        .controller("extensionPageController", function($scope, $sce, $routeParams, uiExtensionsService) {
            $scope.page = uiExtensionsService.getPage($routeParams.extensionId, $routeParams.pageId);

            if ($scope.page?.type === "iframe") {
                $scope.trustedSrc = $sce.trustAsResourceUrl($scope.page.url);
            }
        });
}());
