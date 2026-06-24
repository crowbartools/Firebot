"use strict";

(function() {
    angular
        .module("firebotApp")
        .component("lucideIcon", {
            bindings: {
                name: "@",
                color: "@?",
                size: "<?"
            },
            template: `<i class="lucide-icon"></i>`,
            controller: function($element, lucideService) {
                const $ctrl = this;

                const render = () => {
                    const host = $element[0];
                    const wrapper = host.querySelector(".lucide-icon") || host;
                    wrapper.innerHTML = "";
                    if (!$ctrl.name) {
                        return;
                    }
                    const placeholder = document.createElement("i");
                    placeholder.setAttribute("data-lucide", $ctrl.name);
                    wrapper.appendChild(placeholder);

                    const size = $ctrl.size || 24;
                    const attrs = { width: size, height: size };
                    if ($ctrl.color) {
                        attrs.stroke = $ctrl.color;
                    }

                    lucideService.lucide.createIcons({
                        icons: lucideService.lucide.icons,
                        root: wrapper,
                        attrs
                    });
                };

                $ctrl.$onInit = render;
                $ctrl.$onChanges = render;
            }
        });
}());
