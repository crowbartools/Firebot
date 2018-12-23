"use strict";

(function() {

    angular
        .module("firebotApp")
        .factory("controlHelper", function(logger) {
            let service = {};

            service.controlKinds = [
                {
                    kind: "button",
                    display: "Button",
                    description: "A simple button.",
                    iconClass: "fa-bullseye"
                },
                {
                    kind: "label",
                    display: "Label",
                    description: "Just some text that can't be interacted with.",
                    iconClass: "fa-tag"
                },
                {
                    kind: "textbox",
                    display: "Textbox",
                    description: "A way for viewers to input text.",
                    iconClass: "fa-font"
                },
                {
                    kind: "joystick",
                    display: "Joystick",
                    description: "Allows viewers to control your mouse.",
                    iconClass: "fa-gamepad"
                },
                {
                    kind: "screen",
                    display: "Mouse",
                    description: "Another mouse control. Tracks viewers cursor position over the stream area.",
                    iconClass: "fa-mouse-pointer"
                }
            ];


            service.controlSettings = {
                button: {
                    grid: true,
                    resizable: true,
                    minSize: {
                        width: 6,
                        height: 4
                    },
                    maxSize: {
                        width: 20,
                        height: 15
                    },
                    effects: true
                },
                label: {
                    grid: true,
                    resizable: true,
                    minSize: {
                        width: 6,
                        height: 4
                    },
                    maxSize: {
                        width: 20,
                        height: 15
                    },
                    effects: false
                },
                textbox: {
                    grid: true,
                    resizable: true,
                    minSize: {
                        width: 15,
                        height: 4
                    },
                    maxSize: {
                        width: 20,
                        height: 15
                    },
                    effects: false
                },
                joystick: {
                    grid: true,
                    resizable: false,
                    minSize: {
                        width: 12,
                        height: 12
                    },
                    maxSize: {
                        width: 12,
                        height: 12
                    },
                    effects: false
                },
                screen: {
                    grid: false,
                    resizable: false,
                    minSize: {
                        width: 0,
                        height: 0
                    },
                    maxSize: {
                        width: 0,
                        height: 0
                    },
                    effects: false
                }
            };

            return service;
        });
}());
