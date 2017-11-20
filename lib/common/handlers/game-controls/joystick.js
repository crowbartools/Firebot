'use strict';
const robot = require('robotjs');

// Joystick Controls
function joystick(inputEvent) {
    let mousex = inputEvent.input.x;
    let mousey = inputEvent.input.y;
    let mouseSpeed = 50;

    // Get current mouse position
    let mousePos = robot.getMousePos();
    let mousePosX = mousePos.x;
    let mousePosY = mousePos.y;

    // If mousex is negative, move left. Else move right.
    if (mousex < 0) {
        let mousePosX = mousePosX - mouseSpeed;
    } else {
        let mousePosX = mousePosX + mouseSpeed;
    }
    // If mousey is negative, move up. Else move down.
    if (mousey < 0) {
        let mousePosY = mousePosY - mouseSpeed;
    } else {
        let mousePosY = mousePosY + mouseSpeed;
    }

    robot.moveMouse(mousePosX, mousePosY);
}

exports.go = joystick;
