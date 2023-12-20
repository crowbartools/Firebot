"use strict";

(function() {
    angular.module("firebotApp")
        .component("scrollSentinel", {
            bindings: {
                elementClass: "@"
            },
            template: `
              <div id="{{$ctrl.id}}"></div>
            `,
            controller: function($timeout) {
                const $ctrl = this;
                $ctrl.id = `a${Math.random().toString(36).substr(2, 9)}`;
                $ctrl.$onInit = function() {
                    $timeout(() => {
                        const observer = new IntersectionObserver(entries => {
                            const entry = entries[0];
                            angular.element(`.${$ctrl.elementClass}`).toggleClass('is-stuck', !entry.isIntersecting);
                        });

                        const sentinel = document.querySelector(`#${$ctrl.id}`);
                        if (sentinel != null) {
                            observer.observe(sentinel);
                        }
                    }, 150);
                };
            }
        });
}());
