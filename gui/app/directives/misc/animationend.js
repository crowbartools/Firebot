"use strict";

angular.module('firebotApp').
    directive('animationend', function() {
        return {
            restrict: 'A',
            link: function(scope, element, attrs) {
                let events = 'animationend webkitAnimationEnd MSAnimationEnd' +
						'transitionend webkitTransitionEnd';

                let classNames = attrs.animationend;
                let animationNames = classNames.split(",");
                animationNames = animationNames.map(a => a.trim());

                console.log("ani names:", animationNames);

                element.on(events, function() {
                    element.removeClass("animated");
                    animationNames.forEach(a => {
                        element.removeClass(a);
                    });
                });
            }
        };
    });