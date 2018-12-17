"use strict";

angular.module('firebotApp')
    .directive('gridListener', ['$parse', function() {
        return {
            restrict: 'A',
            scope: {
                onUpdate: "&"
            },
            compile: function() {
                return function link(scope, element, attrs) {

                    element.on("resize", () => {
                        scope.onUpdate();
                    });

                    element.on("move", () => {
                        scope.onUpdate();
                    });
                };
            }
        };
    }]);