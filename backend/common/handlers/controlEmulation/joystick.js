"use strict";
const robot = require("robotjs");
const logger = require("../../../logwrapper");

// Joystick Controls
function joystick(inputEvent) {
    let screenSize = robot.getScreenSize();
    let screenWidth = screenSize.width;
    let screenHeight = screenSize.height;

    let mousex = inputEvent.x * screenWidth;
    let mousey = inputEvent.y * screenHeight;
    let mouseSpeed = 50;

    // Get current mouse position
    let mouseCur = robot.getMousePos();
    let mouseCurX = mouseCur.x;
    let mouseCurY = mouseCur.y;

    // If mousex is less than current position, move left. Else move right.
    if (mousex < mouseCurX) {
        mouseCurX = mouseCurX - mouseSpeed;
    } else {
        mouseCurX = mouseCurX + mouseSpeed;
    }

    // If mousey is less than, move up. Else move down.
    if (mousey < mouseCurY) {
        mouseCurY = mouseCurY - mouseSpeed;
    } else {
        mouseCurY = mouseCurY + mouseSpeed;
    }

    robot.moveMouse(mouseCurX, mouseCurY);
}

exports.go = joystick;
