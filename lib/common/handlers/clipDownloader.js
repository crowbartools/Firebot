"use strict";

const exec = require('child_process').exec;
const ffmpeg = require('ffmpeg-static').path;

// returns a promise: resolves with output file path or rejects with conversion error
module.exports = function (m3u8, output) {
    return new Promise((resolve, reject) => {
        exec(
            `${ffmpeg} -i ${m3u8} -c copy -bsf:a aac_adtstoasc "${output}"`,
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