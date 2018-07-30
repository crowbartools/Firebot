'use strict';
(function() {

    // This provides helper methods for control effects

    const _ = require('underscore')._;
    const dataAccess = require('../../lib/common/data-access.js');
    const EffectType = require('../../lib/common/EffectType.js');

    angular
        .module('firebotApp')
        .factory('effectHelperService', function ($q, utilityService, logger) {
            let service = {};

            // Returns a controller to be used for the template of a given effectype
            service.getControllerForEffectTypeTemplate = function(trigger, effectType) {
                // Default empty controller. We can override it in the switch statement below.
                let controller = () => {};

                // Swap list to look through based on given type.
                let EffectList = EffectType.getEffectDictionary(trigger);

                // If trigger is still null, that means we dont know it yet. Just pass back the empty controller
                if (trigger == null) {
                    return controller;
                }

                switch (effectType) {

                case EffectList.HTML:
                    controller = ($scope, utilityService) => {

                        if ($scope.effect.length == null) {
                            $scope.effect.length = 10;
                        }

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };
                    };
                    break;

                case EffectList.PLAY_SOUND:
                    controller = ($scope, listenerService) => {

                        let uuid = _.uniqueId();

                        if ($scope.effect.volume == null) {
                            $scope.effect.volume = 5;
                        }

                        $scope.openFileExporer = function() {
                            let registerRequest = {
                                type: listenerService.ListenerType.SOUND_FILE,
                                uuid: uuid,
                                runOnce: true,
                                publishEvent: true
                            };
                            listenerService.registerListener(registerRequest, (filepath) => {
                                $scope.effect.file = filepath;
                            });
                        };
                    };
                    break;

                case EffectList.SHOW_EVENTS:
                    controller = ($scope, listenerService, utilityService) => {

                        $scope.showOverlayEventsModal = function() {
                            utilityService.showOverlayEventsModal();
                        };

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };

                    };
                    break;

                case EffectList.SHOW_IMAGE:
                    controller = ($scope, listenerService, utilityService) => {

                        let uuid = _.uniqueId();

                        if ($scope.effect.imageType == null) {
                            $scope.effect.imageType = "local";
                        }

                        $scope.openFileExporer = function() {
                            let registerRequest = {
                                type: listenerService.ListenerType.IMAGE_FILE,
                                uuid: uuid,
                                runOnce: true,
                                publishEvent: true
                            };
                            listenerService.registerListener(registerRequest, (filepath) => {
                                $scope.effect.file = filepath;
                            });
                        };

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };

                        $scope.getImagePreviewSrc = function() {
                            let path;
                            if ($scope.effect.imageType === 'local') {
                                path = $scope.effect.file;
                            } else {
                                path = $scope.effect.url;
                            }

                            if (path == null || path === "") {
                                path = "../images/placeholders/image.png";
                            }

                            return path;
                        };
                    };
                    break;

                case EffectList.SHOW_VIDEO:
                    controller = ($scope, listenerService, utilityService) => {

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };

                        $scope.videoPositions = [
                            "Top Left",
                            "Top Middle",
                            "Top Right",
                            "Middle Left",
                            "Middle",
                            "Middle Right",
                            "Bottom Left",
                            "Bottom Middle",
                            "Bottom Right"
                        ];

                        // Set Video Type
                        $scope.setVideoType = function(type) {
                            $scope.effect.videoType = type;
                        };

                        if ($scope.effect.volume == null) {
                            $scope.effect.volume = 5;
                        }

                        // Force ratio toggle
                        $scope.forceRatio = true;
                        $scope.forceRatioToggle = function() {
                            if ($scope.forceRatio === true) {
                                $scope.forceRatio = false;
                            } else {
                                $scope.forceRatio = true;
                            }
                        };

                        // Calculate 16:9
                        // This checks to see which field the user is filling out, and then adjust the other field so it's always 16:9.
                        $scope.calculateSize = function(widthOrHeight, size) {
                            if (size !== "") {
                                if (widthOrHeight === "Width" && $scope.forceRatio === true) {
                                    $scope.effect.height = String(Math.round((size / 16) * 9));
                                } else if (widthOrHeight === "Height" && $scope.forceRatio === true) {
                                    $scope.effect.width = String(Math.round((size * 16) / 9));
                                }
                            } else {
                                $scope.effect.height = "";
                                $scope.effect.width = "";
                            }
                        };

                        let uuid = _.uniqueId();

                        $scope.setVideoType = function(type) {
                            $scope.effect.videoType = type;
                            $scope.effect.youtube = "";
                            $scope.effect.file = "";
                        };

                        $scope.openFileExporer = function() {
                            let registerRequest = {
                                type: listenerService.ListenerType.VIDEO_FILE,
                                uuid: uuid,
                                runOnce: true,
                                publishEvent: true
                            };
                            listenerService.registerListener(registerRequest, (filepath) => {
                                $scope.effect.file = filepath;
                            });
                        };
                    };
                    break;

                case EffectList.API_BUTTON:
                    controller = ($scope) => {

                        // The name of the api and if it has images available to show or not.
                        $scope.apiTypes = [
                            {name: "Advice", image: false},
                            {name: "Cat Picture", image: true},
                            {name: "Cat Fact", image: false},
                            {name: "Dad Joke", image: false},
                            {name: "Dog Picture", image: true},
                            {name: "Dog Fact", image: false},
                            {name: "Aww", image: true},
                            {name: "Pokemon", image: false},
                            {name: "Number Trivia", image: false}
                        ];

                        // When an api is clicked in the dropdown save its name and if it has images available.
                        $scope.effectClick = function(api) {
                            $scope.effect.api = api.name;
                            $scope.effect.imageAvailable = api.image;
                        };

                    };
                    break;

                case EffectList.CHANGE_GROUP:
                    controller = ($scope, groupsService) => {

                        // Get viewer groups and push group name to scope.
                        $scope.viewerGroups = groupsService.getActiveGroups();

                    };
                    break;

                case EffectList.CHANGE_SCENE:
                    controller = ($scope, groupsService, boardService) => {

                        // Make the Change Scene option user friendly text.
                        // EX: effect.reset = false should show as "Reset Scenes" in the ui.
                        $scope.ufChangeSceneOption = function() {
                            if ($scope.effect.reset) {
                                return "Reset Scenes";
                            } else if ($scope.effect.reset === false) {
                                return "Change Scenes";
                            }
                            return "Pick One";

                        };

                        // Get viewer groups and push group name to scope.
                        // This is for loading up all user group checkboxes.
                        $scope.viewerGroups = groupsService.getActiveGroups();

                        // This is run each time a group checkbox is clicked or unclicked.
                        // This will build an array of currently selected groups to be saved to JSON.
                        $scope.groupArray = function(list, item) {
                            $scope.effect.groups = service.getCheckedBoxes(list, item);
                        };

                        // This uses the board service to get a list of scenes for the current board.
                        $scope.getScenesForSelectedBoard = function() {
                            return boardService.getScenesForSelectedBoard();
                        };

                        // This checks if an item is in the effect.group array and returns true.
                        // This allows us to check boxes when loading up this button effect.
                        $scope.groupCheckboxer = function (list, item) {
                            return service.checkSavedArray(list, item);
                        };

                    };
                    break;

                case EffectList.COOLDOWN:
                    controller = ($scope, boardService) => {

                        // Get all control id's in an array so we can add checkboxes.
                        $scope.boardButtons = boardService.getControlsForSelectedBoard()
                            .filter(c => c.kind === "button" || c.kind === "textbox")
                            .map(b => b.controlId);

                        // This sets the effect.buttons to an array of checked items.
                        $scope.buttonArray = function(list, item) {
                            $scope.effect.buttons = service.getCheckedBoxes(list, item);
                        };

                        // This checks if an item is in the effect.buttons array and returns true.
                        // This allows us to check boxes when loading up this button effect.
                        $scope.buttonCheckboxer = function (list, item) {
                            return service.checkSavedArray(list, item);
                        };

                        // Uncheck all checkboxes.
                        $scope.uncheckAll = function() {
                            $scope.effect.buttons = [];
                        };

                    };
                    break;

                case EffectList.CELEBRATION:
                    controller = ($scope) => {

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };

                        $scope.celebrationTypes = [
                            "Fireworks"
                        ];

                    };
                    break;

                case EffectList.EFFECT_GROUP:
                case EffectList.RANDOM_EFFECT:
                    controller = ($scope) => {
                        if ($scope.effect.effectList == null) {
                            $scope.effect.effectList = [];
                        }

                        $scope.effectListUpdated = function(effects) {
                            $scope.effect.effectList = effects;
                        };
                    };
                    break;
                case EffectList.UPDATE_BUTTON:
                    controller = ($scope, boardService) => {
                        if ($scope.effect.properties == null) {
                            $scope.effect.properties = {
                                text: {
                                    shouldUpdate: false,
                                    value: ""
                                },
                                tooltip: {
                                    shouldUpdate: false,
                                    value: ""
                                },
                                cost: {
                                    shouldUpdate: false,
                                    value: ""
                                },
                                cooldown: {
                                    shouldUpdate: false,
                                    value: ""
                                },
                                progress: {
                                    shouldUpdate: false,
                                    value: ""
                                },
                                disabled: {
                                    shouldUpdate: false,
                                    value: false
                                }
                            };
                        }

                        $scope.buttons = boardService.getControlsForSelectedBoard()
                            .filter(c => c.kind === "button" || c.kind === "textbox")
                            .map(b => {
                                return {
                                    controlId: b.controlId,
                                    text: b.text != null && b.text.trim() !== "" ? b.text : b.controlId,
                                    scene: b.scene
                                };
                            });

                    };
                    break;
                case EffectList.CREATE_CLIP:
                    controller = ($scope) => {
                        if ($scope.effect.clipDuration == null) {
                            $scope.effect.clipDuration = 30;
                        }

                        if ($scope.effect.postLink == null) {
                            $scope.effect.postLink = true;
                        }

                        if ($scope.effect.download == null) {
                            $scope.effect.download = false;
                        }

                        if ($scope.effect.clipTitle == null) {
                            $scope.effect.clipTitle = "$(streamTitle) (Created by $(user))";
                        }

                        $scope.onDurationChange = function() {
                            if ($scope.effect.clipDuration > 300) {
                                $scope.effect.clipDuration = 300;
                            }
                            if ($scope.effect.clipDuration < 15) {
                                $scope.effect.clipDuration = 15;
                            }
                        };
                    };
                    break;
                case EffectList.DICE:
                    controller = ($scope) => {

                        // Default result type to 'sum'
                        $scope.effect.resultType = $scope.effect.resultType ? $scope.effect.resultType : 'sum';

                    };
                    break;

                case EffectList.CUSTOM_SCRIPT:
                    controller = ($scope, $rootScope) => {

                        function loadParameters(scriptName) {
                            logger.info("Attempting to load custom script parameters...");
                            $scope.isLoadingParameters = true;

                            let scriptsFolder = dataAccess.getPathInUserData('/user-settings/scripts');
                            let scriptFilePath = path.resolve(scriptsFolder, scriptName);
                            // Attempt to load the script
                            try {
                                // Make sure we first remove the cached version, incase there was any changes
                                delete require.cache[require.resolve(scriptFilePath)];

                                let customScript = require(scriptFilePath);

                                //grab the manifest
                                if (typeof customScript.getScriptManifest === 'function') {
                                    $scope.scriptManifest = customScript.getScriptManifest();
                                } else {
                                    $scope.scriptManifest = null;
                                }

                                let currentParameters = $scope.effect.parameters;
                                if (typeof customScript.getDefaultParameters === 'function') {

                                    let parameterRequest = {
                                        modules: {
                                            request: require("request")
                                        }
                                    };
                                    let parametersPromise = customScript.getDefaultParameters(parameterRequest);

                                    $q.when(parametersPromise).then((parameters) => {
                                        let defaultParameters = parameters;

                                        if (currentParameters != null) {
                                            //get rid of old params that no longer exist
                                            Object.keys(currentParameters).forEach((currentParameterName) => {
                                                let currentParamInDefaults = defaultParameters[currentParameterName];
                                                if (currentParamInDefaults == null) {
                                                    delete currentParameters[currentParameterName];
                                                }
                                            });

                                            //handle any new params
                                            Object.keys(defaultParameters).forEach((defaultParameterName) => {
                                                let currentParam = currentParameters[defaultParameterName];
                                                let defaultParam = defaultParameters[defaultParameterName];
                                                if (currentParam != null) {
                                                    //Current param exsits lets update the value.
                                                    defaultParam.value = currentParam.value;
                                                }
                                                currentParameters[defaultParameterName] = defaultParam;
                                            });
                                        } else {
                                            $scope.effect.parameters = defaultParameters;
                                        }
                                        $scope.isLoadingParameters = false;
                                    });
                                } else {
                                    $scope.isLoadingParameters = false;
                                }
                            } catch (err) {
                                utilityService.showErrorModal("Error loading the script '" + scriptName + "'\n\n" + err);
                                logger.error(err);
                            }
                        }

                        $scope.isLoadingParameters = true;

                        let scriptFolderPath = dataAccess.getPathInUserData("/user-settings/scripts");
                        // Grab files in folder when button effect shown.
                        $scope.scriptArray = fs.readdirSync(scriptFolderPath);

                        // Grab files in folder on refresh click.
                        $scope.getNewScripts = function () {
                            $scope.scriptArray = fs.readdirSync(scriptFolderPath);
                            if ($scope.effect.scriptName != null) {
                                loadParameters($scope.effect.scriptName);
                            }
                        };

                        // Open script folder on click.
                        $scope.openScriptsFolder = function() {
                            ipcRenderer.send('openScriptsFolder');
                        };

                        $scope.openScriptsWebsite = function() {
                            if (!$scope.scriptManifest || !$scope.scriptManifest.website) return;
                            $rootScope.openLinkExternally($scope.scriptManifest.website);
                        };

                        $scope.selectScript = function(scriptName) {
                            $scope.effect.scriptName = scriptName;
                            $scope.effect.parameters = null;
                            $scope.scriptManifest = null;
                            loadParameters(scriptName);
                        };

                        $scope.scriptHasParameters = function() {
                            return $scope.effect.parameters != null && Object.keys($scope.effect.parameters).length > 0;
                        };

                        if ($scope.effect.scriptName != null) {
                            loadParameters($scope.effect.scriptName);
                        }
                    };

                    break;

                case EffectList.GAME_CONTROL:
                    controller = ($scope) => {

                        $scope.validControls = [
                            "a",
                            "b",
                            "c",
                            "d",
                            "e",
                            "f",
                            "g",
                            "h",
                            "i",
                            "j",
                            "k",
                            "l",
                            "m",
                            "n",
                            "o",
                            "p",
                            "q",
                            "r",
                            "s",
                            "t",
                            "u",
                            "v",
                            "w",
                            "x",
                            "y",
                            "z",
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6",
                            "7",
                            "8",
                            "9",
                            "0",
                            "backspace",
                            "delete",
                            "enter",
                            "space",
                            "tab",
                            "escape",
                            "up",
                            "down",
                            "left",
                            "right",
                            "home",
                            "end",
                            "pageup",
                            "pagedown",
                            "f1",
                            "f2",
                            "f3",
                            "f4",
                            "f5",
                            "f6",
                            "f7",
                            "f8",
                            "f9",
                            "f10",
                            "f11",
                            "f12",
                            "alt",
                            "control",
                            "shift",
                            "numpad_0",
                            "numpad_1",
                            "numpad_2",
                            "numpad_3",
                            "numpad_4",
                            "numpad_5",
                            "numpad_6",
                            "numpad_7",
                            "numpad_8",
                            "numpad_9",
                            "leftmouse",
                            "middlemouse",
                            "rightmouse",
                            "audio_mute",
                            "audio_vol_down",
                            "audio_vol_up",
                            "audio_play",
                            "audio_stop",
                            "audio_pause",
                            "audio_prev",
                            "audio_next"
                        ];

                        $scope.validModifiers = [
                            "Control",
                            "Alt",
                            "Shift"
                        ];

                        if (process.platform === 'darwin') {
                            $scope.validControls.push("option", "command");
                            $scope.validModifiers = [
                                "Control",
                                "Option",
                                "Shift",
                                "Command"
                            ];
                        }

                        // This sets the effect.modifier to an array of checked items.
                        $scope.modifierArray = function(list, item) {
                            $scope.effect.modifiers = service.getCheckedBoxes(list, item);
                        };

                        // This checks if an item is in the effect.modifier array and returns true.
                        // This allows us to check boxes when loading up this button effect.
                        $scope.modifierCheckboxer = function (list, item) {
                            return service.checkSavedArray(list, item);
                        };



                    };
                    break;
                case EffectList.TOGGLE_CONNECTION:
                    controller = ($scope) => {

                        if ($scope.effect.services == null) {
                            $scope.effect.services = [];
                        }

                        $scope.serviceIsChecked = (service) => $scope.effect.services.includes(service);

                        $scope.toggleService = (service) => {
                            if ($scope.serviceIsChecked(service)) {
                                $scope.effect.services = $scope.effect.services.filter(s => s !== service);
                            } else {
                                $scope.effect.services.push(service);
                            }
                        };
                    };
                    break;
                case EffectList.SHOW_TEXT:
                    controller = ($scope) => {

                        if ($scope.effect.height == null || $scope.effect.height < 1) {
                            $scope.effect.height = 200;
                        }

                        if ($scope.effect.width == null || $scope.effect.width < 1) {
                            $scope.effect.width = 400;
                        }

                        if ($scope.effect.justify == null) {
                            $scope.effect.justify = "center";
                        }

                        if ($scope.effect.dontWrap == null) {
                            $scope.effect.dontWrap = false;
                        }

                        $scope.editorOptions = {
                            height: 300,
                            disableDragAndDrop: true,
                            toolbar: [
                                ['style', ['bold', 'italic', 'underline', 'clear']],
                                ['fontname', ['fontname']],
                                ['fontsize', ['fontsize']],
                                ['color', ['color']],
                                ['para', ['ul', 'ol']],
                                ['misc', ['undo', 'redo', 'codeview']]
                            ],
                            fontSizes: ['8', '9', '10', '11', '12', '14', '18', '24', '36', '48', '64', '82', '150', '200', '250', '300']
                        };

                        $scope.showOverlayInfoModal = function(overlayInstance) {
                            utilityService.showOverlayInfoModal(overlayInstance);
                        };
                    };
                }

                return controller;
            };

            // This is an object that will get passed into the scope of every effect type template
            // containing common options that appear in more than one effect
            service.commonOptionsForEffectTypes = {
                chatters: ['Streamer', 'Bot']
            };

            // Generate the template file path based off of the effect type
            service.getTemplateFilePathForEffectType = function(effectType) {
                let normalizedEffectType = "";
                if (effectType != null) {
                    normalizedEffectType = effectType.toLowerCase().replace(/ /g, '-');
                } else {
                    normalizedEffectType = "no-effect-type-provided";
                }
                return './templates/interactive/effect-options/' + normalizedEffectType + '.html';
            };

            // This is used by effects that make use of lists of checkboxes. Returns and array of selected boxes.
            service.getCheckedBoxes = function (list, item) {
                let itemArray = list, itemIndex;
                if (list == null || list instanceof Array === false) {
                    itemArray = [];
                }

                try {
                    itemIndex = itemArray.indexOf(item);
                } catch (err) {
                    itemIndex = -1;
                }

                if (itemIndex !== -1) {
                    // Item exists, so we're unchecking it.
                    itemArray.splice(itemIndex, 1);
                } else {
                    // Item doesn't exist! Add it in.
                    itemArray.push(item);
                }

                // Set new scope var.
                return itemArray;
            };

            // This is used to check for an item in a saved array and returns true if it exists.
            service.checkSavedArray = function(list, item) {
                if (list != null) {
                    return list.indexOf(item) !== -1;
                }
                return false;

            };


            return service;
        });
}());
