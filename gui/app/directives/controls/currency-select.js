"use strict";

(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular
        .module('firebotApp')
        .component("currencySelect", {
            bindings: {
                model: "="
            },
            template: `
            <div>
                <dropdown-select options="$ctrl.currencies" selected="$ctrl.model"></dropdown-select>
            </div>
            `,
            controller: function(currencyService) {
                const $ctrl = this;

                $ctrl.currencies = {};
                currencyService.getCurrencies().forEach(c => {
                    $ctrl.currencies[c.id] = c.name;
                });
            }
        });
}());
