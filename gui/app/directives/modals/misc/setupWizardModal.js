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
                            <span>A Tool For Mixer Streamers</span>
                        </div>
                        <div style="animation-delay: 3.2s" class="animated fadeInUp">
                            <a class="btn btn-info hvr-icon-forward " ng-click="$ctrl.setCurrentStep(1)">Get started <i class="fas fa-arrow-right hvr-icon"></i></a>
                        </div>
                    </div>

                    <div ng-switch-when="1" class="wave">
                        <p>
                            Firebot supports two different Mixer accounts:</br></br>
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
                                            <b ng-show="$ctrl.streamerAccount.isLoggedIn" style="position: relative;">
                                                <span ng-if="$ctrl.streamerAccount.isLoggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn"></i></span>
                                                Streamer
                                            </b>
                                        </td>
                                        <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                            <div ng-show="$ctrl.streamerAccount.isLoggedIn" class="wizard-accounts-login-display">
                                                <img class="login-thumbnail" ng-show="$ctrl.streamerAccount.isLoggedIn" ng-class="$ctrl.streamerAccount.isLoggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{$ctrl.streamerAccount.photoUrl}}">
                                                <div class="animated fadeIn">
                                                    {{$ctrl.streamerAccount.username}}
                                                </div>
                                            </div>
                                            <div ng-hide="$ctrl.streamerAccount.isLoggedIn">
                                                    <a class="clickable" ng-click="$ctrl.loginOrLogout('streamer')">+ Add <b>Streamer</b> Account</a><span style="color:red;">*</span>
                                            </div>
                                        </td>
                                        <td class="wizard-accounts-td text-right" class="animated fadeIn">
                                            <a ng-show="$ctrl.streamerAccount.isLoggedIn" class="clickable" ng-click="$ctrl.loginOrLogout('streamer')">Logout</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="wizard-accounts-td text-left">
                                            <b ng-show="$ctrl.botAccount.isLoggedIn" style="position: relative;">
                                                <span ng-if="$ctrl.botAccount.isLoggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn" style=""></i></span>
                                                Bot
                                            </b>
                                        </td>
                                        <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                            <div ng-show="$ctrl.botAccount.isLoggedIn" class="wizard-accounts-login-display">
                                                <img class="login-thumbnail" ng-show="$ctrl.botAccount.isLoggedIn" ng-class="$ctrl.botAccount.isLoggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{$ctrl.botAccount.photoUrl}}">
                                                <div>
                                                    {{$ctrl.botAccount.username}}
                                                </div>
                                            </div>
                                            <div ng-hide="$ctrl.botAccount.isLoggedIn">
                                                    <a class="clickable" ng-click="$ctrl.loginOrLogout('bot')">+ Add <b>Bot</b> Account</a> <span class="muted" style="font-size:11px">Optional</span>
                                            </div>
                                        </td>
                                        <td class="wizard-accounts-td text-right">
                                            <a ng-show="$ctrl.botAccount.isLoggedIn" class="clickable" ng-click="$ctrl.loginOrLogout('bot')">Logout</a>
                                        </td>
                                    </tr>
                            </tbody>
                        </table>
                            <span style="font-size: 12px; opacity: 0.8; margin-top: 3px;">Note: You can manage your logins in the upper-right corner of the app at any time.</span>
                        </div>	
                    </div>



                    <div ng-switch-when="2" class="wave">

                        <p>The overlay is what allows Firebot to display images, videos, and more on your stream.</p>

                        <p>To setup the overlay, simply copy the path below and add it to the URL field of a new <b>Browser/Webpage Source</b> in your broadcasting software of choice.</p>

                        <div style="margin: 15px 0;display: flex;justify-content: center;">
                            <div class="input-group" style="width:75%;">
                                <input type="text" class="form-control" style="cursor:text;" ng-model="$ctrl.overlayPath" disabled>
                                <span class="input-group-btn">
                                    <button class="btn btn-default" type="button" ng-click="$ctrl.copyOverlayPath()">Copy</button>
                                </span>
                            </div>
                            <p ng-if="$ctrl.overlayPathCopied" style="color: green;">
                                Overlay path copied!
                            </p>
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



                    <div ng-switch-when="3" class="slide-fade">
                        <div style="margin-top: 20px" class="animated fadeIn">
                            <img style="width: 80px; height: 80px" class="jump-infinite" src="../images/logo_transparent.png">
                        </div>
                        <h1 style="margin-top: 0px;animation-delay: 0.4s" class="animated bounceIn">You're all set!</h1>
                        <br>
                        <p style="animation-delay: 0.8s" class="animated fadeIn">
                            If you need help or have a suggestion, we'd love to hear from you.<br>Click the About link in the sidebar to see where you can find us.
                        </p>
                        <br>
                        <p style="animation-delay: 1.8s" class="animated fadeIn">
                            <b>Thank you for using Firebot.</b>
                        </p>
                        <div style="animation-delay: 2.3s" class="animated fadeIn">
                            <a style="margin-top: 5px;" class="btn btn-primary shake-slow" ng-click="$ctrl.handleNext()">I'm so ready!</a> 
                        </div>
                    </div>
                </div>
                
            </div>
            <div class="modal-footer"  style="min-height: 64px; text-align: center;">
                <div>
                    <a class="btn btn-default" ng-click="$ctrl.handlePrevious()" ng-show="$ctrl.showBackButton()">Back</a>
                    <a 
                        class="btn btn-primary"
                        uib-tooltip="{{$ctrl.getTooltipText()}}"
                        tooltip-enable="!$ctrl.canGoToNext()" 
                        ng-click="$ctrl.handleNext()" 
                        ng-show="$ctrl.showNextButton()" 
                        ng-disabled="!$ctrl.canGoToNext()">
                            {{$ctrl.getNextLabel()}}
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
            overlayUrlHelper) {
            let $ctrl = this;

            $ctrl.step = 0;

            $ctrl.stepTitles = [
                "",
                "Get Signed In",
                "Lets Setup The Overlay",
                ""
            ];

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
                default:
                    $ctrl.step -= $ctrl.isFirstStep() ? 0 : 1;
                }
            };

            $ctrl.showNextButton = function() {
                if ($ctrl.isFirstStep() || $ctrl.isLastStep()) {
                    return false;
                }
                return true;
            };

            $ctrl.showBackButton = function() {
                return !($ctrl.isFirstStep() || $ctrl.isLastStep());
            };

            $ctrl.canGoToNext = function() {
                switch ($ctrl.step) {
                case 1:
                    return connectionService.accounts.streamer.isLoggedIn;
                case 2: {
                    let overlayStatus = connectionManager.getOverlayStatus();
                    return !overlayStatus.serverStarted || overlayStatus.clientsConnected;
                }
                }
                return true;
            };

            $ctrl.handleNext = function(forceNext) {
                if ($ctrl.isLastStep()) {
                    $ctrl.close();
                } else {
                    switch ($ctrl.step) {
                    case 1:
                    case 2:
                        if (!$ctrl.canGoToNext() && !forceNext) return;
                        break;
                    }
                    $ctrl.step += 1;
                }
            };

            $ctrl.getTooltipText = function() {
                switch ($ctrl.step) {
                case 1:
                    return "Please sign into your Streamer account.";
                case 2:
                    return "Please add the overlay url to your broadcasting software.";
                }
                return "";
            };

            $ctrl.streamerAccount = connectionService.accounts.streamer;
            $ctrl.botAccount = connectionService.accounts.bot;
            $ctrl.loginOrLogout = connectionService.loginOrLogout;

            $ctrl.overlayPath = overlayUrlHelper.getOverlayPath();
            $ctrl.overlayPathCopied = false;
            $ctrl.copyOverlayPath = function() {
                $rootScope.copyTextToClipboard($ctrl.overlayPath);
                $ctrl.overlayPathCopied = true;
            };

            let overlayStatusId = 0;
            $ctrl.overlayConnectionMessage = function() {
                let connectionStatus = connectionManager
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

            $ctrl.$onInit = function() {
                // When the compontent is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
            };
        }
    });
}());
