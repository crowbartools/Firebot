"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
    angular.module("firebotApp").component("setupWizardModal", {
        template: `
            <div class="modal-header">
            </div>
            <div class="modal-body" style="text-align:center">

                <div ng-switch="$ctrl.getCurrentStep()" class="slide-frame"> 
                    
                
                    <div ng-switch-when="1" class="wave">
                        <div class="welcome-wrapper">
                            <h3 class="animated fadeIn">Welcome to</h3>
                            <img style="animation-delay: 0.5s" class="animated rollIn" src="../images/logo_transparent.png">      
                        <span style="animation-delay: 1.3s" class="animated bounceIn">Firebot</span>
                        </div>
                        <div style="animation-delay: 2.0s" class="animated fadeIn welcome-subtitle">
                            <span>A Tool For Mixer Streamers</span>
                        </div>
                        <div style="animation-delay: 3.2s" class="animated fadeInUp">
                            <a class="btn btn-info hvr-icon-forward " ng-click="$ctrl.setCurrentStep(2)">Get started <i class="fas fa-arrow-right hvr-icon"></i></a>
                        </div>
                    </div>

                    <!--<div ng-switch-when="2" class="wave">
                        <p>
                            Firebot supports two different Mixer accounts:</br>
                            - <b>Streamer</b>: the account you stream with.</br>
                            - <b>Bot</b>: a second account that can chat to your viewers.
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
                                                <b ng-show="streamerAccount.isLoggedIn" style="position: relative;">
                                                    <span ng-if="streamerAccount.isLoggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn"></i></span>
                                                    Streamer
                                                </b>
                                            </td>
                                    <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                                <div ng-show="streamerAccount.isLoggedIn" class="wizard-accounts-login-display">
                                                    <img class="login-thumbnail" ng-show="streamerAccount.isLoggedIn" ng-class="streamerAccount.isLoggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{streamerAccount.photoUrl}}">
                                                    <div class="animated fadeIn">
                                                        {{streamerAccount.username}}
                                                    </div>
                                                </div>
                                                <div ng-hide="streamerAccount.isLoggedIn">
                                                        <a class="clickable" ng-click="loginOrLogout('streamer')">+ Add <b>Streamer</b> Account</a><span style="color:red;">*</span>
                                                </div>
                                            </td>
                                    <td class="wizard-accounts-td text-right" class="animated fadeIn">
                                                <a ng-show="streamerAccount.isLoggedIn" class="clickable" ng-click="loginOrLogout('streamer')">Logout</a>
                                            </td>
                                </tr>
                                    <tr>
                                        <td class="wizard-accounts-td text-left">
                                            <b ng-show="botAccount.isLoggedIn" style="position: relative;">
                                                <span ng-if="botAccount.isLoggedIn" class="wizard-account-checkmark"><i class="fas fa-check-circle animated bounceIn" style=""></i></span>
                                                Bot
                                            </b>
                                        </td>
                                        <td class="wizard-accounts-td" style="width: 50%; height: 50px;text-align: center;">
                                            <div ng-show="botAccount.isLoggedIn" class="wizard-accounts-login-display">
                                                <img class="login-thumbnail" ng-show="botAccount.isLoggedIn" ng-class="botAccount.isLoggedIn ? 'animated flipInX' : ''" style="height: 34px; width: 34px;" ng-src="{{botAccount.photoUrl}}">
                                                <div>
                                                    {{botAccount.username}}
                                                </div>
                                            </div>
                                            <div ng-hide="botAccount.isLoggedIn">
                                                    <a class="clickable" ng-click="loginOrLogout('bot')">+ Add <b>Bot</b> Account</a> <span class="muted" style="font-size:11px">Optional</span>
                                            </div>
                                        </td>
                                <td class="wizard-accounts-td text-right">
                                            <a ng-show="botAccount.isLoggedIn" class="clickable" ng-click="loginOrLogout('bot')">Logout</a>
                                        </td>
                                    </tr>
                            </tbody>
                        </table>
                            <span style="font-size: 12px; opacity: 0.8; margin-top: 3px;">Note: You can manage your logins in the upper-right corner of the app at any time.</span>
                        </div>	
                    </div>-->

                    
                </div>
                
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" ng-click="$ctrl.close()">Close</button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function() {
            let $ctrl = this;

            let currentStep = 1;

            $ctrl.getCurrentStep = function() {
                return currentStep;
            };

            $ctrl.setCurrentStep = function(step) {
                currentStep = step;
            };

            $ctrl.$onInit = function() {
                // When the compontent is initialized
                // This is where you can start to access bindings, such as variables stored in 'resolve'
                // IE $ctrl.resolve.shouldDelete or whatever
            };
        }
    });
}());
