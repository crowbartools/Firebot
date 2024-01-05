"use strict";

const uuidv1 = require("uuid/v1");

const { ipcMain } = require("electron");

const listeners = {};

function send(eventName, data) {
    if (global.renderWindow != null) {
        renderWindow.webContents.send(eventName, data);
    }
}

function registerEventWithElectron(eventName) {
    return (function(name) {
        ipcMain.on(name, function(event, data) {
            const eventListeners = listeners[name];
            for (const listener of eventListeners) {
                if (listener.async) {
                    listener.callback(data).then(returnValue => {
                        send(`${name}:reply`, returnValue);
                    });
                } else {
                    const returnValue = listener.callback(data);
                    event.returnValue = returnValue;
                }
            }
        });
    }(eventName));
}

function fireEventAsync(type, data) {
    return new Promise(resolve => {
        if (global.renderWindow != null) {
            ipcMain.once(`${type}:reply`, (_, eventData) => {
                resolve(eventData);
            });
            renderWindow.webContents.send(type, data);
        }
    });
}

function on(eventName, callback, async = false) {
    const id = uuidv1(),
        event = {
            id: id,
            callback: callback,
            async: async
        };

    if (listeners.hasOwnProperty(eventName)) {
        listeners[eventName].push(event);
    } else {
        listeners[eventName] = [event];
        registerEventWithElectron(eventName);
    }

    return id;
}

function onAsync(eventName, callback) {
    return on(eventName, callback, true);
}

exports.fireEventAsync = fireEventAsync;
exports.send = send;
exports.onAsync = onAsync;
exports.on = function(eventName, callback) {
    return on(eventName, callback, false);
};

