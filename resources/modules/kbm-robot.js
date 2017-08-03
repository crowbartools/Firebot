var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;
var Promise = require("promise");

var keyPresser;

function kbmRobot() {
    "use strict";

    var DEBUG = false;

    var easyKeys = {
        "ESC": "VK_ESCAPE",
        "F1": "VK_F1",
        "F2": "VK_F2",
        "F3": "VK_F3",
        "F4": "VK_F4",
        "F5": "VK_F5",
        "F6": "VK_F6",
        "F7": "VK_F7",
        "F8": "VK_F8",
        "F9": "VK_F9",
        "F10": "VK_F10",
        "F11": "VK_F11",
        "F12": "VK_F12",
        "PRINT_SCREEN": "VK_PRINTSCREEN",
        "SCROLL_LOCK": "VK_SCROLL_LOCK",
        "PAUSE_BREAK": "VK_PAUSE",
        "`": "VK_BACK_QUOTE",
        "-": "VK_MINUS",
        "=": "VK_EQUALS",
        "BACKSPACE": "VK_BACK_SPACE",
        "INSERT": "VK_INSERT",
        "HOME": "VK_HOME",
        "PAGE_UP": "VK_PAGE_UP",
        "NUM_LOCK": "VK_NUM_LOCK",
        "KP_/": "VK_DIVIDE",
        "KP_*": "VK_MULTIPLY",
        "KP_-": "VK_SUBTRACT",
        "TAB": "VK_TAB",
        "[": "VK_OPEN_BRACKET",
        "]": "VK_CLOSE_BRACKET",
        "\\": "VK_BACK_SLASH",
        "DELETE": "VK_DELETE",
        "END": "VK_END",
        "PAGE_DOWN": "VK_PAGE_DOWN",
        "KP_7": "VK_NUMPAD7",
        "KP_8": "VK_NUMPAD8",
        "KP_9": "VK_NUMPAD9",
        "KP_ADD": "VK_ADD",
        "CAPS_LOCK": "VK_CAPS_LOCK",
        ";": "VK_SEMICOLON",
        "'": "VK_QUOTE",
        "ENTER": "VK_ENTER",
        "\n": "VK_ENTER",
        "KP_4": "VK_NUMPAD4",
        "KP_5": "VK_NUMPAD5",
        "KP_6": "VK_NUMPAD6",
        "SHIFT": "VK_SHIFT",
        ",": "VK_COMMA",
        ".": "VK_PERIOD",
        "/": "VK_SLASH",
        "UP": "VK_UP",
        "KP_1": "VK_NUMPAD1",
        "KP_2": "VK_NUMPAD2",
        "KP_3": "VK_NUMPAD3",
        "CTRL": "VK_CONTROL",
        "META": "VK_META",
        // TODO: need to have the jar convert VK_META to VK_WINDOWS.
        // Did meta never work on windows?
        "SUPER": "VK_META",
        "ALT": "VK_ALT",
        " ": "VK_SPACE",
        "SPACE": "VK_SPACE",
        "LEFT": "VK_LEFT",
        "DOWN": "VK_DOWN",
        "RIGHT": "VK_RIGHT",
        "KP_0": "VK_NUMPAD0",
        "KP_.": "VK_DECIMAL"
    };

    var shiftables = {
        "~": "`",
        "!": "1",
        "@": "2",
        "#": "3",
        "$": "4",
        "%": "5",
        "^": "6",
        "&": "7",
        "*": "8",
        "(": "9",
        ")": "0",
        "_": "-",
        "+": "=",
        "{": "[",
        "}": "]",
        "|": "\\",
        ":": ";",
        "\"": "'",
        "<": ",",
        ">": ".",
        "?": "/",
    };

    for (var x = 65; x < 91; ++x) {
        var letter = String.fromCharCode(x);
        easyKeys[letter] = "VK_" + letter;
    }

    for (x = 48; x < 58; ++x) {
        var number = String.fromCharCode(x);
        easyKeys[number] = "VK_" + number;
    }

    var actionArr = [];

    var press = function(key) {
        var realKey = easyKeys[key.toUpperCase()] || key;
        keyPresser.stdin.write("D " + realKey + "\n");
        return Promise.resolve();
    };

    var release = function(key) {
        var realKey = easyKeys[key.toUpperCase()] || key;
        keyPresser.stdin.write("U " + realKey + "\n");
        return Promise.resolve();
    };

    var typeString = function(str, downDelay, upDelay) {
        var chars = str.split("");
        return new Promise(function(res) {
            var p = Promise.resolve();
            chars.forEach(function(character) {
                p = p.then(function() {
                    return type(character, downDelay);
                })
                .then(function() {
                    return sleep(upDelay);
                });
            });
            p.then(res);
        });
    };

    var type = function(key, delay) {
        return new Promise(function(res) {
            var shiftableKey = shiftables[key];
            if (shiftableKey) {
                key = shiftableKey;
            }
            if (key.toLowerCase() !== key || shiftableKey) {
                press("shift")
                .then(function() {
                    return sleep(delay);
                })
                .then(function() {
                    return press(key);
                })
                .then(function() {
                    return sleep(delay);
                })
                .then(function() {
                    return release(key);
                })
                .then(function() {
                    return sleep(delay);
                })
                .then(function() {
                    return release("shift");
                })
                .then(res);
            } else {
                press(key)
                .then(function() {
                    return sleep(delay);
                })
                .then(function() {
                    return release(key);
                })
                .then(res);
            }
        });
    };

    var sleep = function(amt) {
        return new Promise(function(res) {
            setTimeout(res, amt);
        });
    };

    var mouseMove = function(x, y) {
        keyPresser.stdin.write("MM " + x + " " + y + "\n");
        return Promise.resolve();
    };

    var mousePress = function(buttons) {
        keyPresser.stdin.write("MD " + buttons + "\n");
        return Promise.resolve();
    };

    var mouseRelease = function(buttons) {
        keyPresser.stdin.write("MU " + buttons + "\n");
        return Promise.resolve();
    };

    var mouseClick = function(buttons, delay) {
        return new Promise(function(res) {
            mousePress(buttons)
            .then(function() {
                return sleep(delay);
            })
            .then(function() {
                return mouseRelease(buttons);
            })
            .then(res);
        });
    };

    var mouseWheel = function(amt) {
        keyPresser.stdin.write("MW " + amt + "\n");
        return Promise.resolve();
    };

    var notStartedErr = "ERR: kbm-robot not started. ( Call .startJar() ).";

    var pub = {
        startJar: function(JRE_ver) {
            JRE_ver = JRE_ver || 6;
            var jarPath = path.join("./resources/kbm-java", "robot" + JRE_ver + ".jar");
            if (!keyPresser) {
                if (!fs.existsSync(jarPath)) {
                    throw new Error("ERR: Can't find robot" + JRE_ver +
                        ".jar. Expected Path: " + jarPath);
                }
                keyPresser = spawn("java", ["-jar", jarPath]);

                // Need to hook up these handlers to prevent the
                // jar from crashing sometimes.
                keyPresser.stdout.on('data', function(data) {
                    if (DEBUG) {
                        console.log('stdout: ' + data);
                    }
                });

                keyPresser.stderr.on('data', function(data) {
                    if (DEBUG) {
                        console.log('stderr: ' + data);
                    }
                });

                keyPresser.on('close', function(data) {
                    if (DEBUG) {
                        console.log('child process exited with code: ' + code);
                    }
                });
            } else {
                throw new Error("ERR: A kbm-robot jar has already started.");
            }
        },
        stopJar: function() {
            if (keyPresser) {
                keyPresser.kill("SIGINT");
                keyPresser = null;
            } else {
                throw new Error("ERR: A kbm-robot jar is not started");
            }
        },
        press: function(key) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            actionArr.push({func: press, args: [key]});
            return pub;
        },
        release: function(key) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            actionArr.push({func: release, args: [key]});
            return pub;
        },
        typeString: function(str, downDelay, upDelay) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            downDelay = downDelay || 0;
            upDelay = upDelay || 0;
            actionArr.push({func: typeString, args: [str, downDelay, upDelay]});
            return pub;
        },
        type: function(key, delay) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            delay = delay || 0;
            actionArr.push({func: type, args: [key, delay]});
            return pub;
        },
        sleep: function(amt) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            actionArr.push({func: sleep, args: [amt]});
            return pub;
        },
        mouseMove: function(x, y) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            actionArr.push({func: mouseMove, args: [x, y]});
            return pub;
        },
        mousePress: function(buttons) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            buttons += "";
            actionArr.push({func: mousePress, args: [buttons]});
            return pub;
        },
        mouseRelease: function(buttons) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            buttons += "";
            actionArr.push({func: mouseRelease, args: [buttons]});
            return pub;
        },
        mouseClick: function(buttons, delay) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            delay = delay || 0;
            buttons += "";
            actionArr.push({func: mouseClick, args: [buttons, delay]});
            return pub;
        },
        mouseWheel: function(amount) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            actionArr.push({func: mouseWheel, args: [amount]});
            return pub;
        },
        go: function(cb) {
            if (!keyPresser) {
                throw new Error(notStartedErr);
            }
            // Add in small delay to end of chain so
            // that the jar has enough time to execute
            // the final command before it is (probably) killed.
            // May need to refactor this later for an "all done" command
            // sent to the jar which in turn waits for the jar to
            // send a message back so we can kill it after it's truly done.
            pub.sleep(200);

            var p = Promise.resolve();
            actionArr.forEach(function(action) {
                p = p.then(function() {
                    return action.func.apply(action.func, action.args);
                });
            });
            actionArr = [];
            if (cb) {
                p.then(cb);
            } else {
                return p;
            }
        }
    };

    return pub;
}

module.exports = kbmRobot();
