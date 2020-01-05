"use strict";

const profileManager = require("../../common/profile-manager");

const model = {
    definition: {
        id: "firebot:channelcurrency",
        name: "Channel Currency",
        description: "Restrict based on channel currency amounts.",
        triggers: []
    },
    optionsTemplate: `
        <div>
            <div ng-show="hasCurrencies">
                <div id="channelCurrency" class="mixplay-header" style="padding: 0 0 4px 0">
                    Channel Currency
                </div>
                <div class="">
                    <select class="fb-select" ng-model="restriction.selectedCurrency" ng-options="currency as currency.name for currency in currencies track by currency.id"></select>
                </div>

                <div id="channelCurrencyOption" class="mixplay-header" style="padding: 0 0 4px 0">
                    Comparison
                </div>
                <div class="">
                    <select class="fb-select" ng-model="restriction.comparison">
                        <option label="Less than (or equal to)" value="less" selected="selected">Less than (or equal to)</option>
                        <option label="Greater than (or equal to)" value="greater">Greater than (or equal to)</option>
                        <option label="Equal to" value="equal">Equal to</option>
                    </select>
                </div>

                <div id="channelCurrencyAmount" class="mixplay-header" style="padding: 0 0 4px 0">
                    Amount
                </div>
                <div class="form-group">
                    <input class="fb-control fb-select" style="color:black; padding-left: .3em" type="number" ng-model="restriction.amount">
                </div>
            </div>
            <div ng-show="!hasCurrencies">
                <p>You have not created any currencies to use with this restriction!</p>
            </div>
        </div>
    `,
    optionsController: ($scope) => {
        // The currency settings.
        let currencyDb = profileManager.getJsonDbInProfile("/currency/currency");

        // Get list of currencies
        $scope.currencies = [];
        let currencyData = currencyDb.getData("/");
        Object.keys(currencyData).forEach(function(k) {
            $scope.currencies.push(currencyData[k]);
        });

        // Do we have any currencies?
        $scope.hasCurrencies = $scope.currencies.length > 0;
    },
    optionsValueDisplay: (restriction) => {
        let comparison = restriction.comparison;
        let currency = restriction.selectedCurrency;
        let amount = restriction.amount;

        if (comparison != null) {
            comparison = comparison.toLowerCase();
        } else {
            return "";
        }

        if (comparison === "less") {
            comparison = "less than";
        } else if (comparison === "greater") {
            comparison = "greater than";
        } else if (comparison === "equal") {
            comparison = "equal to";
        }

        return currency.name + " is " + comparison + " " + amount;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let passed = false;
            let currencyDatabase = require("../../database/currencyDatabase");
            let username = triggerData.metadata.username;
            let userCurrency = await currencyDatabase.getUserCurrencyAmount(username, restrictionData.selectedCurrency.id);

            if (userCurrency !== false) {
                let comparison = restrictionData.comparison;
                let currencyAmount = restrictionData.amount;

                if (comparison === "less" && userCurrency <= currencyAmount) {
                    passed = true;
                }

                if (comparison === "greater" && userCurrency >= currencyAmount) {
                    passed = true;
                }

                if (comparison === "equal" && userCurrency === currencyAmount) {
                    passed = true;
                }
            }


            if (passed) {
                resolve();
            } else {
                reject("You don't meet the currency requirements for this action.");
            }
        });
    },
    /*
        called after all restrictions in a list are met. Do logic such as deducting currency here.
    */
    onSuccessful: (triggerData, restrictionData) => {

    }

};

module.exports = model;