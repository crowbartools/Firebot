"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("firebotButton", {
            bindings: {
                text: "@",
                ngClick: "&?",
                type: "<?",
                disabled: "<?"
            },
            template: `
                <button 
                    class="btn" 
                    ng-class="'btn-' + $ctrl.type" 
                    ng-disabled="$ctrl.disabled"
                >{{$ctrl.text}}
                </button>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.$onInit = () => {
                    if ($ctrl.type == null) {
                        $ctrl.type = "default";
                    }
                };
            }
        });
}());
