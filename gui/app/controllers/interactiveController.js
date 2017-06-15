(function(){
  
 //This handles the Interactive tab
 
 const _ = require('underscore')._;
 
 angular
   .module('firebotApp')
   .controller('interactiveController', function($scope, $interval, boardFactory, settingsService) {
     
    var settings = settingsService;
     
    $scope.selectedBoard = getLastUsedBoard();
    
    $scope.getBoardNames = function() {
      return boardFactory.getBoardNames();
    }
    
    $scope.switchToBoard - function(boardName) {
      var board = boardFactory.getBoardByName(boardName);
      if(board != null && board.name != $scope.selectedBoard.name) {
        $scope.selectedBoard = board;
      }
    }
    
    $scope.getScenesForSelectedBoard = function() {
      var board = $scope.selectedBoard;
      var scenes = [];
      if(board != null) {
        scenes = _.keys(board.scenes);
      }
      return scenes;
    };
    
    $scope.getControlsForScene = function(scene) {
      var buttons = [];
      if($scope.selectedBoard != null) {
        buttons = $scope.selectedBoard.getControlsForScene(scene);
      }
      return buttons;
    }
    
    $scope.fireControlManually = function(controlId) {
      console.log("here");
      ipcRenderer.send('manualButton', controlId);
    }
    
    /**
    * Private helpers
    */
    function getLastUsedBoard() {
      return boardFactory.getBoardByName(settings.getLastBoardName());
    }
     
    /**
    * Initial tab load
    */
 		if(!boardFactory.hasBoardsLoaded() === true) {
      boardFactory.loadAllBoards().then(function () {
       
        var lastBoard = getLastUsedBoard();
        
        $scope.selectedBoard = lastBoard;
        $scope.$applyAsync();
        
        console.log(lastBoard);       
        
        var boards = boardFactory.getAllBoards();
 
        var scene = boards[0].scenes.default.sceneName;            
      });
 		}   
   });    
})();