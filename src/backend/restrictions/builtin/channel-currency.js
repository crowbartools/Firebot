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
                    <option label="Greater than (or equal to)" value="greater">Greater than (or equal to)</option>
                    <option label="Less than" value="less">Less than</option>
                    <option label="Equal to" value="equal">Equal to</option>
                    </select>
                </div>

                <div id="channelCurrencyAmount" class="modal-subheader" style="padding: 0 0 4px 0">
                    Amount
                </div>
                <div class="form-group">
                    <input type="number" class="form-control" ng-model="restriction.amount" placeholder="Enter currency amount">
                </div>

                <div ng-if="showAutoDeduct()" style="margin-top:20px">
                    <label class="control-fb control--checkbox"> Automatically deduct currency from user if restrictions pass</tooltip>
                        <input type="checkbox" ng-model="restriction.autoDeductCurrency">
                        <div class="control__indicator"></div>
                    </label>
                </div>
            </div>
            <div ng-show="!hasCurrencies">
                <p>You have not created any currencies to use with this restriction!</p>
            </div>
        </div>
    `,
    optionsController: ($scope, currencyService) => {

        $scope.showAutoDeduct = () => {
            return ['greater', 'equal'].includes($scope.restriction.comparison) &&
                ['any', 'all'].includes($scope.restrictionMode);
        };

        $scope.currencies = currencyService.getCurrencies();

        $scope.hasCurrencies = $scope.currencies.length > 0;

        // set default values
        if ($scope.currencies.length > 0 && $scope.restriction.selectedCurrency == null) {
            $scope.restriction.selectedCurrency = $scope.currencies[0].id;
        }

        if ($scope.restriction.comparison == null) {
            $scope.restriction.comparison = "greater";
        }
    },
    optionsValueDisplay: (restriction, currencyService) => {
        const comparison = restriction.comparison?.toLowerCase();
        const currencyId = restriction.selectedCurrency;
        const amount = restriction.amount;

        if (comparison == null) {
            return "";
        }

        let comparisonDisplay;
        if (comparison === "less") {
            comparisonDisplay = "less than";
        } else if (comparison === "greater") {
            comparisonDisplay = "greater than";
        } else if (comparison === "equal") {
            comparisonDisplay = "equal to";
        }

        const currency = currencyService.getCurrency(currencyId);

        const currencyName = currency ? currency.name : "[None Selected]";

        return `${currencyName} is ${comparisonDisplay} ${amount}`;
    },
    predicate: async ({ metadata }, { selectedCurrency, comparison, amount: currencyAmount }) => {
        // we require this here to workaround circle dep issues :(
        const currencyAccess = require("../../currency/currency-access").default;
        const currencyManager = require("../../currency/currency-manager");

        const username = metadata.username;
        const userCurrency = await currencyManager.getViewerCurrencyAmount(username, selectedCurrency);

        let passed = false;
        if (comparison === "less" && userCurrency < currencyAmount) {
            passed = true;
        }

        if (comparison === "greater" && userCurrency >= currencyAmount) {
            passed = true;
        }

        if (comparison === "equal" && userCurrency === currencyAmount) {
            passed = true;
        }

        if (!passed) {
            const currency = currencyAccess.getCurrencyById(selectedCurrency);
            const currencyName = currency ? currency.name.toLowerCase() : "Unknown currency";
            const amountText = comparison !== "equal" ? `${comparison} than ${currencyAmount}` : `${currencyAmount}`;
            throw new Error(`you need ${amountText} ${currencyName}`);
        }
    },
    onSuccessful: async ({ metadata }, {
        selectedCurrency: currencyId,
        comparison,
        amount: currencyAmount,
        autoDeductCurrency
    }) => {

        if (!['greater', 'equal'].includes(comparison) || !autoDeductCurrency) {
            return;
        }

        // we require this here to workaround circle dep issues :(
        const currencyManager = require("../../currency/currency-manager");

        const username = metadata.username;

        await currencyManager.adjustCurrencyForViewer(
            username,
            currencyId,
            0 - Math.abs(currencyAmount) // force value negative to make it deduct the amount from user
        );
    }
};

module.exports = model;