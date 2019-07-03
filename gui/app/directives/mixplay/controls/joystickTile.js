"use strict";

(function() {
    angular.module("firebotApp")
        .component("joystickTile", {
            bindings: {
                control: "<"
            },
            template: `
                <div class="mixer-joystick">
                    <div class="arrows top"></div>
                    <div class="arrows left"></div>
                    <div class="handle" style="transform: translate(0px, 0px); transition: none 0s ease 0s;"></div>
                </div>                
            `,
            controller: function() {}
        });
}());
