const robot = require('robotjs');

// Joystick Controls
function joystick(inputEvent) {
    var mousex = inputEvent.input.x
    var mousey = inputEvent.input.y
    var mouseSpeed = 50;
    
    // Get current mouse position
    var mousePos = robot.getMousePos();
    var mousePosX = mousePos.x;
    var mousePosY = mousePos.y;

    // If mousex is negative, move left. Else move right.
    if (mousex < 0){
        var mousePosX = mousePosX - mouseSpeed;
    } else {
        var mousePosX = mousePosX + mouseSpeed;
    }
    // If mousey is negative, move up. Else move down.
    if (mousey < 0){
        var mousePosY = mousePosY - mouseSpeed;
    } else {
        var mousePosY = mousePosY + mouseSpeed;
    }

    robot.moveMouse(mousePosX, mousePosY);
}

exports.go = joystick;