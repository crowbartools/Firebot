"use strict";

(function() {
    const uuidv1 = require("uuid/v1");

    angular.module("firebotApp").component("searchbar", {
        bindings: {
            searchId: "@",
            placeholderText: "@",
            query: "="
        },
        template: `
          <div style="position: relative;">
            <input id="{{$ctrl.searchId}}" type="text" class="form-control" placeholder="{{$ctrl.placeholderText}}" ng-model="$ctrl.query" style="padding-left: 27px;" ng-model-options="{debounce: 300}">
            <span class="searchbar-icon"><i class="far fa-search"></i></span>
          </div>
          `,
        controller: function() {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                if ($ctrl.searchId == null || $ctrl.searchId === "") {
                    $ctrl.searchId = uuidv1();
                }
            };
        }
    });
}());
