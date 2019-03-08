"use strict";

/**
 * Enum for control kinds
 * @readonly
 * @enum {string}
 */
const ControlKind = Object.freeze({
    BUTTON: "button",
    LABEL: "label",
    TEXTBOX: "textbox",
    JOYSTICK: "joystick",
    SCREEN: "screen"
});

/**
 * Enum for input types
 * @readonly
 * @enum {string}
 */
const InputEvent = Object.freeze({
    MOUSEDOWN: "mousedown",
    MOUSEUP: "mouseup",
    KEYDOWN: "keydown",
    KEYUP: "keyup",
    SUBMIT: "submit",
    MOVE: "move"
});

exports.ControlKind = ControlKind;
exports.InputEvent = InputEvent;