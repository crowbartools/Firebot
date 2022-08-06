"use strict";

const { getPathInTmpDir } = require("../../../common/data-access");
const { settings } = require("../../../common/settings-access");
const resourceTokenManager = require("../../../resourceTokenManager");
const webServer = require("../../../../server/http-server-manager");
const uuid = require("uuid/v4");
const fs = require('fs-extra');
const path = require("path");
const logger = require("../../../logwrapper");
const frontendCommunicator = require("../../../common/frontend-communicator");
const integrationManager = require("../../IntegrationManager");
const { EffectCategory } = require('../../../../shared/effect-constants');
const { wait } = require("../../../utility");
const { PollyClient, DescribeVoicesCommand, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');

frontendCommunicator.onAsync("getAwsPollyVoices", async () => {
    const response = {
        error: false,
        voices: []
    };
    const awsIntegration = integrationManager.getIntegrationDefinitionById("aws");

    if (awsIntegration && awsIntegration.userSettings) {
        if (awsIntegration.userSettings.iamCredentials.accessKeyId &&
            awsIntegration.userSettings.iamCredentials.secretAccessKey) {

            const polly = new PollyClient({
                credentials: {
                    accessKeyId: awsIntegration.userSettings.iamCredentials.accessKeyId,
                    secretAccessKey: awsIntegration.userSettings.iamCredentials.secretAccessKey
                },
                region: awsIntegration.userSettings.iamCredentials.region || 'us-east-1'
            });

            let describeVoicesResponse = null;

            do {
                try {
                    const describeVoicesCommand = new DescribeVoicesCommand({
                        NextToken: describeVoicesResponse ? describeVoicesResponse.NextToken : undefined
                    });
                    describeVoicesResponse = await polly.send(describeVoicesCommand);
                    response.voices = response.voices.concat(describeVoicesResponse.Voices);
                } catch (e) {
                    response.voices = [];
                    response.error = e;
                    describeVoicesResponse = null;
                    break;
                }
            }
            while (describeVoicesResponse && describeVoicesResponse.NextToken);
        } else {
            response.error = "NotConfigured";
        }
    } else {
        response.error = "NotConfigured";
    }

    return response;
});

const POLLY_TMP_DIR = getPathInTmpDir('/awspollyfx');

/**
 * The Play Sound effect
 */
const playSound = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "aws:polly",
        name: "Text-To-Speech (Amazon Polly)",
        description: "Have Firebot read out some text using Amazon Polly.",
        icon: "fad fa-microphone-alt",
        categories: [EffectCategory.FUN, EffectCategory.INTEGRATIONS],
        dependencies: []
    },
    /**
   * Global settings that will be available in the Settings tab
   */
    globalSettings: {},
    /**
   * The HTML template for the Options view (ie options when effect is added to something such as a button.
   * You can alternatively supply a url to a html file via optionTemplateUrl
   */
    optionsTemplate: `
    <div ng-hide="fetchError">
        <eos-container header="Engine">
            <div class="controls-fb-inline" style="padding-bottom: 5px;">
                <label class="control-fb control--radio">Neural
                    <input type="radio" ng-model="effect.engine" ng-change="ensureSelectedVoiceValid()" value="neural"/>
                    <div class="control__indicator"></div>
                </label>
                <label class="control-fb control--radio">Standard
                    <input type="radio" ng-model="effect.engine" ng-change="ensureSelectedVoiceValid()" value="standard"/>
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Text">
            <textarea ng-model="effect.text" class="form-control" name="text" placeholder="Enter text" rows="4" cols="40" replace-variables menu-position="under"></textarea>

            <div style="padding-top:10px">
                <label class="control-fb control--checkbox"> Enable
                    <a
                    ng-click="openLink('https://docs.aws.amazon.com/polly/latest/dg/supportedtags.html')"
                    class="clickable"
                    uib-tooltip="View SSML Documentation"
                    aria-label="View SSML Documentation"
                    tooltip-append-to-body="true">
                        SSML
                    </a>
                    <input type="checkbox" ng-model="effect.isSsml">
                    <div class="control__indicator"></div>
                </label>
            </div>
        </eos-container>

        <eos-container header="Voice" pad-top="true" ng-hide="isFetchingVoices">
            <div style="display: flex;">
                <div class="dropdown" style="margin-right: 1em">
                    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                        <span class="dropdown-text">{{ getSelectedLanguageName() }}</span>
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li ng-repeat="lang in validLanguages">
                            <a href ng-if="lang.SupportedEngines.indexOf(effect.engine) !== -1" ng-click="selectValidVoiceForLanguageCode(lang.LanguageCode)">{{ lang.LanguageFormattedName }}</a>
                        </li>
                    </ul>
                </div>
                <div class="dropdown">
                    <button class="btn btn-default dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                        <span class="dropdown-text">{{ getSelectedVoiceName() }}</span>
                        <span class="caret"></span>
                    </button>
                    <ul class="dropdown-menu">
                        <li ng-repeat="voice in validVoices">
                            <a href ng-if="voice.SupportedEngines.indexOf(effect.engine) !== -1 && voice.LanguageCode === getSelectedLanguageCode()" ng-click="effect.voiceId = voice.Id">{{ getVoiceDisplayName(voice) }}</a>
                        </li>
                    </ul>
                </div>
            </div>
        </eos-container>

        <eos-container header="Sound" pad-top="true">
            <label class="control-fb control--checkbox"> Wait for sound to finish <tooltip text="'Wait for the sound to finish before letting the next effect play.'"></tooltip>
                <input type="checkbox" ng-model="effect.waitForSound">
                <div class="control__indicator"></div>
            </label>
        </eos-container>

        <eos-container header="Volume" pad-top="true">
            <div class="volume-slider-wrapper">
                <i class="fal fa-volume-down volume-low"></i>
                <rzslider rz-slider-model="effect.volume" rz-slider-options="{floor: 1, ceil: 10, hideLimitLabels: true, showSelectionBar: true}"></rzslider>
                <i class="fal fa-volume-up volume-high"></i>
            </div>
        </eos-container>

        <eos-audio-output-device effect="effect" pad-top="true"></eos-audio-output-device>

        <eos-overlay-instance ng-if="effect.audioOutputDevice && effect.audioOutputDevice.deviceId === 'overlay'" effect="effect" pad-top="true"></eos-overlay-instance>
    </div>

    <div ng-hide="fetchError.$metadata.httpStatusCode !== 403">
        <eos-container>
            <span class="muted">Failed to authenticate to AWS. Make sure your AWS Credentials are properly configured. You can configure them in <b>Settings</b> > <b>Integrations</b> > <b>AWS</b>.</span>
        </eos-container>
    </div>

    <div ng-hide="fetchError === false || fetchError === 'NotConfigured' || fetchError.$metadata.httpStatusCode === 403">
        <eos-container>
            <span class="muted">An error as occured while trying to read the available voices from AWS. The error was: <b>{{ fetchError }}</b>. Please try again later.</span>
        </eos-container>
    </div>

    <div ng-hide="fetchError !== 'NotConfigured'">
        <eos-container>
            <span class="muted">Your AWS Credentials are not configured yet! You can configure them in <b>Settings</b> > <b>Integrations</b> > <b>AWS</b></span>
        </eos-container>
    </div>
    `,
    /**
   * The controller for the front end Options
   */
    optionsController: ($scope, $q, $rootScope, backendCommunicator) => {
        if ($scope.effect.engine == null) {
            $scope.effect.engine = "neural";
        }

        if ($scope.effect.volume == null) {
            $scope.effect.volume = 5;
        }

        $scope.isFetchingVoices = true;
        $scope.fetchError = false;

        $scope.validLanguages = [];
        $scope.validVoices = {};

        $scope.openLink = $rootScope.openLinkExternally;

        $scope.getSelectedLanguageCode = () => {
            const voiceId = $scope.effect.voiceId;

            if ($scope.validVoices[voiceId]) {
                return $scope.validVoices[voiceId].LanguageCode;
            }

            return "";
        };

        $scope.getSelectedLanguageName = () => {
            const voiceId = $scope.effect.voiceId;

            if ($scope.validVoices[voiceId]) {
                return $scope.validVoices[voiceId].LanguageFormattedName;
            }

            return "Invalid Locale";
        };

        $scope.getSelectedVoiceName = () => {
            const voiceId = $scope.effect.voiceId;

            if ($scope.validVoices[voiceId]) {
                return $scope.getVoiceDisplayName($scope.validVoices[voiceId]);
            }

            return "Invalid Voice";
        };

        $scope.getVoiceDisplayName = (voice) => {
            if (!voice) {
                return "Invalid Voice";
            }

            return `${voice.Id}, ${voice.Gender}`;
        };

        $scope.selectValidVoiceForLanguageCode = (langCode) => {
            const engine = $scope.effect.engine;

            let validVoiceId = undefined;
            const voices = Object.values($scope.validVoices);

            for (const voice of voices) {
                if (voice.LanguageCode !== langCode) {
                    continue;
                }

                if (voice.SupportedEngines.indexOf(engine) === -1) {
                    continue;
                }

                if (langCode === 'en-US') {
                    if (validVoiceId === undefined) {
                        validVoiceId = voice.Id;
                    } else if (voice.Id === 'Joanna') { // Special case for en-US as it is Amazon's Default
                        validVoiceId = voice.Id;
                        break;
                    }
                } else {
                    validVoiceId = voice.Id;
                    break;
                }
            }

            $scope.effect.voiceId = validVoiceId;
        };

        $scope.ensureSelectedVoiceValid = () => {
            const engine = $scope.effect.engine;
            const voiceId = $scope.effect.voiceId;

            if (!$scope.validVoices[voiceId] || $scope.validVoices[voiceId].SupportedEngines.indexOf(engine) === -1) {
                $scope.selectValidVoiceForLanguageCode('en-US');
                return;
            }
        };

        $q.when(backendCommunicator.fireEventAsync("getAwsPollyVoices"))
            .then(voices => {
                $scope.isFetchingVoices = false;

                const voicesArray = voices.voices;
                // Sort voices according to Amazon Logic
                const compareVoices = (a, b) => {
                    if (a.Gender < b.Gender) {
                        return -1;
                    }
                    if (a.Gender > b.Gender) {
                        return 1;
                    }
                    if (a.Id < b.Id) {
                        return -1;
                    }
                    if (a.Id > b.Id) {
                        return 1;
                    }
                    return 0;
                };

                voicesArray.sort(compareVoices);

                const formatLanguageName = (languageName) => {
                    if (!languageName) {
                        return languageName;
                    }

                    const nameParts = languageName.split(' ');
                    let reconstructedName = nameParts.pop();

                    if (nameParts.length > 0) {
                        reconstructedName += ",";
                        for (const part of nameParts) {
                            reconstructedName += ` ${part}`;
                        }
                    }

                    return reconstructedName;
                };

                const allVoices = {};
                for (const voice of voicesArray) {
                    voice.LanguageFormattedName = formatLanguageName(voice.LanguageName);
                    allVoices[voice.Id] = voice;
                }

                $scope.validVoices = allVoices;

                const localesObj = {};
                for (const voice of voicesArray) {
                    if (localesObj[voice.LanguageCode]) {
                        const localeObj = localesObj[voice.LanguageCode];

                        for (const engine of voice.SupportedEngines) {
                            if (localeObj.SupportedEngines.indexOf(engine) === -1) {
                                localeObj.SupportedEngines.push(engine);
                            }
                        }
                        continue;
                    }

                    localesObj[voice.LanguageCode] = {
                        LanguageCode: voice.LanguageCode,
                        LanguageName: voice.LanguageName,
                        LanguageFormattedName: voice.LanguageFormattedName,
                        SupportedEngines: voice.SupportedEngines
                    };
                }

                // Sort languages according to Amazon Logic
                const compareLocales = (a, b) => {
                    if (a.LanguageFormattedName < b.LanguageFormattedName) {
                        return -1;
                    }
                    if (a.LanguageFormattedName > b.LanguageFormattedName) {
                        return 1;
                    }
                    return 0;
                };

                const localesArray = Object.values(localesObj);
                localesArray.sort(compareLocales);

                $scope.validLanguages = localesArray;

                if ($scope.effect.voiceId == null) {
                    $scope.ensureSelectedVoiceValid();
                }

                if (voices.error) {
                    $scope.fetchError = voices.error;
                }
            });
    },
    /**
   * When the effect is saved
   */
    optionsValidator: effect => {
        const errors = [];

        if (effect.engine !== "standard" && effect.engine !== "neural") {
            errors.push("Please select a valid Polly engine.");
        }

        if (!effect.voiceId) {
            errors.push("Please select a valid Polly voice.");
        }

        if (effect.text == null || effect.text.length < 1) {
            errors.push("Please input some text.");
        }

        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: async event => {
        const effect = event.effect;

        const awsIntegration = integrationManager.getIntegrationDefinitionById("aws");

        if (!awsIntegration || !awsIntegration.userSettings ||
            !awsIntegration.userSettings.iamCredentials.accessKeyId ||
            !awsIntegration.userSettings.iamCredentials.secretAccessKey) {
            logger.error('AWS integration has not been configured. Unable to execute Amazon Polly effect.');
            return false;
        }

        const polly = new PollyClient({
            credentials: {
                accessKeyId: awsIntegration.userSettings.iamCredentials.accessKeyId,
                secretAccessKey: awsIntegration.userSettings.iamCredentials.secretAccessKey
            },
            region: awsIntegration.userSettings.iamCredentials.region || 'us-east-1'
        });

        const synthSpeechCommand = new SynthesizeSpeechCommand({
            Engine: effect.engine,
            OutputFormat: "mp3",
            Text: effect.text,
            TextType: effect.isSsml ? "ssml" : "text",
            VoiceId: effect.voiceId
        });

        let synthSpeedResponse = undefined;
        try {
            synthSpeedResponse = await polly.send(synthSpeechCommand);
        } catch (err) {
            logger.error("Unable to synthesize speech using Amazon Polly", err);
            return false;
        }

        let mp3Path = undefined;
        try {
            if (!(await fs.pathExists(POLLY_TMP_DIR))) {
                await fs.mkdirp(POLLY_TMP_DIR);
            }

            mp3Path = path.join(POLLY_TMP_DIR, `${uuid()}.mp3`);

            const destination = fs.createWriteStream(mp3Path);
            const stream = synthSpeedResponse.AudioStream.pipe(destination, { end: true });
            await new Promise(fulfill => stream.on("finish", fulfill));
        } catch (err) {
            logger.error("Unable to write synthesis stream to temporary file", err);
            return false;
        }

        const data = {
            filepath: mp3Path,
            volume: effect.volume,
            overlayInstance: effect.overlayInstance
        };

        // Set output device.
        let selectedOutputDevice = effect.audioOutputDevice;
        if (selectedOutputDevice == null || selectedOutputDevice.label === "App Default") {
            selectedOutputDevice = settings.getAudioOutputDevice();
        }
        data.audioOutputDevice = selectedOutputDevice;

        // Generate token if going to overlay, otherwise send to gui.
        if (selectedOutputDevice.deviceId === "overlay") {
            const resourceToken = resourceTokenManager.storeResourcePath(
                data.filepath,
                30
            );
            data.resourceToken = resourceToken;

            // send event to the overlay
            webServer.sendToOverlay("sound", data);
        } else {
            // Send data back to media.js in the gui.
            renderWindow.webContents.send("playsound", data);
        }

        try {
            const duration = await frontendCommunicator.fireEventAsync("getSoundDuration", {
                path: data.filepath
            });
            const durationInMils = (Math.round(duration) || 0) * 1000;
            const waitPromise = wait(durationInMils).then(async function () {
                await fs.unlink(data.filepath);
            });

            if (effect.waitForSound) {
                await waitPromise;
            }

            return true;
        } catch (error) {
            return true;
        }
    }
};

module.exports = playSound;
