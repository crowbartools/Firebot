"use strict";

const exec = require('child_process').exec;
const os = require('os');
const path = require('path');

function getFfmpegPath() {
    let platform = os.platform();
    let arch = os.arch();
    let ffmpegPath = path.join(
        process.cwd(),
        'resources',
        'ffmpeg',
        platform,
        arch,
        platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'
    );
    return ffmpegPath;
}

// returns a promise: resolves with output file path or rejects with conversion error
module.exports = function (m3u8, output) {
    return new Promise((resolve, reject) => {
        exec(
            `${getFfmpegPath()} -i ${m3u8} -c copy -bsf:a aac_adtstoasc "${output}"`,
            {windowHide: true},
            function (err) {
                if (err) {
                    return reject(err);
                }
                resolve(output);
            }
        );
    });
};