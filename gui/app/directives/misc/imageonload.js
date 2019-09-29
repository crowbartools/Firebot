"use strict";

(function() {
    angular
        .module("firebotApp").directive('imageonload', function() {
            return {
                restrict: 'A',
                link: function(scope, element, attrs) {
                    element.bind('load', function() {
                        scope.$apply(attrs.imageonload)(true);
                    });
                    element.bind('error', function() {
                        scope.$apply(attrs.imageonload)(false);
                    });
                }
            };
        });
}());
