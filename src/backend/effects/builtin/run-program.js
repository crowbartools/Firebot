"use strict";

const logger = require("../../logwrapper");
const { EffectCategory } = require("../../../shared/effect-constants");
const process = require("process");
const spawn = require("child_process").spawn;
const path = require("path");

const splitArgumentsText = (argsString) => {
    const re = /^"[^"]*"$/; // Check if argument is surrounded with double-quotes
    const re2 = /^([^"]|[^"].*?[^"])$/; // Check if argument is NOT surrounded with double-quotes

    const arr = [];
    let argPart = null;

    if (argsString) {
        argsString.split(" ").forEach(function (arg) {
            if ((re.test(arg) || re2.test(arg)) && !argPart) {
                arr.push(arg);
            } else {
                argPart = argPart ? `${argPart} ${arg}` : arg;
                // If part is complete (ends with a double quote), we can add it to the array
                if (/"$/.test(argPart)) {
                    arr.push(argPart.replace(/^"/, "").replace(/"$/, ""));
                    argPart = null;
                }
            }
        });
    }

    return arr;
};

const model = {
    definition: {
        id: "firebot:run-program",
        name: "Run Program",
        description: "Run a program or executable",
        icon: "fad fa-terminal",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        outputs: [
            {
                label: "Program Response",
                description: "The raw response from the program",
                defaultName: "programResponse"
            }
        ]
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Program File Path">
            <file-chooser model="effect.programPath" options="{ filters: [ { name:'Program', extensions:['exe', 'bat', 'cmd'] }, { name:'All Files', extensions:['*'] } ] }"></file-chooser>
        </eos-container>
        <eos-container header="Program Arguments (Optional)" pad-top="true">
            <div class="input-group">
                <span class="input-group-addon" id="delay-length-effect-type">Args</span>
                <input ng-model="effect.programArgs" type="text" class="form-control" type="text" replace-variables menu-position="bottom">
            </div>
        </eos-container>
        <eos-container header="Options" pad-top="true">
            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Wait for program to finish
                    <input type="checkbox" ng-model="effect.waitForFinish">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Hide windows
                    <input type="checkbox" ng-model="effect.hideWindow">
                    <div class="control__indicator"></div>
                </label>
            </div>

            <div style="padding-top:15px">
                <label class="control-fb control--checkbox"> Run detached
                    <input type="checkbox" ng-model="effect.runDetached">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>
    `,
    optionsController: ($scope) => {
        if ($scope.effect.hideWindow == null) {
            $scope.effect.hideWindow = true;
        }
        if ($scope.effect.runDetached == null) {
            $scope.effect.runDetached = true;
        }
    },
    optionsValidator: (effect) => {
        const errors = [];
        if (effect.programPath == null) {
            errors.push("Please select a program executable");
        }
        return errors;
    },
    getDefaultLabel: (effect) => {
        return effect.programPath ?? "No Program Selected";
    },
    onTriggerEvent: (event) => {
        return new Promise((resolve) => {
            const { effect } = event;

            let { programPath, programArgs, waitForFinish, hideWindow, runDetached } = effect;

            if (programPath == null || programPath === "") {
                return resolve();
            }

            const useShell = programPath.toLowerCase().endsWith(".bat") || programPath.toLowerCase().endsWith(".cmd");

            const options = {
                cwd: path.dirname(programPath),
                windowsHide: hideWindow,
                shell: useShell
            };

            if (!waitForFinish) {
                options.detached = runDetached !== false; // catch null and true as valid for backwards compat
                options.stdio = "ignore";
            }

            let args = [];
            const argString = programArgs;
            if (argString != null && argString.length > 0) {
                args = splitArgumentsText(argString);
            }

            if (useShell && process.platform === "win32" && programPath.indexOf(" ") !== -1) {
                // When using shell, we must properly escape the command
                programPath = `"${programPath}"`;
            }

            let child;
            try {
                child = spawn(programPath, args, options);
            } catch (err) {
                try {
                    child.kill();
                } catch (ignore) {
                    // ignore
                }
                logger.warn("Failed to spawn program:", err, programPath, args, options);
                return resolve();
            }

            if (!waitForFinish) {
                child.unref();
                return resolve();
            }

            let stdoutData = "";
            if (child.stdout) {
                child.stdout.on("data", (data) => {
                    logger.debug(`stdout: ${data}`);
                    stdoutData += data;
                });

                child.stderr.on("data", (data) => {
                    logger.debug(`stderr: ${data}`);
                });
            }

            child.on("error", function (err) {
                logger.warn(`spawned program error:`, err, programPath, args, options);
                child.kill();
                return resolve();
            });

            child.on("close", (code) => {
                logger.debug(`Spawned program exited with code ${code}`);
                resolve({
                    success: true,
                    outputs: {
                        programResponse: stdoutData
                    }
                });
            });
        });
    }
};

module.exports = model;
