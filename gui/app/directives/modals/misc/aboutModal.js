'use strict';

(function() {
    angular
        .module('firebotApp')
        .component("aboutModal", {
            template: `
            <div class="modal-header" style="text-align: center;">
                <button type="button" class="close" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
                <h4 class="modal-title">About Firebot</h4>
            </div>
            <div class="modal-body" style="text-align: center;">
                <h5><b>Version</b></h5>
                <p>{{$ctrl.version}}</p>

                <h5><b>Source</b></h5>
                <p><a href ng-click="$root.openLinkExternally('https://github.com/Firebottle/Firebot')">GitHub</a></p>

                <h5><b>Support</b></h5> 
                <span>Experiencing a problem or have a suggestion?</span></br>
                <p> Visit our <a href ng-click="$root.openLinkExternally('https://github.com/Firebottle/Firebot/issues')">Issues page</a> or come chat with us in the <i>#firebot</i> channels of our <a href ng-click="$root.openLinkExternally('https://discord.gg/tTmMbrG')">Discord server</a>.</p>

                <h5><b>Team Crowbar</b></h5> 
                <div>
                    <div uib-tooltip="The Boss">Firebottle</div>
                    <div uib-tooltip="The Optimizer">ebiggz</div>
                    <div uib-tooltip="The Video Guy">ThePerry</div>
                </div>

                <h5><b>Contributors</b></h5> 
                <div>
                    <div>Skriglitz</div>
                    <div>DragynsLair</div>
                    <div uib-tooltip="The Mature One">Kateract</div>    
                    <div uib-tooltip="The Professor">Nitrocell</div>
                    <div>ebrayton</div>
                </div>
            </div>
            `,
            bindings: {
                resolve: '<',
                close: '&',
                dismiss: '&'
            },
            controller: function() {
                let $ctrl = this;

                $ctrl.$onInit = function () {
                    $ctrl.version = electron.remote.app.getVersion();
                };
            }
        });
}());
