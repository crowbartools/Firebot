"use strict";

// Basic template for a modal component, copy this and rename to build a modal.

(function() {
  angular.module("firebotApp").component("puzzleModal", {
    template: `
            <div class="modal-header">
                <h4 class="modal-title">Complete The Puzzle</h4>
            </div>
            <div class="modal-body">
                <h2>{{puzzle.title}}</h2>
				<sliding-puzzle api="puzzle.api" size="{{puzzle.rows}}x{{puzzle.cols}}" src="{{puzzle.src}}"></sliding-puzzle>
            </div>
            <div class="modal-footer">
                <button ng-if="puzzle.api.isSolved()" type="button" class="btn btn-default" ng-click="$ctrl.close()">Close</button>
            </div>
            `,
    bindings: {
      resolve: "<",
      close: "&",
      dismiss: "&"
    },
    controller: function($scope, slidingPuzzle) {
      let $ctrl = this;

      $scope.puzzle = { src: '../images/logo.jpg', title: 'Firebottle', rows: 10, cols: 10 };

      $ctrl.$onInit = function() {
        // When the compontent is initialized
        // This is where you can start to access bindings, such as variables stored in 'resolve'
        // IE $ctrl.resolve.shouldDelete or whatever
      };
    }
  });
})();
