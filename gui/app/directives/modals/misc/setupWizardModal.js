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
                            <b>Streamer</b> - the account you stream with.</br>
                            <b>Bot</b> - a second account that can chat to your viewers.
                        </p>
                        <p>
                            You will need to sign into at least your <b>Streamer</b> account to use Firebot's features.
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
                    </div>



                    <div ng-switch-when="3" class="wave">
                        <div style="margin-top: 20px">
                            <img style="width: 80px; height: 80px" class="jump-infinite" src="../images/logo_transparent.png">
                        </div>
                        <h1 style="margin-top: 0px;">You're all set!</h1>
                        <p>
                            If you need help or have a suggestion, we'd love to hear from you. Click the About link in the sidebar to see where you can find us.
                        </p>
                        <p>
                            Feel free to check out the <a href ng-click="$ctrl.openLinkExternally('https://github.com/Firebottle/Firebot/wiki/Getting-Started')">getting started guide</a> as well.
                        </p>
                        <p style="animation-delay: 7s" class="animated tada">
                            <b>Thank you for using Firebot!</b>
                        </p>
                        <a style="margin-top: 5px;" class="btn btn-primary shake-slow" ng-click="$ctrl.handleNext()">I'm so ready!</a> 
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
        controller: function(connectionService) {
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
                }
                return true;
            };

            $ctrl.handleNext = function(forceNext) {
                if ($ctrl.isLastStep()) {
                    $ctrl.close();
                } else {
                    switch ($ctrl.step) {
                    case 1:
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
                }
                return "";
            };

            $ctrl.streamerAccount = connectionService.accounts.streamer;
            $ctrl.botAccount = connectionService.accounts.bot;
            $ctrl.loginOrLogout = connectionService.loginOrLogout;

            $ctrl.$onInit = function() {
                // When the compontent is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
            };
        }
    });
}());
