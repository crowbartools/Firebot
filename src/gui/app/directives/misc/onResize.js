"use strict";

(function() {
    angular
        .module("firebotApp").directive('onResize', function() {
            return {
                restrict: 'A',
                link: function($scope, $element, $attrs) {
                    const el = $element[0];
                    const originalHeight = el.getBoundingClientRect().height;

                    let isClicking = false;

                    $element.on("mousedown", function() {
                        console.log("mousedown");
                        isClicking = true;
                    });

                    $element.on("mouseup", function() {
                        console.log("mouseup");
                        isClicking = false;
                    });

                    $element.on("mouseleave", function() {
                        console.log("mouseleave");
                        isClicking = false;
                    });

                    const observer = new ResizeObserver(function(entries) {
                        const currentHeight = entries[0]?.target?.getBoundingClientRect()?.height;
                        if (isClicking && currentHeight !== originalHeight && $attrs["onResize"]) {
                            $scope.$apply($attrs["onResize"])(entries[0]);
                        }
                    });

                    observer.observe(el);

                    $scope.$on('$destroy', function() {
                        observer.unobserve(el);
                    });
                }
            };
        });
}());
