"use strict";
const fs = require("fs");

exports.pathExists = (path) => {
    return new Promise(resolve => {
        fs.access(path, err => {
            if (err) {
                //ENOENT means Error NO ENTity found, aka the file/folder doesn't exist.
                if (err.code === "ENOENT") {
                    // This folder doesn't exist. Resolve and create it.
                    resolve(false);
                } else {
                    // Some weird error happened other than the path missing.
                    const logger = require("../logwrapper");
                    logger.error(err);
                    resolve(false);
                }
            } else {
                resolve(true);
            }
        });
    });
};
