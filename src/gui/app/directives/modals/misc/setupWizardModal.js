"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp").component("setupWizardModal", {
        template: `
        <div class="modal-header" style="text-align:center">
            <h3>{{$ctrl.getStepTitle()}}</h3>
        </div>
            <div class="modal-body" style="text-align:center">

                <div ng-switch="$ctrl.getCurrentStep()" class="slide-frame">

                    <div ng-switch-when="0" class="wave">
                        <div class="welcome-wrapper">
                            <h3 class="animated fadeIn">Welcome to</h3>
                            <img style="animation-delay: 0.5s" class="animated rollIn" src="../images/logo_transparent.png">
                        <span style="animation-delay: 1.3s" class="animated bounceIn">Firebot</span>
                        </div>
                        <div style="animation-delay: 2.0s" class="animated fadeIn welcome-subtitle">
                            <span>A Tool For Twitch Streamers</span>
                        </div>
                        <div style="animation-delay: 3.2s" class="animated fadeInUp">
                            <a class="btn btn-info hvr-icon-forward" ng-click="$ctrl.handleNext()">Get started <i class="fas fa-arrow-right hvr-icon"></i></a>
                        </div>
                    </div>

                    <div ng-switch-when="1" class="wave">
                        <div ng-hide="$ctrl.importStarted || $ctrl.importCompleted" style="display:flex; flex-direction:column; justify-content: space-between;">
                            <div>
                                <div>
                                    <p>We have detected Firebot v4 data on your computer.<br><strong>Would you like to import anything?</strong></p>

                                    <div class="muted" style="font-size:12px;padding: 0 65px;margin-top: 0px;">
                                        <strong>Please note:</strong><br>Due to some changes and fundamental differences in v5, we may not be able to import 100% of your v4 data. Some additional setup may be required.
                                    </div>
                                </div>
                                <div style="margin-top: 10px;">
                                    <div class="modal-subheader" style="padding: 0 0 10px 0; font-size: 17px;">
                                        IMPORT SETTINGS
                                    </div>
                                    <div style="text-align:left !important;display:flex; justify-content: center;">
                                        <div style="transform: translateX(40px);">
                                            <div style="margin-bottom: 3px">
                                                <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity:0.9;display:inline-block;"> Chat Commands
                                                    <input type="checkbox" ng-model="$ctrl.importSettings.commands">
                                                    <div class="control__indicator"></div>
                                                </label>
                                            </div>
                                            <div style="margin-bottom: 3px">
                                                <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity:0.9;display:inline-block;"> Events
                                                    <input type="checkbox" ng-model="$ctrl.importSettings.events">
                                                    <div class="control__indicator"></div>
                                                </label>
                                            </div>
                                            <div style="margin-bottom: 3px">
                                                <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity:0.9;display:inline-block;"> Viewer Groups
                                                    <input type="checkbox" ng-model="$ctrl.importSettings.viewerGroups">
                                                    <div class="control__indicator"></div>
                                                </label>
                                            </div>
                                            <div style="margin-bottom: 3px">
                                                <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity:0.9;display:inline-block;"> Hotkeys
                                                    <input type="checkbox" ng-model="$ctrl.importSettings.hotkeys">
                                                    <div class="control__indicator"></div>
                                                </label>
                                            </div>
                                            <div style="margin-bottom: 3px">
                                                <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 13px;opacity:0.9;display:inline-block;"> Extras <span class="muted">(Scripts/Fonts/Overlay Instances)</span>
                                                    <input type="checkbox" ng-model="$ctrl.importSettings.misc">
                                                    <div class="control__indicator"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-top: 10px;">
                                    <button class="btn btn-default" ng-click="$ctrl.startImport()" ng-disabled="!$ctrl.canStartImport()"><i class="fad fa-file-import"></i> Import</button>
                                </div>

                            </div>

                            <div style="margin-top: 15px;">
                                <div>
                                    <a class="btn btn-link" style="font-size: 17px;color: #5BC0DE;" ng-click="$ctrl.setCurrentStep(2)">No, don't import for now.</a>
                                </div>
                                <div>
                                    <span style="font-size: 11px; opacity: 0.8; margin-top: 3px;">(You can import later at any time by going to Settings > Open Setup Wizard)</span>
                                </div>
                            </div>
                        </div>

                        <div ng-show="$ctrl.importStarted && !$ctrl.importCompleted">
                            <h3>Importing...</h3>
                            <div style="font-size: 200px;">
                                <i class="fad fa-spinner fa-pulse"></i>
                            </div>
                            <p ng-show="$ctrl.currentlyImporting"><span style="font-weight: 100;">Currently Importing:</span> <strong>{{$ctrl.currentlyImporting}}</strong></h3>
                        </div>


                        <div ng-show="!$ctrl.importStarted && $ctrl.importCompleted">
                            <div style="font-size: 75px;color:green;line-height: 1;margin-bottom:20px">
                                <i class="fad fa-check-circle"></i>
                            </div>

                            <h3 style="margin-top:0;">V4 import completed successfully with <strong>{{$ctrl.importIncompatibilityMessages.length}}</strong> incompatibility warning(s)</h3>

                            <div style="height: 147px;">
                                <div ng-hide="$ctrl.importIncompatibilityMessages.length < 1">
                                    <eos-collapsable-panel show-label="Show incompatibility warnings" hide-label="Hide incompatibility warnings" hide-info-box="true">
                                        <div class="incompat-warnings-wrapper">
                                            <ul>
                                                <li ng-repeat="message in $ctrl.importIncompatibilityMessages track by $index">{{message}}</li>
                                            </ul>
                                        </div>
                                    </eos-collapsable-panel>
                                </div>
                             </div>

                            <p style="font-size: 18px;font-weight: 100;">You're nearly there! Just a few more steps to go.</p>
                            <button class="btn btn-info" ng-click="$ctrl.handleNext()">Continue</button>
                        </div>


                    </div>

                    <div ng-switch-when="2" class="wave">
                        <p>
                            Firebot supports two different accounts:</br></br>
                            <b>Streamer</b> - the account you stream with <span class="muted">(Required)</span></br>
                            <b>Bot</b> - a second account that can chat to your viewers  <span class="muted">(Optional)</span>
                        </p>
                        <div class="wizard-accounts-wrapper">
                            <div class="wizard-accounts-title">
                                Accounts
                            </div>
                            <table class="table">
                            <tbody>
                                <tr style="border-top: 2px solid #ddd;">
                                        <td class="wizard-accounts-td text-left">
                                            <b ng-show="$ctrl.cs.accounts.streamer.loggedIn" style="position: relative;">
                                                <span ng-if="$ctrl.cs.accounts.streamer.loggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn"></i></span>
                                                Streamer
                                            </b>
                                        </td>
                                        <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                            <div ng-show="$ctrl.cs.accounts.streamer.loggedIn" class="wizard-accounts-login-display">
                                                <img class="login-thumbnail" ng-show="$ctrl.cs.accounts.streamer.loggedIn" ng-class="$ctrl.cs.accounts.streamer.loggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{$ctrl.getAccountAvatar('streamer')}}">
                                                <div class="animated fadeIn">
                                                    {{$ctrl.cs.accounts.streamer.username}}
                                                </div>
                                            </div>
                                            <div ng-hide="$ctrl.cs.accounts.streamer.loggedIn">
                                                    <a class="clickable" ng-click="$ctrl.loginOrLogout('streamer')">+ Add <b>Streamer</b> Account</a><span style="color:red;">*</span>
                                            </div>
                                        </td>
                                        <td class="wizard-accounts-td text-right" class="animated fadeIn">
                                            <a ng-show="$ctrl.cs.accounts.streamer.loggedIn" class="clickable" ng-click="$ctrl.loginOrLogout('streamer')">Logout</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="wizard-accounts-td text-left">
                                            <b ng-show="$ctrl.cs.accounts.bot.loggedIn" style="position: relative;">
                                                <span ng-if="$ctrl.cs.accounts.bot.loggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn" style=""></i></span>
                                                Bot
                                            </b>
                                        </td>
                                        <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                            <div ng-show="$ctrl.cs.accounts.bot.loggedIn" class="wizard-accounts-login-display">
                                                <img class="login-thumbnail" ng-show="$ctrl.cs.accounts.bot.loggedIn" ng-class="$ctrl.cs.accounts.bot.loggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{$ctrl.getAccountAvatar('bot')}}">
                                                <div>
                                                    {{$ctrl.cs.accounts.bot.username}}
                                                </div>
                                            </div>
                                            <div ng-hide="$ctrl.cs.accounts.bot.loggedIn">
                                                    <a class="clickable" ng-click="$ctrl.loginOrLogout('bot')">+ Add <b>Bot</b> Account</a> <span class="muted" style="font-size:11px">Optional</span>
                                            </div>
                                        </td>
                                        <td class="wizard-accounts-td text-right">
                                            <a ng-show="$ctrl.cs.accounts.bot.loggedIn" class="clickable" ng-click="$ctrl.loginOrLogout('bot')">Logout</a>
                                        </td>
                                    </tr>
                            </tbody>
                        </table>
                            <span style="font-size: 12px; opacity: 0.8; margin-top: 3px;">Note: You can manage your logins in the upper-right corner of the app at any time.</span>
                        </div>
                    </div>

                    <div ng-switch-when="3" class="wave">

                        <p>The overlay is what allows Firebot to display images, videos, and more on your stream.</p>

                        <p>To setup the overlay, simply copy the path below and add it to the URL field of a new <b>Browser/Webpage Source</b> in your broadcasting software of choice.</p>

                        <div style="margin: 15px 0;display: flex;justify-content: center;">
                            <div class="input-group" style="width:75%;">
                                <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.overlayPath" disabled>
                                <span class="input-group-btn">
                                    <button class="btn btn-default" type="button" ng-click="$ctrl.copyOverlayPath()">Copy</button>
                                </span>
                            </div>
                        </div>

                        <p class="muted" style="font-size:12px;">Note: Do not check "Local File" and make sure the browser source fills your canvas (ie 1920x1080, 1280x720, etc)</Make>

                        <div style="display: flex; flex-direction: row; justify-content: space-around; width: 100%;">
                            <div class="connection-tile">
                                <span class="connection-title">Overlay Status</span>
                                <div class="overlay-button" ng-class="{ 'connected': $ctrl.getOverlayStatusId() == 1, 'warning': $ctrl.getOverlayStatusId() == 0,'disconnected': $ctrl.getOverlayStatusId() == -1  }">
                                    <i class="fal fa-tv-retro"></i>
                                </div>
                                <div style="text-align: center; font-size: 11px;" class="muted">{{ $ctrl.overlayConnectionMessage()}}</div>
                            </div>
                        </div>
                    </div>

                    <div ng-switch-when="4" class="wave">
                        <p>We love spotlighting the amazing interactive experiences<br />crafted by our community using Firebot.</p>
                        <p style="font-weight: 700;margin-top: 20px;">Would you like to be <a href="https:firebot.app/watch">featured on our website</a> during your live streams?</p>
                        <div style="margin-top: 20px;">
                            <label class="control-fb control--checkbox" style="margin-bottom: 0px; font-size: 16px;opacity:0.9;display:inline-block;"> Yes, feature my stream!
                                <input type="checkbox" ng-click="$ctrl.settings.setWebOnlineCheckin(!$ctrl.settings.getWebOnlineCheckin())" ng-checked="$ctrl.settings.getWebOnlineCheckin()" >
                                <div class="control__indicator"></div>
                            </label>
                        </div>
                        <div style="margin-top: 10px;">
                            <p class="muted" style="font-size: 12px; opacity: 0.8;">(This can be changed at any time in settings)</p>
                        </div>
                    </div>

                    <div ng-switch-when="5" class="slide-fade">
                        <div style="margin-top: 20px" class="animated fadeIn">
                            <img style="width: 80px; height: 80px" class="jump-infinite" src="../images/logo_transparent.png">
                        </div>
                        <h1 style="margin-top: 0px;animation-delay: 0.4s" class="animated bounceIn">You're all set!</h1>
                        <br>
                        <p style="animation-delay: 0.8s" class="animated fadeIn">
                            If you need help or have a suggestion, we'd love to hear from you.<br>Go to <b>Help</b> > <b>About</b> to see where you can find us.
                        </p>
                        <br>
                        <p style="animation-delay: 1.8s" class="animated fadeIn">
                            <b>Thank you for using Firebot.</b>
                        </p>
                        <div style="animation-delay: 2.3s" class="animated fadeIn">
                            <a style="margin-top: 5px;" class="btn btn-primary" ng-click="$ctrl.handleNext()">I'm so ready!</a>
                        </div>
                    </div>
                </div>

            </div>
            <div class="modal-footer"  style="min-height: 64px; text-align: center;">

                <div ng-if="$ctrl.isFirstStep()">
                    <span style="animation-delay: 3.3s;display: flex;flex-direction: row;justify-content: center;align-items: center;" class="animated fadeIn">
                        <a class="btn btn-link import-settings-btn" ng-click="$ctrl.startBackupRestoreProcess()">Restore from a backup</a>
                    </span>
                </div>

                <div>
                    <a class="btn btn-default hvr-icon-back" ng-click="$ctrl.handlePrevious()" ng-show="$ctrl.showBackButton()"><i class="fas fa-arrow-left hvr-icon"></i> Back</a>
                    <a
                        class="btn btn-primary hvr-icon-forward"
                        uib-tooltip="{{$ctrl.getTooltipText()}}"
                        tooltip-enable="!$ctrl.canGoToNext()"
                        ng-click="$ctrl.handleNext()"
                        ng-show="$ctrl.showNextButton()"
                        ng-disabled="!$ctrl.canGoToNext()">
                            {{$ctrl.getNextLabel()}}
                            <i class="fas fa-arrow-right hvr-icon"></i>
                    </a>
                </div>
                <div>
                    <a class="btn btn-link" style="font-size: 10px;" ng-click="$ctrl.handleNext(true)" ng-show="$ctrl.showNextButton() && !$ctrl.canGoToNext()">Skip for now</a>
                </div>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function($rootScope, connectionService, connectionManager,
            overlayUrlHelper, ngToast, backendCommunicator, backupService, settingsService) {
            const $ctrl = this;

            $ctrl.settings = settingsService;

            $ctrl.step = 0;

            $ctrl.stepTitles = [
                "",
                "Import V4 Data",
                "Get Signed In",
                "Lets Setup The Overlay",
                "Feature Your Stream",
                ""
            ];

            $ctrl.getAccountAvatar = connectionService.getAccountAvatar;

            $ctrl.isFirstStep = function() {
                return $ctrl.step === 0;
            };

            $ctrl.isLastStep = function() {
                return $ctrl.step === $ctrl.stepTitles.length - 1;
            };

            $ctrl.isCurrentStep = function(step) {
                return $ctrl.step === step;
            };

            $ctrl.setCurrentStep = function(step) {
                $ctrl.step = step;
            };

            $ctrl.getCurrentStep = function() {
                return $ctrl.step;
            };

            $ctrl.getStepTitle = function() {
                return $ctrl.stepTitles[$ctrl.step];
            };

            $ctrl.getNextLabel = function() {
                switch ($ctrl.step) {
                    default:
                        return "Next";
                }
            };

            $ctrl.handlePrevious = function() {
                switch ($ctrl.step) {
                    case 2:
                        $ctrl.step = 0;
                        break;
                    default:
                        $ctrl.step -= $ctrl.isFirstStep() ? 0 : 1;
                }
            };

            $ctrl.showNextButton = function() {
                if ($ctrl.isFirstStep() || $ctrl.isLastStep()) {
                    return false;
                }
                if ($ctrl.step === 1) {
                    return false;
                }
                return true;
            };

            $ctrl.showBackButton = function() {
                if ($ctrl.step === 1) {
                    return false;
                }
                return !($ctrl.isFirstStep() || $ctrl.isLastStep());
            };

            $ctrl.canGoToNext = function() {
                switch ($ctrl.step) {
                    case 2:
                        return connectionService.accounts.streamer.loggedIn;
                    case 3: {
                        const overlayStatus = connectionManager.getOverlayStatus();
                        return !overlayStatus.serverStarted || overlayStatus.clientsConnected;
                    }
                }
                return true;
            };

            $ctrl.v4DataDetected = false;
            backendCommunicator.fireEventAsync("v4-data-check")
                .then(detected => {
                    $ctrl.v4DataDetected = detected;
                });

            $ctrl.importSettings = {};

            $ctrl.canStartImport = () => {
                return $ctrl.importSettings.commands ||
                $ctrl.importSettings.events ||
                $ctrl.importSettings.viewerGroups ||
                $ctrl.importSettings.hotkeys ||
                $ctrl.importSettings.misc;
            };

            $ctrl.startImport = () => {
                if (!$ctrl.canStartImport()) {
                    return;
                }

                backendCommunicator.fireEvent("start-v4-import", $ctrl.importSettings);
            };

            $ctrl.importStarted = false;
            $ctrl.currentlyImporting = null;
            $ctrl.importCompleted = false;
            $ctrl.importSuccess = false;
            $ctrl.importIncompatibilityMessages = [];
            $ctrl.importIncompatibilityMessageText = "";

            backendCommunicator.on("v4-import-started", () => {
                $ctrl.importStarted = true;
            });

            backendCommunicator.on("v4-import-update", data => {
                $ctrl.currentlyImporting = data.importing;
            });

            backendCommunicator.on("v4-import-complete", data => {
                $ctrl.importCompleted = true;
                $ctrl.importStarted = false;
                $ctrl.importSuccess = data.success;
                $ctrl.importIncompatibilityMessages = data.incompatibilityWarnings;
            });

            $ctrl.handleNext = async function(forceNext) {
                if ($ctrl.isLastStep()) {
                    $ctrl.close();
                } else {
                    switch ($ctrl.step) {
                        case 0:
                            if ($ctrl.v4DataDetected) {
                                $ctrl.step = 1;
                            } else {
                                $ctrl.step = 2;
                            }
                            return;
                        case 1:
                            $ctrl.step = 2;
                            $ctrl.importCompleted = false;
                            return;
                        case 2:
                        case 3:
                        case 4: {
                            if (!$ctrl.canGoToNext() && !forceNext) {
                                return;
                            }

                            break;
                        }
                    }
                    $ctrl.step += 1;
                }
            };

            $ctrl.getTooltipText = function() {
                switch ($ctrl.step) {
                    case 2:
                        return "Please sign into your Streamer account.";
                    case 3:
                        return "Please add the overlay url to your broadcasting software.";
                }
                return "";
            };

            $ctrl.cs = connectionService;
            $ctrl.loginOrLogout = connectionService.loginOrLogout;

            $ctrl.overlayPath = overlayUrlHelper.getOverlayPath();

            $ctrl.copyOverlayPath = function() {
                $rootScope.copyTextToClipboard($ctrl.overlayPath);

                ngToast.create({
                    className: 'success',
                    content: 'Overlay path copied!'
                });
            };

            let overlayStatusId = 0;
            $ctrl.overlayConnectionMessage = function() {
                const connectionStatus = connectionManager
                    .getConnectionStatusForService("overlay");
                if (connectionStatus === "connected") {
                    overlayStatusId = 1;
                    return "Connected";
                } else if (connectionStatus === "warning") {
                    overlayStatusId = 0;
                    return "Ready, but nothing is connected at this time.";
                }
                overlayStatusId = -1;
                return "Error starting web server. App restart required.";
            };

            $ctrl.getOverlayStatusId = function() {
                return overlayStatusId;
            };

            $ctrl.startBackupRestoreProcess = () => {
                backupService.openBackupZipFilePicker()
                    .then(backupFilePath => {
                        if (backupFilePath != null) {
                            backupService.initiateBackupRestore(backupFilePath);
                        }
                    });
            };

            $ctrl.$onInit = function() {
                // When the component is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
            };
        }
    });
}());
