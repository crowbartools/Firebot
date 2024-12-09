"use strict";

(function() {
    angular.module("firebotApp").component("aboutModal", {
        template: `
            <style>
                #aboutModalHeaderDismissButton {
                    z-index: 10;
                }

                #aboutModalBody > section:not(:first-child) {
                    margin-top: 1.5em;
                }

                #aboutModalSocialButtons > a:not(:first-child) {
                    margin-left: 1em;
                }
            </style>
            <div class="modal-header" style="text-align: center;">
                <button type="button" id="aboutModalHeaderDismissButton" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
            </div>
            <div id="aboutModalBody" class="modal-body" style="text-align: center; margin-top: -50px;">
                <section>
                    <a href ng-click="$root.openLinkExternally('https://firebot.app')"><img style="width: 160px; height: 160px" src="../images/logo_transparent.png"></a>
                </section>

                <section>
                    <h5><b>Connect With Us</b></h5>
                    <div id="aboutModalSocialButtons" style="font-size: 28px;">
                        <a href ng-click="$root.openLinkExternally('https://discord.gg/crowbartools-372817064034959370')" title="Discord"><i class="fab fa-discord"></i></a>
                        <a href ng-click="$root.openLinkExternally('https://bsky.app/profile/firebot.app')" title="Bluesky"><i class="fas fa-cloud"></i></a>
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot')" title="GitHub"><i class="fab fa-github"></i></a>
                    </div>
                </section>

                <section>
                    <h5><b>Versions</b></h5>
                    <p>
                        Firebot: {{$ctrl.version}}<br/>
                        OS: {{$ctrl.osType}} {{$ctrl.osVersion}}
                    </p>
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
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot/issues/new?assignees=&labels=Bug&template=bug_report.yml&title=%5BBug%5D+')">Report a Bug</a> |
                        <a href ng-click="$root.openLinkExternally('https://github.com/crowbartools/Firebot/issues/new?assignees=&labels=Enhancement&template=feature_request.md&title=%5BFeature+Request%5D+')">Request a Feature</a> |
                        <a href ng-click="$root.openLinkExternally('https://opencollective.com/crowbartools')">Donate</a> |
                        <a href ng-click="$root.openLinkExternally('https://crowbar-tools.myspreadshop.com')">Merch Store</a> |
                        <a href ng-click="$root.openLinkExternally('https://firebot.app/testimonial-submission')">Submit a Testimonial</a>
                    </p>
                </section>
            </div>
            `,
        bindings: {
            resolve: "<",
            close: "&",
            dismiss: "&"
        },
        controller: function() {
            const $ctrl = this;

            $ctrl.$onInit = function() {
                $ctrl.version = firebotAppDetails.version;
                $ctrl.osType = firebotAppDetails.os.type;
                $ctrl.osVersion = firebotAppDetails.os.release;
            };
        }
    });
}());
