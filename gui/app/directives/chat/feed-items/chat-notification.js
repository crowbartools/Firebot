"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatNotification", {
            bindings: {
                message: "<"
            },
            template: `
                <div class="chat-alert">
                    <span>{{$ctrl.message}}</span>
                </div>
            `
        });
}());