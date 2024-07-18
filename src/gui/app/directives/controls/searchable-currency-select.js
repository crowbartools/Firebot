"use strict";

(function() {
    angular
        .module('firebotApp')
        .component("searchableCurrencySelect", {
            bindings: {
                modelValue: "=ngModel",
                name: "@?",
                id: "@?",
                required: "<?"
            },
            template: `
                <firebot-searchable-select
                    ng-model="$ctrl.modelValue"
                    items="$ctrl.currencies"
                    id="{{$ctrl.id || ''}}"
                    name="{{$ctrl.name || ''}}"
                    required="$ctrl.required"
                    placeholder="Select currency"
                ></firebot-searchable-select>
            `,
            controller: function(currencyService) {
                const $ctrl = this;

                $ctrl.currencies = currencyService.getCurrencies();
            }
        });
}());
