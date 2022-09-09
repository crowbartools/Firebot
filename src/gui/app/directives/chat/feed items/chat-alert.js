"use strict";
(function() {
    angular
        .module('firebotApp')
        .component("chatAlert", {
            bindings: {
                message: "<"
            },
            template: `
                <div class="chat-alert">
                    <span style="font-size:25px;margin-right: 10px;"><i class="fad fa-exclamation-circle"></i></span>
                    <span style="margin-top: 8px;">{{$ctrl.message}}</span>
                </div>
            `
        });
}());
