"use strict";

(function() {
    angular.module("firebotApp").component("aboutModal", {
        template: `
            <style>
                #aboutModalHeaderDismissButton {
                    z-index: 10;
                }

                #aboutModalBody > section + section {
                    margin-top: 2em;
                }

                #aboutModalSocialButtons {
                    width: 150px;
                    margin: auto;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 28px;
                }

                #aboutModalSocialButtons .bluesky {
                    display: inline-block;
                    height: 27px;
                    width: 30px;
                    line-height: 28px;
                    background-color: #12d0ff;
                    mask-image: url('../images/icons/bluesky.png');
                    mask-position: center;
                    mask-size: 100% 100%;
                }

                h1 {
                    text-transform: capitalize;
                    font-weight: 900;
                    color: transparent;
                    font-family: "LEMONMILK-Bold", "Inter", sans-serif;
                    -webkit-background-clip: text;
                    background-clip: text;
                    background-image: linear-gradient(to right, #ebb11f, #FFCA05);
                }

                .about-version-list {
                    display: flex;
                    flex-direction: column;
                    width: 250px;
                    margin: auto;
                }

                .version-list-item {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                }

                .version-list-item > div:first-child {
                    font-weight: bold;
                }

                .version-list-item + .version-list-item {
                    margin-top: 10px;
                }
            </style>
            <div class="modal-header" style="text-align: center;">
                <button type="button" id="aboutModalHeaderDismissButton" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
            </div>
            <div id="aboutModalBody" class="modal-body" style="text-align: center; margin-top: -50px;">
                <section>
                    <a href ng-click="$root.openLinkExternally('https://firebot.app')"><img style="width: 165px;" src="../images/logo_transparent_2.png"></a>
                    <h1>Firebot</h1>
                </section>

                <section>
                    <h5><b>Connect With Us</b></h5>
                    <div id="aboutModalSocialButtons">
                        <a href ng-click="$root.openLinkExternally('https://discord.gg/crowbartools-372817064034959370')" title="Discord"><i class="fab fa-discord"></i></a>
                        <a href class="bluesky" ng-click="$root.openLinkExternally('https://bsky.app/profile/firebot.app')" title="Bluesky"></a>
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot')" title="GitHub"><i class="fab fa-github"></i></a>
                    </div>
                </section>

                <section>
                    <h5><b>Versions</b></h5>
                    <div class="about-version-list">
                        <div class="version-list-item">
                            <div>Firebot</div>
                            <div>{{$ctrl.version}}</div>
                        </div>
                        <div class="version-list-item">
                            <div>OS</div>
                            <div>{{$ctrl.osType}} {{$ctrl.osVersion}}</div>
                        </div>
                    </div>
                </section>

                <section>
                    <h5><b>License</b></h5>
                    <p>
                        Firebot is licensed under GPLv3<br/>
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot/blob/master/license.txt')">View License</a>
                    </p>
                </section>

                <section>
                    <h5><b>Support</b></h5>
                    <p>
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot/issues/new?assignees=&template=bug_report.yml')">Report a Bug</a> |
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot/issues/new?assignees=&template=feature_request.md')">Request a Feature</a> |
                        <a href ng-click="$root.openLinkExternally('https://opencollective.com/crowbartools')">Donate</a> |
                        <a href ng-click="$root.openLinkExternally('https://crowbar-tools.myspreadshop.com')">Merch Store</a> |
                        <a href ng-click="$root.openLinkExternally('https://firebot.app/testimonial-submission')">Submit a Testimonial</a>
                    </p>
                </section>
                <section>
                    <button class="btn btn-sm btn-default-outlined" style="width: 100%;" ng-click="$ctrl.copyDebugInfoToClipboard()">Copy Debug Info</button>
                </button>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function(backendCommunicator) {
            const $ctrl = this;

            $ctrl.$onInit = function() {
                $ctrl.version = firebotAppDetails.version;
                $ctrl.osType = firebotAppDetails.os.type;
                $ctrl.osVersion = firebotAppDetails.os.release;
            };

            $ctrl.copyDebugInfoToClipboard = function() {
                backendCommunicator.send("copy-debug-info-to-clipboard");
            };
        }
    });
}());
