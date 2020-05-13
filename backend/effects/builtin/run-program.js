"use strict";

const logger = require("../../logwrapper");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectTrigger } = effectModels;

const { EffectCategory } = require('../../../shared/effect-constants');

const spawn = require('child_process').spawn;

const model = {
    definition: {
        id: "firebot:run-program",
        name: "Run Program",
        description: "Run a program or executable",
        icon: "fad fa-terminal",
        categories: [EffectCategory.ADVANCED, EffectCategory.SCRIPTING],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
    },
    globalSettings: {},
    optionsTemplate: `
        <eos-container header="Program File Path">
            <file-chooser model="effect.programPath" options="{ filters: [ {name:'Program',extensions:['exe', 'bat', 'cmd']} ]}"></file-chooser>
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
        </eos-container>
    `,
    optionsController: $scope => {
        if ($scope.effect.hideWindow === undefined) {
            $scope.effect.hideWindow = true;
        }
    },
    optionsValidator: effect => {
        let errors = [];
        if (effect.programPath == null) {
            errors.push("Please select a program executable");
        }
        return errors;
    },
    onTriggerEvent: event => {
        return new Promise(resolve => {
            let { effect } = event;

            let { programPath, programArgs, waitForFinish, hideWindow } = effect;

            if (programPath == null || programPath === "") {
                return resolve();
            }

            const useShell = programPath.toLowerCase().endsWith(".bat") || programPath.toLowerCase().endsWith(".cmd");

            const options = {
                windowsHide: hideWindow,
                shell: useShell
            };

            if (!waitForFinish) {
                options.detached = true;
                options.stdio = 'ignore';
            }

            let args = [];
            const argString = programArgs;
            if (argString != null && argString.length > 0) {
                args = argString.split(" ");
            }

            const child = spawn(`"${programPath}"`, args, options);

            if (!waitForFinish) {
                child.unref();
                return resolve();
            }
            if (child.stdout) {
                child.stdout.on('data', (data) => {
                    logger.debug(`stdout: ${data}`);
                });

                child.stderr.on('data', (data) => {
                    logger.debug(`stderr: ${data}`);
                });
            }

            child.on('error', function(err) {
                logger.warning(`spawned program error:`, err);
                child.kill();
                return resolve();
            });

            child.on('close', (code) => {
                logger.debug(`Spawned program exited with code ${code}`);
                resolve();
            });
        });
    }
};

module.exports = model;
