"use strict";

angular.module('firebotApp').
    directive('animationend', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                let events = 'animationend webkitAnimationEnd MSAnimationEnd' +
						'transitionend webkitTransitionEnd';

                let className = attrs.animationend;
                console.log("class name: " + className);
                element.on(events, function() {
                    element.removeClass("animated");
                    element.removeClass(className);
                });
            }
        };
    });