"use strict";

(function() {
    angular.module("firebotApp")
        .component("scrollSentinel", {
            bindings: {
                elementId: "@"
            },
            template: `
              <div class="fb-scroll-sentinel"></div>
            `,
            controller: function($timeout) {
                const $ctrl = this;
                $ctrl.$onInit = function() {
                    $timeout(() => {
                        let observer = new IntersectionObserver(entries => {
                            let entry = entries[0];

                            angular.element(`#${$ctrl.elementId}`).toggleClass('is-stuck', !entry.isIntersecting);
                        });

                        let sentinel = document.querySelector('.fb-scroll-sentinel');
                        if (sentinel != null) {
                            observer.observe(sentinel);
                        }
                    }, 100);
                };
            }
        });
}());
