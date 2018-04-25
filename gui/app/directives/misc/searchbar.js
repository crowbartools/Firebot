"use strict";

(function() {
  angular.module("firebotApp").component("searchbar", {
    bindings: {
      placeholderText: "@",
      query: "="
    },
    template: `
      <div style="position: relative;">
        <input type="text" class="form-control" placeholder="{{$ctrl.placeholderText}}" ng-model="$ctrl.query" style="padding-left: 27px;">
        <span class="searchbar-icon"><i class="far fa-search"></i></span>
      </div>
          `,
    controller: function() {}
  });
})();
