"use strict";

class DevLabImportError extends Error {
    constructor(...params) {
        super(...params);

        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DevLabImportError);
        }

        this.name = 'DevLabImportError';
        this.date = new Date();
    }
}

module.exports = {
    DevLabImportError
};