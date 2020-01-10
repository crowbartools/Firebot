"use strict";

const moment = require("moment");

(function() {
    angular
        .module("firebotApp")
        .component("viewerDetailsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" style="font-size: 45px;font-weight: 100;position: absolute;top: 2px;right: 10px;" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
            </div>
            <div class="modal-body">              
                <div ng-show="$ctrl.loading">Loading...</div>
                <div ng-if="!$ctrl.loading">
                    <img ng-src="https://mixer.com/api/v1/users/{{$ctrl.viewerDetails.mixerData.id}}/avatar" 
                        style="width: 200px;height: 200px;border-radius: 200px;position: absolute;left: -50px;top: -50px;"/>
                    <div style="padding-left: 150px;min-height: 125px;">
                        <div style="display:flex;align-items: center;">
                            <div style="font-size:40px;font-weight: 200;">{{$ctrl.viewerDetails.mixerData.username}}</div>
                            <!--<div style="margin-left: 10px;font-size: 11px;background: #47aed2;border-radius: 16px;padding: 3px 10px;font-weight: bold;display: inline-block;height: max-content;">LVL {{$ctrl.viewerDetails.mixerData.level}}</div>-->
                        </div>
                        <div style="display:flex;margin-top:7px;">
                            <div style="margin-right: 15px;" uib-tooltip="Mixer Level"><strong>LVL</strong> {{$ctrl.viewerDetails.mixerData.level}}</div>
                            <div style="margin-right: 15px;display: flex;align-items: center;" uib-tooltip="Sparks"><img aria-label="spark" class="spark-coin" style="height: 14px;vertical-align: text-top;margin-right:2px;" src="https://mixer.com/_static/img/design/ui/spark-coin/spark-coin.svg"> {{$ctrl.viewerDetails.mixerData.sparks | commify}}</div>
                            <div style="margin-right: 15px;" uib-tooltip="Mixer Age"><i class="fas fa-user-circle"></i> {{$ctrl.getAccountAge($ctrl.viewerDetails.mixerData.createdAt)}}</div>
                        </div>
                        <div style="display:flex;margin-top:10px;">
                            <div ng-repeat="role in $ctrl.roles | orderBy : 'rank'" uib-tooltip="{{role.tooltip}}" ng-style="role.style" style="margin-right: 10px;font-size: 13px;text-transform: uppercase;font-weight: bold;font-family: "Roboto";">{{role.name}}</div>
                        </div>
                        <div style="display:flex;margin-top:10px;">
                            <div ng-repeat="action in $ctrl.actions" ng-click="action.onClick()" class="clickable" uib-tooltip="{{action.name}}" style="margin-right: 10px; display:flex; width: 30px; height:30px; align-items:center; justify-content: center; border-radius: 18px; border: 1.5px solid whitesmoke;">            
                                <i ng-class="action.icon"></i>
                            </div>
                        </div>             
                    </div>
                    <div style="margin-top: 45px;">
                        <div class="viewer-detail-data">
                            <div class="detail-data clickable" ng-repeat="dataPoint in $ctrl.dataPoints" ng-click="dataPoint.onClick()">
                                <div class="data-title">
                                    <i class="far" ng-class="dataPoint.icon"></i> {{dataPoint.name}}
                                </div>
                                <div class="data-point">{{dataPoint.display}}<span class="edit-data-btn muted"><i class="fas fa-edit"></i></span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer"></div>
            `,
            bindings: {
                resolve: "<",
                close: "&",
                dismiss: "&"
            },
            controller: function($q, backendCommunicator, viewersService, currencyService, utilityService) {
                let $ctrl = this;

                $ctrl.loading = true;

                $ctrl.viewerDetails = {};

                $ctrl.getAccountAge = function(date) {
                    return moment(date).fromNow(true);
                };

                $ctrl.roles = [];

                function mapMixerRole(rawRole) {
                    let mappedRole;
                    switch (rawRole) {
                    case "Staff":
                    case "Guardian":
                    case "GlobalMod":
                    case "Founder":
                        mappedRole = "Staff";
                        break;
                    case "VerifiedPartner":
                    case "Partner":
                        mappedRole = "Partner";
                        break;
                    default:
                        mappedRole = rawRole;
                    }
                    return mappedRole;
                }

                const bannedRole = {
                    name: "Banned",
                    style: {color: 'red'},
                    rank: -1
                };
                const modRole = {
                    name: "Moderator",
                    style: {color: '#37ED3B'},
                    rank: 6
                };

                function loadRoles() {
                    const mixerRoles = $ctrl.viewerDetails.mixerData.groups.map(g => g.name);

                    const relationshipData = $ctrl.viewerDetails.mixerData.relationship;
                    const channelRoles = relationshipData ? relationshipData.roles : [];

                    const userFollowsStreamer = relationshipData.follows != null;
                    let followDateDisplay = null;
                    if (userFollowsStreamer) {
                        let date = relationshipData.follows.createdAt;
                        followDateDisplay = moment(date).format("MM/DD/YYYY");
                    }

                    const combined = mixerRoles.concat(channelRoles).map(r => mapMixerRole(r));
                    const allRoles = [...new Set(combined)].filter(r => r !== "User");

                    let roles = [];
                    if (userFollowsStreamer) {
                        roles.push({
                            name: "Follower",
                            tooltip: followDateDisplay ? `Since ${followDateDisplay}` : undefined,
                            style: {color: '#47AED2'},
                            rank: 2
                        });
                    }
                    for (let role of allRoles) {
                        switch (role) {
                        case "Pro": {
                            roles.push({
                                name: "Pro",
                                style: {color: '#E175FF'},
                                rank: 3
                            });
                            continue;
                        }
                        case "Partner": {
                            roles.push({
                                name: "Partner",
                                style: {color: '#299FFF'},
                                rank: 5
                            });
                            continue;
                        }
                        case "Mod": {
                            roles.push(modRole);
                            continue;
                        }
                        case "ChannelEditor": {
                            roles.push({
                                name: "Channel Editor",
                                style: {color: '#C9CCDB'},
                                rank: 7
                            });
                            continue;
                        }
                        case "Subscriber": {
                            roles.push({
                                name: "Subscriber",
                                style: {color: '#C9CCDB'},
                                rank: 4
                            });
                            continue;
                        }
                        case "Staff": {
                            roles.push({
                                name: "Staff",
                                style: {color: '#ECBF37'},
                                rank: 8
                            });
                            continue;
                        }
                        case "Owner": {
                            roles.push({
                                name: "Channel Owner",
                                style: {color: 'white'},
                                rank: 0
                            });
                            continue;
                        }
                        case "Banned": {
                            roles.push(bannedRole);
                            continue;
                        }
                        }
                    }
                    $ctrl.roles = roles;
                }

                class ViewerAction {
                    constructor(id, value, nameFunc, iconFunc, actionfunc) {
                        this.id = id;
                        this.toggleValue = value;
                        this._nameFunc = nameFunc;
                        this._iconFunc = iconFunc;
                        this._actionFunc = actionfunc;
                        this.updateNameAndIcon();
                    }

                    updateNameAndIcon() {
                        this.name = this._nameFunc(this.toggleValue);
                        this.icon = this._iconFunc(this.toggleValue);
                    }

                    onClick() {
                        this.toggleValue = this._actionFunc(this.toggleValue);
                        this.updateNameAndIcon();
                    }
                }

                $ctrl.actions = [];


                function buildActions() {

                    const relationshipData = $ctrl.viewerDetails.mixerData.relationship;
                    const channelRoles = relationshipData ? relationshipData.roles : [];

                    if (channelRoles.includes("Owner")) return;

                    /**
                     * @type {Array.<ViewerAction>}
                     */
                    let actions = [];

                    /*const streamerFollowsUser = $ctrl.viewerDetails.streamerFollowsUser;
                    actions.push(new ViewerAction(
                        "follow",
                        streamerFollowsUser,
                        follows => {
                            return follows ? "Unfollow" : "Follow";
                        },
                        follows => {
                            return follows ? "fas fa-heart" : "fal fa-heart";
                        },
                        follows => {
                            return !follows;
                        }
                    )
                    );*/

                    const isMod = channelRoles.includes("Mod");
                    actions.push(new ViewerAction(
                        "mod",
                        isMod,
                        mod => {
                            return mod ? "Unmod" : "Mod";
                        },
                        mod => {
                            return mod ? "fas fa-user-minus" : "fal fa-user-plus";
                        },
                        mod => {
                            let newMod = !mod;
                            viewersService.updateViewerRole($ctrl.resolve.userId, "Mod", newMod);

                            if (newMod) {
                                $ctrl.roles.push(modRole);
                            } else {
                                $ctrl.roles = $ctrl.roles.filter(r => r.name !== "Moderator");
                            }

                            return newMod;
                        }
                    )
                    );

                    const isBanned = channelRoles.includes("Banned");
                    actions.push(new ViewerAction(
                        "ban",
                        isBanned,
                        banned => {
                            return banned ? "Unban" : "Ban";
                        },
                        banned => {
                            return banned ? "fas fa-ban" : "fal fa-ban";
                        },
                        banned => {
                            let newBanned = !banned;
                            viewersService.updateViewerRole($ctrl.resolve.userId, "Banned", newBanned);
                            if (newBanned) {
                                $ctrl.roles.push(bannedRole);
                            } else {
                                $ctrl.roles = $ctrl.roles.filter(r => r.name !== "Banned");
                            }
                            return newBanned;
                        }
                    )
                    );

                    $ctrl.actions = actions;
                }

                class ViewerDataPoint {
                    constructor(name, icon, value, displayFunc, fieldName, valueType, beforeEditFunc, afterEditFunc) {
                        this.name = name;
                        this.icon = icon;
                        this.value = value;
                        this._displayFunc = displayFunc;
                        this._fieldName = fieldName;
                        this._valueType = valueType;
                        this._beforeEditFunc = beforeEditFunc;
                        this._afterEditFunc = afterEditFunc;
                        this.display = this._displayFunc(this.value);
                    }

                    onClick() {
                        let valueToEdit = this._beforeEditFunc(this.value);

                        if (this._valueType === "text" || this._valueType === "number") {
                            utilityService.openGetInputModal(
                                {
                                    model: valueToEdit,
                                    label: "Edit " + this.name,
                                    saveText: "Save",
                                    inputPlaceholder: "Enter " + this.name.toLowerCase(),
                                    validationFn: (value) => {
                                        return new Promise(resolve => {
                                            if (typeof value === 'string') {
                                                if (value == null || value.trim().length < 1) {
                                                    return resolve(false);
                                                }
                                            }
                                            resolve(true);
                                        });
                                    },
                                    validationText: "Must have a value."

                                },
                                (editedValue) => {
                                    this.value = this._afterEditFunc(editedValue);
                                    this.display = this._displayFunc(this.value);
                                    this.saveValue();
                                }
                            );
                        } else if (this._valueType === "date") {
                            utilityService.openDateModal(
                                {
                                    model: valueToEdit,
                                    label: "Edit " + this.name,
                                    saveText: "Save",
                                    inputPlaceholder: "Enter " + this.name.toLowerCase()
                                },
                                (editedValue) => {
                                    this.value = this._afterEditFunc(editedValue);
                                    this.display = this._displayFunc(this.value);
                                    this.saveValue();
                                }
                            );
                        }
                    }

                    saveValue() {
                        backendCommunicator.fireEvent("updateViewerDataField", {
                            userId: $ctrl.resolve.userId,
                            field: this._fieldName,
                            value: this.value
                        });
                    }
                }

                $ctrl.dataPoints = [];
                function buildDataPoints() {
                    /**
                     * @type ViewerDataPoint[]
                     */
                    let dataPoints = [];

                    let joinDate = $ctrl.viewerDetails.firebotData.joinDate;
                    dataPoints.push(new ViewerDataPoint(
                        "Join Date",
                        "fa-sign-in",
                        joinDate,
                        value => {
                            return value ? moment(value).format("MM/DD/YYYY") : "Not saved";
                        },
                        "joinDate",
                        "date",
                        value => {
                            return value ? moment(value).toDate() : new Date();
                        },
                        value => {
                            return moment(value).valueOf();
                        }
                    ));

                    let lastSeen = $ctrl.viewerDetails.firebotData.lastSeen;
                    dataPoints.push(new ViewerDataPoint(
                        "Last Seen",
                        "fa-eye",
                        lastSeen,
                        value => {
                            return value ? moment(value).format("MM/DD/YYYY") : "Not saved";
                        },
                        "lastSeen",
                        "date",
                        value => {
                            return value ? moment(value).toDate() : new Date();
                        },
                        value => {
                            return moment(value).valueOf();
                        }
                    ));

                    let minsInChannel = $ctrl.viewerDetails.firebotData.minutesInChannel || 0;
                    dataPoints.push(new ViewerDataPoint(
                        "View Time",
                        "fa-tv",
                        minsInChannel,
                        value => {
                            return value < 60 ? 'Less than an hour' : Math.round(value / 60) + " hr(s)";
                        },
                        "minutesInChannel",
                        "number",
                        value => {
                            return value ? Math.round(value / 60) : 0;
                        },
                        value => {
                            let mins = parseInt(value) * 60;

                            return mins;
                        }
                    ));

                    let mixplayInteractions = $ctrl.viewerDetails.firebotData.mixplayInteractions || 0;
                    dataPoints.push(new ViewerDataPoint(
                        "MixPlay Interactions",
                        "fa-gamepad",
                        mixplayInteractions,
                        value => value,
                        "mixplayInteractions",
                        "number",
                        value => {
                            return value ? parseInt(value) : 0;
                        },
                        value => {
                            return value ? parseInt(value) : 0;
                        }
                    ));

                    let chatMessages = $ctrl.viewerDetails.firebotData.chatMessages || 0;
                    dataPoints.push(new ViewerDataPoint(
                        "Chat Messages",
                        "fa-comments",
                        chatMessages,
                        value => value,
                        "chatMessages",
                        "number",
                        value => {
                            return value ? parseInt(value) : 0;
                        },
                        value => {
                            return value ? parseInt(value) : 0;
                        }
                    ));

                    let currencies = currencyService.getCurrencies();

                    for (let currency of currencies) {
                        dataPoints.push(new ViewerDataPoint(
                            currency.name,
                            "fa-money-bill",
                            $ctrl.viewerDetails.firebotData.currency[currency.id] || 0,
                            value => value,
                            "currency." + currency.id,
                            "number",
                            value => {
                                return value ? parseInt(value) : 0;
                            },
                            value => {
                                return value ? parseInt(value) : 0;
                            }
                        ));
                    }

                    $ctrl.dataPoints = dataPoints;
                }

                $ctrl.$onInit = function() {
                    const userId = $ctrl.resolve.userId;

                    $q(resolve => {
                        backendCommunicator.fireEventAsync("getViewerDetails", userId)
                            .then(viewerDetails => {
                                resolve(viewerDetails);
                            });
                    }).then(viewerDetails => {
                        $ctrl.viewerDetails = viewerDetails;
                        loadRoles();
                        buildActions();
                        buildDataPoints();
                        $ctrl.loading = false;
                    });
                };
            }
        });
}());