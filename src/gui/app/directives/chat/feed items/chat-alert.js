"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatAlert", {
            bindings: {
                alertMessage: "<",
                alertIcon: "<"
            },
            template: `
                <div class="chat-alert">
                    <span style="font-size:25px;margin-right: 10px;"><i ng-class="$ctrl.iconClass"></i></span>
                    <span style="margin-top: 8px;">{{$ctrl.message}}</span>
                </div>
            `,
            controller: function() {
                const $ctrl = this;

                $ctrl.iconClass = "";
                $ctrl.message = "No message";

                const init = () => {
                    if ($ctrl.alertMessage) {
                        $ctrl.message = $ctrl.alertMessage;
                    }

                    var icon = $ctrl.alertIcon;
                    if (!icon) {
                        icon = "fad fa-exclamation-circle";
                    }

                    const classes = icon.split(" ");
                    if (classes.length === 1) {
                        $ctrl.iconClass = `far ${classes[0]}`;
                    } else {
                        $ctrl.iconClass = classes.join(" ");
                    }
                };

                $ctrl.$onInit = init;
            },
        });
}());
