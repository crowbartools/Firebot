"use strict";

(function() {
    const { v4: uuid } = require("uuid");

    angular.module("firebotApp").component("searchbar", {
        bindings: {
            searchId: "@",
            placeholderText: "@",
            query: "="
        },
        template: `
          <div style="position: relative;">
            <input id="{{$ctrl.searchId}}" type="text" class="form-control" placeholder="{{$ctrl.placeholderText}}" ng-model="$ctrl.query" style="padding-left: 27px;padding-right: 27px;" ng-model-options="{debounce: 250}">
            <span class="searchbar-icon"><i class="far fa-search"></i></span>
            <span
                ng-show="$ctrl.query && !!$ctrl.query.length"
                class="searchbar-clear-btn clickable"
                ng-click="$ctrl.query = ''">
                <i class="fas fa-times-circle"></i>
            </span>
          </div>
          `,
        controller: function() {
            const $ctrl = this;
            $ctrl.$onInit = function() {
                if ($ctrl.searchId == null || $ctrl.searchId === "") {
                    $ctrl.searchId = uuid();
                }
            };
        }
    });
}());
