"use strict";

angular.module('firebotApp').
    directive('animationend', function() {
        return {
            restrict: 'A',
            link: function(element, attrs) {
                const events = 'animationend webkitAnimationEnd MSAnimationEnd' +
						'transitionend webkitTransitionEnd';

                const classNames = attrs.animationend;
                let animationNames = classNames.split(",");
                animationNames = animationNames.map(a => a.trim());

                element.on(events, function() {
                    element.removeClass("animated");
                    animationNames.forEach(a => {
                        element.removeClass(a);
                    });
                });
            }
        };
    });