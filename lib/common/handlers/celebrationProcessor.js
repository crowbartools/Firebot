'use strict';

// Send celebration info to overlay.
function celebrate(effect) {

    // Get report info
    let celebrationType = effect.celebration;
    let celebrationDuration = effect.length;

    // Send data to renderer.
    let data = {"event": "celebration", "celebrationType": celebrationType, "celebrationDuration": celebrationDuration};
    renderWindow.webContents.send('celebrate', data);
}




// Export Functions
exports.play = celebrate;
