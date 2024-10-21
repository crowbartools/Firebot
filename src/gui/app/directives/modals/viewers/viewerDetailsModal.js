"use strict";
(function() {
    const moment = require("moment");
    moment.locale(firebotAppDetails.locale);

    angular
        .module("firebotApp")
        .component("viewerDetailsModal", {
            template: `
            <div class="modal-header">
                <button type="button" class="close" style="font-size: 45px;font-weight: 100;position: absolute;top: 2px;right: 10px;z-index: 100000;" ng-click="$ctrl.dismiss()"><span>&times;</span></button>
            </div>
            <div class="modal-body">
                <div ng-show="$ctrl.loading" style="height: 464px;display: flex;align-items: center;justify-content: center;">
                    <div class="bubble-spinner">
                        <div class="bounce1"></div>
                        <div class="bounce2"></div>
                        <div class="bounce3"></div>
                    </div>
                </div>
                <div ng-if="!$ctrl.loading">
                    <img ng-src="{{ $ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData ? $ctrl.viewerDetails.twitchData.profilePicUrl : '../images/placeholders/default-profile-pic.png'}}"
                        style="width: 200px;height: 200px;border-radius: 200px;position: absolute;left: -50px;top: -50px;"/>
                    <div style="padding-left: 150px;min-height: 125px;">
                        <div style="display:flex;align-items: center;">
                            <div style="font-size:40px;font-weight: 200;">{{$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData ? $ctrl.viewerDetails.twitchData.displayName : $ctrl.viewerDetails.firebotData.username }}</div>
                            <a
                                ng-if="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData"
                                ng-click="$ctrl.openLink('https://twitch.tv/' + $ctrl.viewerDetails.twitchData.username)"
                                class="clickable"
                                style="line-height: 1;margin-left: 5px;background: #9147FF;padding: 5px;border-radius: 100%;color: white;font-size: 15px;"
                                uib-tooltip="View Twitch Profile"
                                aria-label="View Twitch Profile"
                                tooltip-append-to-body="true">
                                    <i class="fab fa-twitch" style="transform: translateY(2px);" />
                            </a>
                            <a
                                ng-if="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData && $ctrl.accountAccess.accounts.streamer.loggedIn === true"
                                ng-click="$ctrl.openLink('https://www.twitch.tv/popout/' + $ctrl.accountAccess.accounts.streamer.username + '/viewercard/' + $ctrl.viewerDetails.twitchData.username + '/?popout=')"
                                class="clickable"
                                style="line-height: 1;margin-left: 5px;background: #9147FF;padding: 5px;border-radius: 100%;color: white;font-size: 15px;"
                                uib-tooltip="Open Twitch Viewer Card"
                                aria-label="Open Twitch Viewer Card"
                                tooltip-append-to-body="true">
                                    <i class="fas fa-address-card" style="transform: translateY(1px);" />
                            </a>
                        </div>
                        <div ng-show="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData && $ctrl.viewerDetails.twitchData.username.toLowerCase() !== $ctrl.viewerDetails.twitchData.displayName.toLowerCase()" style="display:flex;">
                            <div style="margin-right: 11px; font-size: 20px;" class="muted">{{$ctrl.viewerDetails.twitchData.username}}</div>
                        </div>
                        <div ng-show="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData" style="display:flex;margin-top:10px;">
                            <div style="margin-right: 11px;" uib-tooltip="Twitch Age"><i class="fas fa-user-circle"></i> {{$ctrl.getAccountAge($ctrl.viewerDetails.twitchData.creationDate)}}</div>
                        </div>
                        <div ng-show="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData" style="display:flex;margin-top:10px;">
                            <div ng-repeat="role in $ctrl.roles | orderBy : 'rank'" uib-tooltip="{{role.tooltip}}" ng-style="role.style" style="margin-right: 10px;font-size: 13px;text-transform: uppercase;font-weight: bold;font-family: "Roboto";">{{role.name}}</div>
                        </div>
                        <div ng-show="$ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData" style="display:flex;margin-top:10px;">
                            <div ng-repeat="action in $ctrl.actions" ng-click="action.onClick()" class="clickable" aria-label="{{action.name}}" uib-tooltip="{{action.name}}" style="margin-right: 10px; display:flex; width: 30px; height:30px; align-items:center; justify-content: center; border-radius: 18px; border: 1.5px solid whitesmoke;">
                                <i ng-class="action.icon"></i>
                            </div>
                        </div>
                    </div>

                    <div ng-if="$ctrl.viewerDbEnabled" style="margin-top: 45px;margin-left: 10px;">
                        <div style="display:flex;margin-bottom:5px;">
                            <div style="font-size:13px;font-weight: bold;opacity:0.9;">FIREBOT DATA</div>
                            <span ng-show="$ctrl.hasFirebotData" ng-click="$ctrl.removeViewer()" style="color:#f96f6f;margin-left: 10px;font-size:12px;" class="clickable" uib-tooltip="Remove this viewer's Firebot data" aria-label="Remove viewer's firebot data"><i class="far fa-trash-alt"></i></span>
                        </div>

                        <div class="viewer-detail-data" ng-show="$ctrl.hasFirebotData" style="margin-top: 10px;">
                            <div
                                ng-repeat="dataPoint in $ctrl.dataPoints"
                                ng-click="dataPoint.canEdit ? dataPoint.onClick() : undefined"
                                class="detail-data"
                                ng-class="{ clickable: dataPoint.canEdit }"
                                aria-label="Edit {{dataPoint.name}}"
                                uib-tooltip="{{dataPoint.tooltip}}"
                                tooltip-enable="dataPoint.tooltip"
                                tooltip-append-to-body="true"
                            >
                                <div class="data-title">
                                    <i class="far" ng-class="dataPoint.icon"></i> {{dataPoint.name}}
                                </div>
                                <div class="data-point">{{dataPoint.display}}<span class="edit-data-btn muted" ng-show="dataPoint.canEdit"><i class="fas fa-edit"></i></span></div>
                            </div>
                        </div>

                        <div ng-show="$ctrl.hasFirebotData" style="margin-top:20px; margin-bottom: 30px;">
                            <label class="control-fb control--checkbox"> Disable automatic stat accrual <tooltip text="'Prevent this user from getting currency payouts, view time hours, and other stats automatically incremented. You will still be able to manually edit these values.'"></tooltip>
                                <input type="checkbox" ng-model="$ctrl.viewerDetails.firebotData.disableAutoStatAccrual" ng-change="$ctrl.disableAutoStatAccuralChange()">
                                <div class="control__indicator"></div>
                            </label>
                        </div>

                        <div ng-show="$ctrl.hasFirebotData" style="margin-top:20px; margin-bottom: 30px;">
                            <label class="control-fb control--checkbox"> Don't allow on active user lists <tooltip text="'Prevent the user from showing up in active user lists, such as the $randomActiveViewer variable.'"></tooltip>
                                <input type="checkbox" ng-model="$ctrl.viewerDetails.firebotData.disableActiveUserList" ng-change="$ctrl.disableActiveUserListChange()">
                                <div class="control__indicator"></div>
                            </label>
                        </div>

                        <div ng-show="$ctrl.hasFirebotData" style="margin-top:20px; margin-bottom: 30px;">
                            <label class="control-fb control--checkbox"> Don't show in viewer list <tooltip text="'Prevent the user from showing up in the viewer list next to chat.'"></tooltip>
                                <input type="checkbox" ng-model="$ctrl.viewerDetails.firebotData.disableViewerList" ng-change="$ctrl.disableViewerListChange()">
                                <div class="control__indicator"></div>
                            </label>
                        </div>

                        <div ng-hide="$ctrl.hasFirebotData" style="padding: left: 15px;">
                            <p class="muted">There is no Firebot data saved for this Twitch user.</p>
                            <button type="button" class="btn btn-default" ng-click="$ctrl.saveUser()">Save User in Firebot</button>
                        </div>
                    </div>

                    <div ng-if="$ctrl.hasFirebotData && $ctrl.viewerDetails.firebotData.metadata" style="margin: 20px 10px;">
                        <div style="font-size:13px;font-weight: bold;opacity:0.9;margin-bottom:5px;">METADATA</div>
                        <div style="margin-top: 10px" ng-show="$ctrl.userHasMetadata()">
                            <table class="fb-table-alt" style="width:100%;">
                                <thead>
                                    <tr style="font-size: 11px;">
                                        <th class="not-clickable">Key</th>
                                        <th class="not-clickable">Data</th>
                                        <th style="width: 70px;"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="viewer-row" ng-repeat="(key, value) in $ctrl.viewerDetails.firebotData.metadata">
                                        <td>
                                            {{key}}
                                        </td>
                                        <td class="ellipsis">
                                            <span>{{value}}</span>
                                        </td>
                                        <td style="display:flex; align-items: center; justify-content: flex-end;">
                                            <i
                                                class="fal fa-edit clickable"
                                                style="margin-right: 10px;"
                                                ng-click="$ctrl.showAddOrEditMetadataModal({ key: key, value: value })"
                                                uib-tooltip="Edit"
                                                tooltip-append-to-body="true">
                                            </i>
                                            <i
                                                class="fal fa-trash-alt clickable"
                                                style="color:#ff3737;"
                                                ng-click="$ctrl.deleteMetadata(key)"
                                                uib-tooltip="Delete"
                                                tooltip-append-to-body="true">
                                            </i>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="role-bar clickable" style="margin-top: 5px;" ng-click="$ctrl.showAddOrEditMetadataModal()" uib-tooltip="Add metadata" tooltip-append-to-body="true">
                            <i class="far fa-plus"></i>
                        </div>
                    </div>

                    <div style="margin: 10px 10px 0;" ng-show="$ctrl.hasCustomRoles && $ctrl.viewerDetails.twitchData != null">
                        <div style="font-size:13px;font-weight: bold;opacity:0.9;margin-bottom:5px;">CUSTOM ROLES</div>
                        <div class="role-bar" ng-repeat="customRole in $ctrl.customRoles track by customRole.id">
                            <span>{{customRole.name}}</span>
                            <span class="clickable" style="padding-left: 10px;" ng-click="$ctrl.removeViewerFromRole(customRole.id, customRole.name)" uib-tooltip="Remove role" tooltip-append-to-body="true">
                                <i class="far fa-times"></i>
                            </span>
                        </div>
                        <div class="role-bar clickable" ng-if="$ctrl.hasCustomRolesAvailable" ng-click="$ctrl.openAddCustomRoleModal()" uib-tooltip="Add role" tooltip-append-to-body="true">
                            <i class="far fa-plus"></i>
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
            controller: function($rootScope, $q, backendCommunicator, viewersService, currencyService,
                utilityService, viewerRolesService, connectionService, settingsService, accountAccess,
                viewerRanksService
            ) {
                const $ctrl = this;

                $ctrl.loading = true;

                $ctrl.openLink = $rootScope.openLinkExternally;

                $ctrl.viewerDetails = {};

                $ctrl.hasFirebotData = false;

                $ctrl.viewerDbEnabled = settingsService.getViewerDB();

                $ctrl.accountAccess = accountAccess;

                $ctrl.viewerRanksService = viewerRanksService;

                $ctrl.viewerRankData = {};

                $ctrl.rankLadderMap = viewerRanksService.rankLadders.reduce((acc, ladder) => {
                    const rankMap = ladder.ranks.reduce((acc, rank) => {
                        acc[rank.id] = rank.name;
                        return acc;
                    }, {});
                    acc[ladder.id] = {
                        name: ladder.name,
                        ranks: rankMap
                    };
                    return acc;
                }, {});


                $ctrl.getAccountAge = function(date) {
                    return moment(date).fromNow(true);
                };

                $ctrl.showAddOrEditMetadataModal = (metadata) => {
                    utilityService.showModal({
                        component: "addOrEditMetadataModal",
                        size: "sm",
                        resolveObj: {
                            metadata: () => metadata
                        },
                        closeCallback: ({ key, value }) => {

                            try {
                                value = JSON.parse(value);
                            } catch (error) { /* silently fail */ }

                            backendCommunicator.fireEvent("update-viewer-metadata", {
                                username: $ctrl.viewerDetails.firebotData.username,
                                key,
                                value
                            });

                            $ctrl.viewerDetails.firebotData.metadata[key] = value;
                        }
                    });
                };

                $ctrl.deleteMetadata = (key) => {

                    utilityService.showConfirmationModal({
                        title: "Delete Metadata",
                        question: `Are you sure you want to delete the metadata "${key}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    }).then((confirmed) => {
                        if (confirmed) {
                            backendCommunicator.fireEvent("delete-viewer-metadata", {
                                username: $ctrl.viewerDetails.firebotData.username,
                                key
                            });

                            delete $ctrl.viewerDetails.firebotData.metadata[key];
                        }
                    });
                };

                $ctrl.userHasMetadata = () => !!Object.keys($ctrl.viewerDetails.firebotData.metadata || {}).length;

                $ctrl.channelProgressionImgSrc = "";

                $ctrl.roles = [];

                const bannedRole = {
                    name: "Banned",
                    style: {color: 'red'},
                    rank: -1
                };
                const modRole = {
                    name: "Moderator",
                    style: {color: '#37ED3B'},
                    rank: 3
                };

                function loadRoles() {
                    const twitchRoles = $ctrl.viewerDetails.twitchData.userRoles;
                    const teamRoles = $ctrl.viewerDetails.twitchData.teamRoles;

                    const userFollowsStreamer = $ctrl.viewerDetails.userFollowsStreamer;
                    let followDateDisplay;
                    if (userFollowsStreamer) {
                        followDateDisplay = moment($ctrl.viewerDetails.twitchData.followDate).format("L");
                    }

                    const roles = [];
                    if (userFollowsStreamer) {
                        roles.push({
                            name: "Follower",
                            tooltip: followDateDisplay ? `Since ${followDateDisplay}` : undefined,
                            style: {color: '#47AED2'},
                            rank: 2
                        });
                    }
                    if ($ctrl.viewerDetails.twitchData.isBanned) {
                        roles.push(bannedRole);
                    }
                    for (const role of twitchRoles) {
                        switch (role) {
                            case "vip":
                                roles.push({
                                    name: "VIP",
                                    style: {color: '#E175FF'},
                                    rank: 4
                                });
                                continue;
                            case "mod":
                                roles.push(modRole);
                                continue;
                            case "sub":
                                roles.push({
                                    name: "Subscriber",
                                    style: {color: '#C9CCDB'},
                                    rank: 5
                                });
                                continue;
                            case "broadcaster":
                                roles.push({
                                    name: "Channel Owner",
                                    style: {color: 'white'},
                                    rank: 0
                                });
                                continue;
                            case "tier1":
                                roles.push({
                                    name: "Tier 1 Sub",
                                    style: {color: '#d6d7dc'},
                                    rank: 6
                                });
                                continue;
                            case "tier2":
                                roles.push({
                                    name: "Tier 2 Sub",
                                    style: {color: '#b1c5d4'},
                                    rank: 7
                                });
                                continue;
                            case "tier3":
                                roles.push({
                                    name: "Tier 3 Sub",
                                    style: {color: '#71879a'},
                                    rank: 8
                                });
                                continue;
                        }
                    }

                    for (const teamRole of teamRoles) {
                        const rank = 8;

                        roles.push({
                            name: teamRole.name,
                            style: {color: '#7954b1'},
                            rank: rank + 1
                        });
                    }

                    $ctrl.roles = roles;
                }

                class ViewerAction {
                    constructor(id, value, nameFunc, iconFunc, actionfunc, confirmBtnType = 'btn-primary') {
                        this.id = id;
                        this.toggleValue = value;
                        this._nameFunc = nameFunc;
                        this._iconFunc = iconFunc;
                        this._actionFunc = actionfunc;
                        this._confirmBtnType = confirmBtnType;
                        this.updateNameAndIcon();
                    }

                    updateNameAndIcon() {
                        this.name = this._nameFunc(this.toggleValue);
                        this.icon = this._iconFunc(this.toggleValue);
                    }

                    onClick() {

                        utilityService
                            .showConfirmationModal({
                                title: this.name,
                                question: `Are you sure you want to ${this.name.toLowerCase()} ${$ctrl.viewerDetails.twitchData.displayName}?`,
                                confirmLabel: this.name,
                                confirmBtnType: this._confirmBtnType
                            })
                            .then((confirmed) => {
                                if (confirmed) {
                                    this.toggleValue = this._actionFunc(this.toggleValue);
                                    this.updateNameAndIcon();
                                }
                            });

                    }
                }

                $ctrl.actions = [];

                function buildActions() {

                    const userRoles = $ctrl.viewerDetails.twitchData.userRoles;
                    if (userRoles.includes("broadcaster")) {
                        return;
                    }

                    const actions = [];

                    if (connectionService.connections['chat'] === 'connected') {
                        const isMod = userRoles.includes("mod");
                        actions.push(new ViewerAction(
                            "mod",
                            isMod,
                            (mod) => {
                                return mod ? "Unmod" : "Mod";
                            },
                            (mod) => {
                                return mod ? "fas fa-user-minus" : "fal fa-user-plus";
                            },
                            (mod) => {
                                const newMod = !mod;
                                viewersService.updateModStatus($ctrl.viewerDetails.twitchData.username, newMod);
                                if (newMod) {
                                    $ctrl.roles.push(modRole);
                                } else {
                                    $ctrl.roles = $ctrl.roles.filter(r => r.name !== "Moderator");
                                }

                                return newMod;
                            }
                        )
                        );

                        const isBanned = $ctrl.viewerDetails.twitchData.isBanned;
                        actions.push(new ViewerAction(
                            "ban",
                            isBanned,
                            (banned) => {
                                return banned ? "Unban" : "Ban";
                            },
                            (banned) => {
                                return banned ? "fas fa-ban" : "fal fa-ban";
                            },
                            (banned) => {
                                const newBanned = !banned;
                                viewersService.updateBannedStatus($ctrl.viewerDetails.twitchData.username, newBanned);
                                if (newBanned) {
                                    $ctrl.roles.push(bannedRole);
                                } else {
                                    $ctrl.roles = $ctrl.roles.filter(r => r.name !== "Banned");
                                }
                                return newBanned;
                            },
                            "btn-danger"
                        )
                        );
                    }

                    $ctrl.actions = actions;
                }

                $ctrl.disableAutoStatAccuralChange = () => {
                    backendCommunicator.fireEvent("update-firebot-viewer-data-field", {
                        userId: $ctrl.resolve.userId,
                        field: "disableAutoStatAccrual",
                        value: $ctrl.viewerDetails.firebotData.disableAutoStatAccrual
                    });
                };

                $ctrl.disableActiveUserListChange = () => {
                    backendCommunicator.fireEvent("update-firebot-viewer-data-field", {
                        userId: $ctrl.resolve.userId,
                        field: "disableActiveUserList",
                        value: $ctrl.viewerDetails.firebotData.disableActiveUserList
                    });
                };

                $ctrl.disableViewerListChange = () => {
                    backendCommunicator.fireEvent("update-firebot-viewer-data-field", {
                        userId: $ctrl.resolve.userId,
                        field: "disableViewerList",
                        value: $ctrl.viewerDetails.firebotData.disableViewerList
                    });
                };

                class ViewerDataPoint {
                    constructor(name, icon, value, displayFunc, fieldName, valueType, beforeEditFunc, afterEditFunc, reloadViewerDataOnSave = false, metadata = {}, canEdit = true, tooltip = null) {
                        this.name = name;
                        this.icon = icon;
                        this.value = value;
                        this._displayFunc = displayFunc;
                        this._fieldName = fieldName;
                        this._valueType = valueType;
                        this._beforeEditFunc = beforeEditFunc;
                        this._afterEditFunc = afterEditFunc;
                        this.display = this._displayFunc(this.value);
                        this.canEdit = canEdit;
                        this.tooltip = tooltip;
                        this.metadata = metadata;
                        this._reloadViewerDataOnSave = reloadViewerDataOnSave;
                    }

                    onClick() {
                        const valueToEdit = this._beforeEditFunc(this.value);

                        if (this._valueType === "text" || this._valueType === "number") {
                            utilityService.openGetInputModal(
                                {
                                    model: valueToEdit,
                                    label: `Edit ${this.name}`,
                                    saveText: "Save",
                                    inputPlaceholder: `Enter ${this.name.toLowerCase()}`,
                                    validationFn: (value) => {
                                        return new Promise((resolve) => {
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
                                    label: `Edit ${this.name}`,
                                    saveText: "Save",
                                    inputPlaceholder: `Enter ${this.name.toLowerCase()}`
                                },
                                (editedValue) => {
                                    this.value = this._afterEditFunc(editedValue);
                                    this.display = this._displayFunc(this.value);
                                    this.saveValue();
                                }
                            );
                        } else if (this._valueType === "rank") {
                            utilityService.showModal({
                                component: "editViewerRankModal",
                                size: "sm",
                                resolveObj: {
                                    rankLadderId: () => this.metadata.rankLadderId,
                                    currentRankId: () => this.value
                                },
                                closeCallback: (newRankId) => {
                                    this.value = this._afterEditFunc(newRankId);
                                    this.display = this._displayFunc(this.value);
                                    this.saveValue();
                                }
                            });
                        }
                    }

                    async saveValue() {
                        if (this._valueType === "rank") {
                            await backendCommunicator.fireEventAsync("update-viewer-rank", {
                                userId: $ctrl.resolve.userId,
                                rankLadderId: this.metadata.rankLadderId,
                                rankId: this.value
                            });
                        } else {
                            await backendCommunicator.fireEventAsync("update-firebot-viewer-data-field", {
                                userId: $ctrl.resolve.userId,
                                field: this._fieldName,
                                value: this.value
                            });
                        }
                        if (this._reloadViewerDataOnSave) {
                            $ctrl.reloadFirebotData();
                        }
                    }
                }

                $ctrl.dataPoints = [];
                function buildDataPoints() {
                    /**
                     * @type ViewerDataPoint[]
                     */
                    const dataPoints = [];

                    if (!$ctrl.hasFirebotData) {
                        return;
                    }

                    const joinDate = $ctrl.viewerDetails.firebotData.joinDate;
                    dataPoints.push(new ViewerDataPoint(
                        "Join Date",
                        "fa-sign-in",
                        joinDate,
                        (value) => {
                            return value ? moment(value).format("L") : "Not saved";
                        },
                        "joinDate",
                        "date",
                        (value) => {
                            return value ? moment(value).toDate() : new Date();
                        },
                        (value) => {
                            return moment(value).valueOf();
                        }
                    ));

                    const lastSeen = $ctrl.viewerDetails.firebotData.lastSeen;
                    dataPoints.push(new ViewerDataPoint(
                        "Last Seen",
                        "fa-eye",
                        lastSeen,
                        (value) => {
                            return value ? moment(value).format("L") : "Not saved";
                        },
                        "lastSeen",
                        "date",
                        (value) => {
                            return value ? moment(value).toDate() : new Date();
                        },
                        (value) => {
                            return moment(value).valueOf();
                        }
                    ));

                    const minsInChannel = $ctrl.viewerDetails.firebotData.minutesInChannel || 0;
                    dataPoints.push(new ViewerDataPoint(
                        "View Time",
                        "fa-tv",
                        minsInChannel,
                        (value) => {
                            return value < 60 ? 'Less than an hour' : `${parseInt(value / 60)} hr(s)`;
                        },
                        "minutesInChannel",
                        "number",
                        (value) => {
                            return value ? parseInt(value / 60) : 0;
                        },
                        (value) => {
                            const mins = parseInt(value) * 60;

                            return mins;
                        },
                        true
                    ));

                    const chatMessages = $ctrl.viewerDetails.firebotData.chatMessages || 0;
                    dataPoints.push(new ViewerDataPoint(
                        "Chat Messages",
                        "fa-comments",
                        chatMessages,
                        value => value,
                        "chatMessages",
                        "number",
                        (value) => {
                            return value ? parseInt(value) : 0;
                        },
                        (value) => {
                            return value ? parseInt(value) : 0;
                        }
                    ));

                    const currencies = currencyService.getCurrencies();

                    for (const currency of currencies) {
                        dataPoints.push(new ViewerDataPoint(
                            `${currency.name} (Currency)`,
                            "fa-money-bill",
                            $ctrl.viewerDetails.firebotData.currency[currency.id] || 0,
                            value => value,
                            `currency.${currency.id}`,
                            "number",
                            (value) => {
                                return value ? parseInt(value) : 0;
                            },
                            (value) => {
                                return value ? parseInt(value) : 0;
                            },
                            true
                        ));
                    }

                    for (const rankLadder of viewerRanksService.rankLadders) {
                        const rankId = $ctrl.viewerDetails.firebotData.ranks?.[rankLadder.id];

                        let tooltip = undefined;
                        if (rankLadder.mode === "auto") {
                            let trackByText = '';
                            if (rankLadder.settings.trackBy === "view_time") {
                                trackByText = " by this viewer's view time";
                            } else if (rankLadder.settings.trackBy === "currency") {
                                const currency = currencyService.getCurrency(rankLadder.settings.currencyId);
                                trackByText = ` by this viewer's ${currency?.name ?? 'currency'} balance`;
                            }
                            tooltip = `This rank is automatically determined${trackByText}`;
                        }

                        dataPoints.push(new ViewerDataPoint(
                            `${rankLadder.name} (Rank Ladder)`,
                            "fa-award",
                            rankId,
                            (_rankId) => {
                                return rankLadder.ranks.find(r => r.id === _rankId)?.name ?? "Not ranked";
                            },
                            `ranks.${rankLadder.id}`,
                            "rank",
                            value => value,
                            value => value,
                            false,
                            {
                                rankLadderId: rankLadder.id
                            },
                            rankLadder.mode === "manual",
                            tooltip
                        ));
                    }

                    $ctrl.dataPoints = dataPoints;
                }

                $ctrl.hasCustomRoles = viewerRolesService.getCustomRoles().length > 0;
                $ctrl.customRoles = [];
                function loadCustomRoles() {
                    const userId = $ctrl.viewerDetails.twitchData.id;

                    const viewerRoles = viewerRolesService.getCustomRoles();
                    $ctrl.hasCustomRolesAvailable = viewerRoles
                        .filter(r => !r.viewers.some(v => v.id === userId))
                        .length > 0;
                    $ctrl.customRoles = viewerRoles.filter(vr => vr.viewers.some(v => v.id === userId));
                }

                $ctrl.openAddCustomRoleModal = () => {
                    const userId = $ctrl.viewerDetails.twitchData.id;
                    const options = viewerRolesService.getCustomRoles()
                        .filter(r => !r.viewers.some(v => v.id === userId))
                        .map((r) => {
                            return {
                                id: r.id,
                                name: r.name
                            };
                        });
                    utilityService.openSelectModal(
                        {
                            label: "Add Custom Role",
                            options: options,
                            saveText: "Add",
                            validationText: "Please select a role."

                        },
                        (roleId) => {
                            if (!roleId) {
                                return;
                            }

                            const user = {
                                id: $ctrl.viewerDetails.twitchData.id,
                                username: $ctrl.viewerDetails.twitchData.username,
                                displayName: $ctrl.viewerDetails.twitchData.displayName
                            };

                            viewerRolesService.addViewerToRole(roleId, user);
                            loadCustomRoles();
                        });
                };

                $ctrl.removeViewerFromRole = (roleId, roleName) => {
                    const userId = $ctrl.viewerDetails.twitchData.id;
                    utilityService.showConfirmationModal({
                        title: "Remove Viewer",
                        question: `Are you sure you want to remove the role ${roleName}?`,
                        confirmLabel: "Remove",
                        confirmBtnType: "btn-danger"
                    }).then((confirmed) => {
                        if (confirmed) {
                            viewerRolesService.removeViewerFromRole(roleId, userId);
                            loadCustomRoles();
                        }
                    });
                };

                function init() {
                    $ctrl.hasFirebotData = Object.keys($ctrl.viewerDetails.firebotData).length > 0;
                    buildDataPoints();
                    $ctrl.viewerRankData = $ctrl.viewerDetails.firebotData.ranks || {};
                    if ($ctrl.viewerDetails.twitchData != null) {
                        buildActions();
                        loadRoles();
                        loadCustomRoles();
                        if ($ctrl.hasFirebotData && $ctrl.viewerDetails.firebotData.metadata == null) {
                            $ctrl.viewerDetails.firebotData.metadata = {};
                        }
                    }
                }

                $ctrl.isTwitchOrNewUser = () => {
                    return !Object.keys($ctrl.viewerDetails.firebotData).length || !!$ctrl.viewerDetails.firebotData.twitch;
                };

                $ctrl.removeViewer = function() {
                    if (!$ctrl.hasFirebotData) {
                        return;
                    }

                    const displayName = $ctrl.isTwitchOrNewUser() && $ctrl.viewerDetails.twitchData ?
                        $ctrl.viewerDetails.twitchData.displayName :
                        $ctrl.viewerDetails.firebotData.displayName;

                    utilityService
                        .showConfirmationModal({
                            title: `Remove Viewer Data`,
                            question: `Are you sure you want remove ${displayName}'s data from Firebot?`,
                            confirmLabel: "Remove",
                            confirmBtnType: "btn-danger"
                        })
                        .then((confirmed) => {
                            if (confirmed) {

                                $ctrl.hasFirebotData = false;
                                $ctrl.viewerDetails.firebotData = {};
                                $ctrl.dataPoints = [];

                                backendCommunicator.fireEvent("remove-viewer-from-db", $ctrl.resolve.userId);
                            }
                        });
                };

                $ctrl.saveUser = function() {
                    if ($ctrl.hasFirebotData) {
                        return;
                    }

                    const createViewerRequest = {
                        id: $ctrl.resolve.userId,
                        username: $ctrl.viewerDetails.twitchData.username,
                        displayName: $ctrl.viewerDetails.twitchData.displayName,
                        profilePicUrl: $ctrl.viewerDetails.twitchData.profilePicUrl,
                        twitchRoles: $ctrl.viewerDetails.twitchData.userRoles
                    };

                    $q((resolve) => {
                        backendCommunicator.fireEventAsync("create-firebot-viewer-data", createViewerRequest)
                            .then((viewerFirebotData) => {
                                resolve(viewerFirebotData);
                            });
                    }).then((viewerFirebotData) => {
                        $ctrl.viewerDetails.firebotData = viewerFirebotData || {};
                        $ctrl.hasFirebotData = Object.keys($ctrl.viewerDetails.firebotData).length > 0;
                        buildDataPoints();
                    });
                };

                $ctrl.loadViewerDetails = function() {
                    $q((resolve) => {
                        backendCommunicator.fireEventAsync("get-viewer-details", $ctrl.userId)
                            .then((viewerDetails) => {
                                resolve(viewerDetails);
                            });
                    }).then((viewerDetails) => {
                        $ctrl.viewerDetails = viewerDetails;
                        init();
                        $ctrl.loading = false;
                    });
                };

                $ctrl.reloadFirebotData = function() {
                    backendCommunicator.fireEventAsync("get-firebot-viewer-data", $ctrl.userId)
                        .then((firebotData) => {
                            $ctrl.viewerDetails.firebotData = firebotData;
                            init();
                        });
                };

                $ctrl.$onInit = function() {
                    $ctrl.userId = $ctrl.resolve.userId;

                    $ctrl.loadViewerDetails();
                };
            }
        });
}());