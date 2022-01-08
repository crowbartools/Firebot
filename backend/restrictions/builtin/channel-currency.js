"use strict";

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
                <div id="channelCurrency" class="modal-subheader" style="padding: 0 0 4px 0">
                    Channel Currency
                </div>
                <div class="">
                    <select class="fb-select" ng-model="restriction.selectedCurrency" ng-options="currency.id as currency.name for currency in currencies"></select>
                </div>

                <div id="channelCurrencyOption" class="modal-subheader" style="padding: 0 0 4px 0">
                    Comparison
                </div>
                <div>
                    <select class="fb-select" ng-model="restriction.comparison">
                        <option label="Less than (or equal to)" value="less">Less than (or equal to)</option>
                        <option label="Greater than (or equal to)" value="greater">Greater than (or equal to)</option>
                        <option label="Equal to" value="equal">Equal to</option>
                    </select>
                </div>

                <div id="channelCurrencyAmount" class="modal-subheader" style="padding: 0 0 4px 0">
                    Amount
                </div>
                <div class="form-group">
                    <input type="number" class="form-control" ng-model="restriction.amount" placeholder="Enter currency amount">
                </div>
            </div>
            <div ng-show="!hasCurrencies">
                <p>You have not created any currencies to use with this restriction!</p>
            </div>
        </div>
    `,
    optionsController: ($scope, currencyService) => {

        // Get list of currencies
        $scope.currencies = currencyService.getCurrencies();

        $scope.hasCurrencies = $scope.currencies.length > 0;

        // set default values
        if ($scope.currencies.length > 0 && $scope.restriction.selectedCurrency == null) {
            $scope.restriction.selectedCurrency = $scope.currencies[0].id;
        }

        if ($scope.restriction.comparison == null) {
            $scope.restriction.comparison = "less";
        }
    },
    optionsValueDisplay: (restriction, currencyService) => {
        let comparison = restriction.comparison;
        let currencyId = restriction.selectedCurrency;
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

        let currency = currencyService.getCurrency(currencyId);

        let currencyName = currency ? currency.name : "[None Selected]";

        return currencyName + " is " + comparison + " " + amount;
    },
    /*
      function that resolves/rejects a promise based on if the restriction critera is met
    */
    predicate: (triggerData, restrictionData) => {
        return new Promise(async (resolve, reject) => {
            let currencyDatabase = require("../../database/currencyDatabase");
            let username = triggerData.metadata.username;
            let userCurrency = await currencyDatabase.getUserCurrencyAmount(username, restrictionData.selectedCurrency);

            let comparison = restrictionData.comparison;
            let currencyAmount = restrictionData.amount;

            let passed = false;
            if (comparison === "less" && userCurrency <= currencyAmount) {
                passed = true;
            }

            if (comparison === "greater" && userCurrency >= currencyAmount) {
                passed = true;
            }

            if (comparison === "equal" && userCurrency === currencyAmount) {
                passed = true;
            }

            if (passed) {
                resolve();
            } else {
                let currency = currencyDatabase.getCurrencyById(restrictionData.selectedCurrency);
                let currencyName = currency ? currency.name.toLowerCase() : "Unknown currency";
                let amountText = "";
                if (comparison !== "equal") {
                    amountText = `${comparison} than ${currencyAmount}`;
                } else {
                    amountText = `${currencyAmount}`;
                }
                reject(`you need ${amountText} ${currencyName}`);
            }
        });
    }
};

module.exports = model;