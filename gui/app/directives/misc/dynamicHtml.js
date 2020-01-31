"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp").directive("dynamicHtml", [
        "$compile",
        function($compile) {
            return {
                restrict: "E",
                scope: {
                    html: "="
                },
                replace: true,
                link: function(scope, element) {
                    let htmlWrap = `<div>${scope.html}</div>`.trim();

                    let el = angular.element(htmlWrap);
                    let template = $compile(el)(scope);
                    element.replaceWith(template);
                },
                controller: [
                    "$scope",
                    "$rootScope",
                    function($scope, $rootScope) {
                        $scope.rootScope = $rootScope;
                    }
                ]
            };
        }
    ]);
}());
