"use strict";

const currencyDatabase = require("../../database/currencyDatabase");
const util = require("../../utility");
const chatProcessor = require("../../common/handlers/chatProcessor");
const logger = require("../../logwrapper");

const { ControlKind, InputEvent } = require('../../interactive/constants/MixplayConstants');
const effectModels = require("../models/effectModels");
const { EffectDependency, EffectTrigger } = effectModels;

/**
 * The Currency effect
 */
const currency = {
    /**
   * The definition of the Effect
   */
    definition: {
        id: "firebot:currency",
        name: "Currency",
        description: "Manage your currency systems.",
        tags: ["Fun", "Built in"],
        dependencies: [],
        triggers: effectModels.buildEffectTriggersObject(
            [ControlKind.BUTTON, ControlKind.TEXTBOX],
            [InputEvent.MOUSEDOWN, InputEvent.KEYDOWN, InputEvent.SUBMIT],
            EffectTrigger.ALL
        )
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

    <eos-container header="Currency">
        <div class="btn-group">
            <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <span class="currency-name">{{effect.currency ? getCurrencyName(effect.currency) : 'Pick one'}}</span> <span class="caret"></span>
            </button>
            <ul class="dropdown-menu currency-name-dropdown">
                <li ng-repeat="currency in currencies"
                    ng-click="effect.currency = currency.id">
                    <a href>{{getCurrencyName(currency.id)}}</a>
                </li>
            </ul>
        </div>
    </eos-container>
    
    <div ng-if="effect.currency">
        <eos-container header="Operation" pad-top="true">
            <div class="btn-group">
                <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span class="currency-action">{{effect.action ? effect.action : 'Pick one'}}</span> <span class="caret"></span>
                </button>
                <ul class="dropdown-menu currency-action-dropdown">
                    <li ng-click="effect.action = 'Add'">
                        <a href>Add</a>
                    </li>
                    <li ng-click="effect.action = 'Remove'">
                        <a href>Remove</a>
                    </li>
                </ul>
            </div>
        </eos-container>



        <div ng-if="effect.action">

            <eos-container header="Target" pad-top="true">

                <div class="permission-type controls-fb-inline">
                    <label class="control-fb control--radio">Single User
                        <input type="radio" ng-model="effect.target" value="individual"/>
                        <div class="control__indicator"></div>
                    </label>
                    <label class="control-fb control--radio">Group
                        <input type="radio" ng-model="effect.target" value="group"/>
                        <div class="control__indicator"></div>
                    </label>
                    <label class="control-fb control--radio">All Online Users
                        <input type="radio" ng-model="effect.target" value="allOnline"/>
                        <div class="control__indicator"></div>
                    </label>             
                </div>

                <div class="settings-permission" style="padding-bottom:1em">
                    <div class=" viewer-group-list" ng-if="effect.target === 'group'">
                        <label ng-repeat="group in viewerGroups" class="control-fb control--checkbox">{{group}}
                            <input type="checkbox" ng-click="toggleGroup(effect, group)" ng-checked="groupIsChecked(effect, group)"  aria-label="..." >
                            <div class="control__indicator"></div>
                        </label>
                    </div>
                    <div ng-if="effect.target === 'individual'" class="input-group">
                        <span class="input-group-addon" id="basic-addon3">Username</span>
                        <input type="text" class="form-control" aria-describedby="basic-addon3" ng-model="effect.userTarget" replace-variables>        
                    </div>
                </div>

            </eos-container>

            <eos-container header="Amount" ng-if="effect.target != null" pad-top="true">
                <div class="input-group">
                    <span class="input-group-addon" id="currency-units-type">Amount</span>
                    <input type="text" ng-model="effect.amount" class="form-control" id="currency-units-setting" aria-describedby="currency-units-type" type="text" replace-variables="number">
                </div>
            </eos-container>

        </div>

        <div ng-if="effect.target">
            <label class="control-fb control--checkbox" style="margin: 30px 0px 10px 10px"> Send Chat Message
                <input type="checkbox" ng-model="effect.sendChat">
                <div class="control__indicator"></div>
            </label>

            <div ng-show="effect.sendChat">
                <eos-chatter-select effect="effect" title="Chat as"></eos-chatter-select>

                <eos-container header="Message To Send" pad-top="true">
                    <textarea ng-model="effect.message" class="form-control" name="text" placeholder="Enter message" rows="4" cols="40"></textarea>
                    <div style="color:red" ng-if="effect.message && effect.message.length > 360">Chat messages cannot be longer than 360 characters. This message will get automatically trimmed if the length is still too long after all replace variables have been populated.</div>
                    <div style="display: flex; flex-direction: row; width: 100%; height: 36px; margin: 10px 0 10px; align-items: center;">
                        <label class="control-fb control--checkbox" style="margin: 0px 15px 0px 0px"> Whisper
                            <input type="checkbox" ng-init="whisper = (effect.whisper != null && effect.whisper !== '')" ng-model="whisper" ng-click="effect.whisper = ''">
                            <div class="control__indicator"></div>
                        </label>
                        <div ng-show="whisper">
                            <div class="input-group">
                                <span class="input-group-addon" id="chat-whisper-effect-type">To</span>
                                <input ng-model="effect.whisper" type="text" class="form-control" id="chat-whisper-setting" aria-describedby="chat-text-effect-type" placeholder="Username">
                            </div>
                        </div>
                    </div>   
                </eos-container>
            </div>
        </div>
    </div>
    `,
    /**
   * The controller for the front end Options
   * Port over from effectHelperService.js
   */
    optionsController: ($scope, currencyService, groupsService) => {
        $scope.currencies = currencyService.getCurrencies();
        $scope.mixerRoles = ["Moderators", "Subscribers", "Channel Editors", "Pro"];

        $scope.getCurrencyName = function(currencyId) {
            let currency = currencyService.getCurrencies(currencyId);
            return currency.name;
        };

        // Set active viewer groups for command permissions.
        $scope.viewerGroups = groupsService.getAllGroups();

        // This is run each time a group checkbox is clicked or unclicked.
        // This will build an array of currently selected groups to be saved to JSON.
        $scope.toggleGroup = function(effect, group) {
            if (effect.groups == null) {
                effect.groups = [];
            }

            if (effect.groups.includes(group)) {
                effect.groups = effect.groups.filter(g => g !== group);
            } else {
                effect.groups.push(group);
            }
        };

        // This checks if an item is in the command.permission array and returns true.
        // This allows us to check boxes when loading up this button effect.
        $scope.groupIsChecked = function(effect, group) {
            if (effect.groups == null) return false;
            return effect.groups.includes(group);
        };
    },
    /**
   * When the effect is triggered by something
   * Used to validate fields in the option template.
   */
    optionsValidator: effect => {
        let errors = [];
        if (effect.currency == null) {
            errors.push("Please select a currency to use.");
        }
        return errors;
    },
    /**
   * When the effect is triggered by something
   */
    onTriggerEvent: event => {
        return new Promise(async (resolve, reject) => {
            // Make sure viewer DB is on before continuing.
            if (!currencyDatabase.isViewerDBOn()) {
                return resolve();
            }

            // What should this do when triggered.
            let userTarget = await util.populateStringWithTriggerData(
                event.effect.userTarget,
                event.trigger
            );

            let amount = event.effect.amount;
            if (amount) {
                amount = await util.populateStringWithTriggerData(
                    amount,
                    event.trigger
                );
            }

            if (isNaN(amount)) {
                return reject("Amount not a number: " + amount);
            }


            // If "Remove" make number negative, otherwise just use number.
            let currency =
        event.effect.action === "Remove"
            ? -Math.abs(amount)
            : Math.abs(amount);

            // PEOPLE GONNA GET PAID
            switch (event.effect.target) {
            case "individual":
                // Give currency to one person.
                currencyDatabase.adjustCurrencyForUser(
                    userTarget,
                    event.effect.currency,
                    currency
                );
                break;
            case "allOnline":
                // Give currency to all online.
                currencyDatabase.addCurrencyToOnlineUsers(
                    event.effect.currency,
                    currency
                );
                break;
            case "group":
                // Give currency to group.
                currencyDatabase.addCurrencyToUserGroupOnlineUsers(
                    event.effect.groups,
                    event.effect.currency,
                    currency
                );
                break;
            default:
                logger.error("Invalid target passed to currency effect. currency.js");
            }

            // Send chat if we have it.
            if (event.effect.sendChat) {
                chatProcessor.send(event.effect, event.trigger);
            }

            resolve(true);
        });
    },
    /**
   * Code to run in the overlay
   */
    overlayExtension: {
        dependencies: {
            css: [],
            js: []
        },
        event: {
            name: "currency",
            onOverlayEvent: event => {
                console.log("yay currency");
            } //End event trigger
        }
    }
};

module.exports = currency;
