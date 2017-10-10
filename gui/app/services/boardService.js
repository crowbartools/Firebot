(function(){
  
 //This manages board data
 
 const fs = require('fs');
 const _ = require('underscore')._; 
 const dataAccess = require('../../lib/common/data-access.js');
 
 angular
  .module('firebotApp')
  .factory('boardService', function ($http, $q, settingsService, $rootScope, utilityService) {
    
    // in memory board storage
    var _boards = {};
    
    // factory/service object
    var service = {}
    
    /**
    * Public methods
    */
    
    service.hasBoardsLoaded = function() {
      return _.keys(_boards).length > 0; 
    }
    // Returns an array of the in-memory boards
    service.getAllBoards = function() {
      return _.values(_boards);
    };
    
    // Returns an array of names for the loaded boards
    service.getBoardNames = function() {
      return _.pluck(_boards, 'name');
    };
    
    service.getBoardById = function(id) {
      return _boards[id];
    };
    
    service.getBoardByName = function(name) {
      return _.findWhere(_boards, {name: name});
    }
    
    service.getLastUsedBoard = function () {
      return service.getBoardByName(settingsService.getLastBoardName());
    }
    
    var selectedBoard = service.getLastUsedBoard();

    service.getSelectedBoard = function() {
      return selectedBoard;
    }
    
    service.setSelectedBoard = function(board) {
      if(board != null && board.name != null) {
        settingsService.setLastBoardName(board.name); 
      }
      selectedBoard = board;
    }
    
    service.loadBoardWithId = function(id) {
      $rootScope.showSpinner = true;
      return loadBoardsById([id], false).then((boards) => {
        var board = service.getBoardById(id);
        if(board != null) {
          service.setSelectedBoard(board);
        }
        return $q.resolve(true, () => {return boards;})
      });
    };
    
    service.deleteCurrentBoard = function() {
      var currentBoardName = service.getSelectedBoard().name;
          
      return deleteBoard(currentBoardName).then(() => {
        
        var key = service.getBoardByName(currentBoardName).versionId;
        // Remove last board setting entry
        settingsService.deleteLastBoardName(key);
        
        delete _boards[key];
        
        service.setSelectedBoard(null);
      });
    };
    
    // reload boards into memory
    service.loadAllBoards = function() {
      
      /* Step 1 */  
      // Get a list or board ids so we can resync them all with Mixer
      
      // Note(ebiggz): Unfortunately this currently means we have to iterate through the files
      // to get the ids and iterate through the files a second time after we have synced with mixer.
      // There's surely a better way to do this. Maybe maintain a list of known board id's in the settings file?
      try{
        knownBoards = settingsService.getKnownBoards();
        var boardVersionIds = [];
        _.each(knownBoards, function(board){
            boardVersionIds.push(board.boardId);
        });
        try{
            if(typeof boardVersionIds != "undefined" && boardVersionIds != null && boardVersionIds.length > 0){
                // console.log("We have data, no need to rebuild, proceed");
            }else{
                // console.log("This happened, we need to check for board files to see if we can rebuild them to get data in knownboards");
                throw new Error('boardlist is empty, might be first run of new 4.0 version? Trying to salvage data from board jsons instead...');
            }
        }catch(err){
            console.log("boardId is not present... We might have to reinitialize the board list...");
            // Attempt to access board flatfile storage
            var boardJsonFiles = [];
            try{
                var controlsPath = dataAccess.getPathInUserData('/user-settings/controls');
                boardJsonFiles = fs.readdirSync(controlsPath);          
            }catch(err){
                console.log(err);
                return new Promise(function(resolve, reject) {
                  resolve('No boards saved.');
                });;
            }
            
            /* Step 1 */  
            // Get a list or board ids so we can resync them all with Mixer
            
            // Note(ebiggz): Unfortunately this currently means we have to iterate through the files
            // to get the ids and iterate through the files a second time after we have synced with mixer.
            // There's surely a better way to do this. Maybe maintain a list of known board id's in the settings file?
            var boardVersionIds = [];
            _.each(boardJsonFiles, function (fileName) {
                var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+fileName);
                var boardData = boardDb.getData('/');
                
                boardVersionIds.push(boardData.versionid);
            });
            
            /* Step 2 */
            // Load each board.
            return loadBoardsById(boardVersionIds, true).then(() => { selectedBoard = service.getLastUsedBoard() });
        }
      }catch(err){
          // We don't have any board data... Do something about it?
          console.log("We don't have any board data... Panic? Riot? Riot?? Ok, blame Firebottle, it will be all good according to Waterbottle");
          knownBoards = [];
      }
      
      /* Step 2 */
      // Load each board.
      return loadBoardsById(boardVersionIds, true).then(() => { selectedBoard = service.getLastUsedBoard() });
    }
    
    service.saveControlForCurrentBoard = function(control) {
      var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+settingsService.getLastBoardName());
      
      // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
      // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
      // while removing internal angular properties. We then convert this string back to an object with 
      // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
      var cleanedControl = JSON.parse(angular.toJson(control));
      
      boardDb.push("./firebot/controls/" + control.controlId, cleanedControl);

      // Refresh the interactive control cache.
      ipcRenderer.send('refreshInteractiveCache');
    }
    
    service.saveSceneForCurrentBoard = function(scene) {
      var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+settingsService.getLastBoardName());
      
      // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
      // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
      // while removing internal angular properties. We then convert this string back to an object with 
      // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
      var cleanedScene = JSON.parse(angular.toJson(scene));
      
      boardDb.push("./firebot/scenes/" + scene.sceneName, cleanedScene);
      
      service.getSelectedBoard().scenes[scene.sceneName] = scene;

      // Refresh the interactive control cache.
      ipcRenderer.send('refreshInteractiveCache');
      
    }
    
    service.saveCooldownGroupForCurrentBoard = function(previousName, cooldownGroup) {
      
      if(previousName != null && previousName != '') {
        service.deleteCooldownGroupForCurrentBoard(previousName, cooldownGroup);
      }
      
      
      var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+settingsService.getLastBoardName());
      
      // Note(ebiggz): Angular sometimes adds properties to objects for the purposes of two way bindings
      // and other magical things. Angular has a .toJson() convienence method that coverts an object to a json string
      // while removing internal angular properties. We then convert this string back to an object with 
      // JSON.parse. It's kinda hacky, but it's an easy way to ensure we arn't accidentally saving anything extra.
      var cleanedCooldownGroup = JSON.parse(angular.toJson(cooldownGroup));
      
      if(cleanedCooldownGroup.buttons != null) {
        cleanedCooldownGroup.buttons.forEach((buttonName) => {
          boardDb.push(`./firebot/controls/${buttonName}/cooldownGroup`, cooldownGroup.groupName);
        });
      }
      
      boardDb.push("./firebot/cooldownGroups/" + cooldownGroup.groupName, cleanedCooldownGroup);
      
      if(service.getSelectedBoard().cooldownGroups == null) {
        service.getSelectedBoard().cooldownGroups = {}
      }
       
      service.getSelectedBoard().cooldownGroups[cooldownGroup.groupName] = cleanedCooldownGroup; 

      // Refresh the interactive control cache.
      ipcRenderer.send('refreshInteractiveCache');
      
      //TODO: propigate cooldown group to related buttons
    }
    
    service.deleteCooldownGroupForCurrentBoard = function(cooldownGroupName, cooldownGroup) {
      var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+settingsService.getLastBoardName());
      
      if(cooldownGroup.buttons != null) {
        cooldownGroup.buttons.forEach((buttonName) => {
          boardDb.delete(`./firebot/controls/${buttonName}/cooldownGroup`);
        });
      }
      
      boardDb.delete("./firebot/cooldownGroups/" + cooldownGroupName);
      
      delete service.getSelectedBoard().cooldownGroups[cooldownGroupName];

      // Refresh the interactive control cache.
      ipcRenderer.send('refreshInteractiveCache');
    }
    
    service.deleteViewerGroupFromAllBoards = function(viewerGroup) {
      var boards = service.getAllBoards();
      // interate through each saved board
      boards.forEach((board) => {
        var scenes = Object.keys(board.scenes).map(k => board.scenes[k]);
        // interate through each scene in a board
        scenes.forEach((scene) => {
          var groups = scene.default;
          var index = groups.indexOf(viewerGroup);
          // check if this group is saved as a scene default
          if(index != -1) {
            // remove from array
            groups.splice(index, 1);
            //save to file
            var boardDb = dataAccess.getJsonDbInUserData(`/user-settings/controls/${board.name}`);
            boardDb.push(`./firebot/scenes/${scene.sceneName}/default`, groups);
          }
        });
      });

      // Refresh the backend cache
      ipcRenderer.send('refreshInteractiveCache');
      ipcRenderer.send('refreshCommandCache');
    };

    service.getScenesForSelectedBoard = function (){
        var board = service.getLastUsedBoard();
        var scenes = [];
        if (board != null) {
          scenes = Object.keys(board.scenes);
        }
        return scenes;
    }
    
    service.getControlIdsForSelectedBoard = function (){
        var board = service.getLastUsedBoard();
        var controls = [];
        if (board != null) {
          controls = Object.keys(board.controls);
        }
        return controls;
    }

    /**
    *  Private helper methods
    */
    
    
    function loadBoardById(id) {
      return $http.get("https://mixer.com/api/v1/interactive/versions/"+id)
        .then(function(response) {
            var data = response.data;

            if( data.controlVersion == "1.0"){
                utilityService.showErrorModal("The board you're trying to load was created using Mixer Interactive v1. Please create a new board using Mixer Interactive v2.");
                return;
            } else {
                var gameUpdated = data.updatedAt;
                var gameName = data.game.name;
                var gameJson = data.controls.scenes;
                var boardUpdated = null; // Prepare for data from settings/boards/boardId
                try{ // Checking if the data for this board is present in settings.json
                    boardUpdated = settingsService.getBoardLastUpdatedDatetimeById(id);
                    if(boardUpdated != gameUpdated){ // Call backendbuilder if the dates don't match
                        return backendBuilder(gameName, gameJson, gameUpdated, id, utilityService);
                    }else{ // Date matches, no need to rebuild.
                        console.log("This board is already inplace, no need to rebuild");
                    }
                }catch(err){
                    // This board doesn't exist, recreate the board to get it into knownBoards
                    console.log(`Error occured, not able to find boardid ${id} in settings, build it`);
                    return backendBuilder(gameName, gameJson, gameUpdated, id, utilityService);
                }
                
                // return backendBuilder(gameName, gameJson, gameUpdated, id);
            }
        });
    }  
    
    function loadBoardsById(boardVersionIds, clearPreviousBoards) {
      
      //create a list of board load promises
      var boardLoadPromises = [];
      _.each(boardVersionIds, function(id) {
        var promise = loadBoardById(id);
        boardLoadPromises.push(promise);
      });
      
      //return a promise that will be resolved once all other promises have completed
      return Promise.all(boardLoadPromises).then(values => {
          //clear out previously loaded boards
          if(clearPreviousBoards === true) {
            _boards = {};
          }
          
          // get file names for all the boards
          var boardJsonFiles = [];
          try{
              var controlsPath = dataAccess.getPathInUserData('/user-settings/controls');
              boardJsonFiles = fs.readdirSync(controlsPath);          
          }catch(err){
            console.log(err);
            return;
          }
          
          var addedBoards = []
          // load each board
          _.each(boardJsonFiles, function (fileName) {
            // Get settings.
            var boardDb = dataAccess.getJsonDbInUserData("/user-settings/controls/"+fileName);
            var boardData = boardDb.getData('/');
            
            var board = boardData.firebot; 
            var versionId = boardData.versionid;
            var boardName = fileName.split(".")[0];
            
            board["name"] = boardName;
            board["versionId"] = versionId;
            
            if(this.controls == null) {
              this.controls = {};
            }
            board.getControlsForScene = function(sceneId) {
              return _.where(this.controls, {scene: sceneId});
            }
            
            if(this.joysticks == null) {
              this.joysticks = {};
            }            
            board.getJoysticksForScene = function(sceneId) {
              return _.where(this.joysticks, {scene: sceneId});
            }
            
            _boards[versionId] = board;
            addedBoards.push(board);
          });
          
          return $q.resolve(true, () => {
            $rootScope.showSpinner = false;
            return addedBoards
          });
       }, (error) => {
         $rootScope.showSpinner = false;
         return $q.reject(error);
       });
    }
    
    // Backend Controls Builder
    // This takes the mixer json and builds out the structure for the controls file.
    function backendBuilder(gameNameId, gameJsonInfo, gameUpdatedInfo, versionIdInfo, utilityService){
        const gameName = gameNameId;
        const gameJson = gameJsonInfo;
        const gameUpdated = gameUpdatedInfo;
        const versionid = versionIdInfo;

        // Check if game name contains a period.
        if(gameName.indexOf('.') !== -1){
            utilityService.showErrorModal("The board ("+gameName+") has a period in it's name. This could cause issues with Firebot. Please rename it in Mixer and try again.") 
            return;
        }

        // Check if board name contains emoji.
        var emojitest = isEmoji(gameName);
        if(emojitest === true){
            utilityService.showErrorModal("The board ("+gameName+") has emoji in it's name. Please rename the board and try again.")
            return;
        }

        // Preparing data for push to settings.js/boards/boardId
        var settingsBoard = {
            boardId: versionIdInfo,
            lastUpdated: gameUpdatedInfo
        }
        // Pushing boardid: ${versionIdInfo} with ${gameUpdatedInfo} to settings/boards
        settingsService.setBoardLastUpdatedDatetimeById(versionIdInfo, gameUpdated);
    
        var dbControls = dataAccess.getJsonDbInUserData("/user-settings/controls/"+gameName);
    
        // Push mixer Json to controls file.
        dbControls.push('/versionid', parseInt(versionid) );
        dbControls.push('/mixer', gameJson);
    
        // Cleanup Firebot Controls
        return backendCleanup(dbControls)
        .then((res) => {
            // Build Firebot controls
            for (var i = 0; i < gameJson.length; i++) {
                var scenename = gameJson[i].sceneID;
                var sceneControls = gameJson[i].controls;
    
                // Loop through controls for this scene.
                for (var a = 0; a < sceneControls.length; a++) { 
                    var button = sceneControls[a];
    
                    // Try to get info for button. If there is nothing it errors out.
                    try{
                        var type = button.kind;
                        if(type == "button"){
                            try{
                                var emojitest = isEmoji(button.controlID);
                                if(emojitest === false){
                                    var controlID = button.controlID;
                                } else {
                                    utilityService.showErrorModal("Button: "+button.controlID+" has emoji in the button name. This will cause all buttons to become unresponsive on connecting. Please remove emoji from the button name field in the Mixer studio. Note that button text is what is visible to viewers, and it's fine to have emoji there.")
                                }

                                
                            }catch(err){}
                            try{
                                var text = button.text;
                            }catch(err){
                                var text= "None";
                            }
                            try{
                                var cost = button.cost;
                            }catch(err){
                                var cost = 0;
                            }
                            
                            // Push to database
                            /*
                            // There is a reason for this one; Don't do it in a whole block
                            // it will rewrite all custom actions even if you just change the spark cost on Mixer Studio
                            // If we figure out a way to load the whole block, swap the new changes from mixer and save
                            // it back in without altering custom actions then we can swap this for a whole push instead
                            // of a singular one (Perry - 2017-06-28)
                            */                        
                            dbControls.push('./firebot/controls/'+controlID+'/controlId', controlID);
                            dbControls.push('./firebot/controls/'+controlID+'/scene', scenename);
                            dbControls.push('./firebot/controls/'+controlID+'/text', text);
                            dbControls.push('./firebot/controls/'+controlID+'/cost', cost);
                            dbControls.push('./firebot/controls/'+controlID+'/kind', type);                        
                        }

                        
                        if(type === "joystick") {
                          var joystick = {
                            controlID: button.controlID,
                            sampleRate: button.sampleRate,
                            scene: scenename,
                            kind: type
                          }
                          dbControls.push(`./firebot/joysticks/${joystick.controlID}`, joystick);
                        }
                        
                    }catch(err){
                        console.log('Problem getting button info to save to json.')
                    };
                }
                // Setup scenes in Firebot json if they haven't been made yet.
                try{
                    dbControls.getData('./firebot/scenes/'+scenename);
                }catch(err){
                    dbControls.push('./firebot/scenes/'+scenename+'/sceneName', scenename);
                    if(scenename !== "default"){
                        dbControls.push('./firebot/scenes/'+scenename+'/default', ["None"]);
                    } else {
                        dbControls.push('./firebot/scenes/'+scenename+'/default', []);
                    }
                }
            }
        })
    }
    
    // Backend Cleanup
    // This takes the mixer json and compares it against the Firebot json to remove any items no longer needed.
    function backendCleanup(dbControls){
        return new Promise((resolve, reject) => {
    
            // Check if Firebot settings exist
            try{
    
                // We have saved settings. Time to clean up!
                var mixerSettings = dbControls.getData('./mixer');
                var firebotSettings = dbControls.getData('./firebot');
    
    
                // Make an array containing all of the buttons and scenes from each json so we can compare.
                var mixerButtonArray = [];
                var firebotButtonArray = [];
                var mixerSceneArray = [];
                var firebotSceneArray = [];
    
                // Add mixer stuff to mixer arrays for comparison.
                for(scene of mixerSettings){
                    // Save Scenes
                    var sceneID = scene.sceneID;
                    mixerSceneArray.push(sceneID);
    
                    // Save Buttons
                    var controls = scene.controls;
                    for (control of controls){
                        var controlID = control.controlID;
                        mixerButtonArray.push(controlID);
                    }
                }
    
                // Add Firebot scenes to firebot array.
                for (scene in firebotSettings.scenes){
                    firebotSceneArray.push(scene);
                }
    
                // Add Firebot buttons to firebot array for comparison.
                for(control in firebotSettings.controls){
                    firebotButtonArray.push(control);
                }
    
                // Filter out all buttons that match. Anything left in the firebotButtonArray no longer exists on the mixer board.
                firebotButtonArray = firebotButtonArray.filter(val => !mixerButtonArray.includes(val));
    
                // Filter out all scenes that match. Anything left in the firebotScenenArray no longer exists on the mixer board.
                firebotSceneArray = firebotSceneArray.filter(val => !mixerSceneArray.includes(val));
    
                // Remove buttons that are no longer needed.
                // If a scene was deleted from Mixer, the buttons for that scene should be gone as well.
                for (button of firebotButtonArray){
                    try{
                        dbControls.delete('./firebot/controls/'+button);
                        console.log('Button '+button+' is not on the mixer board. Deleting.');
    
                        // Go through cooldown groups and remove the button if it is listed there.
                        for(cooldown in firebotSettings.cooldownGroups){
                            var cooldownButtons = dbControls.getData('./firebot/cooldownGroups/'+cooldown+'/buttons');
                            var i = cooldownButtons.length
                            while (i--) {
                                if (cooldownButtons[i] == button) {
                                    cooldownButtons.splice(i,1);
                                    console.log('Removing '+button+' from cooldown group '+cooldown+'.');
                                    break;
                                }
                            }
    
                            // Push corrected cooldown array to db.
                            dbControls.push('./firebot/cooldownGroups/'+cooldown+'/buttons', cooldownButtons);
                        }
                    }catch(err){
                        console.log(err);
                    }   
                }
    
                // Remove scenes that are no longer needed.
                for (scene of firebotSceneArray){
                    try{
                        dbControls.delete('./firebot/scenes/'+scene)
                        console.log('Scene '+scene+' is not on the mixer board. Deleting.');
                    }catch(err){
                        console.log(err);
                    }
                }
    
                resolve(true);
            }catch(err){
                // We don't have any saved settings yet. Resolve this and don't cleanup anything.
                console.log(err);
                resolve(true);
            }
        })
    }
    
    // Delete Board
    // This deletes the currently selected board on confirmation.
    function deleteBoard(boardName){
      return $q.when( new Promise((resolve, reject) => {
              
        // Check for last board and load ui if one exists.
        try {
            var filepath = dataAccess.getPathInUserData('/user-settings/controls/'+boardName+'.json');
    
            var exists = fs.existsSync(filepath);            
            if(exists) {
                // File exists deleting
                fs.unlink(filepath,function(err){
                    resolve();
                });
            } else {
                renderWindow.webContents.send('error', "Well this is weird. The board you tried to delete is already gone. Try restarting the app.");
                console.log("This file doesn't exist, cannot delete");
                resolve();
            }
        } catch(err) { reject(); }
      }));
    }
    
    /**
    * Helpers
    */
    
    // Emoji checker!
    // This checks a string for emoji and returns true if there are any...
    function isEmoji(str) {
        var ranges = [
            '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
            '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
            '\ud83d[\ude80-\udeff]' // U+1F680 to U+1F6FF
        ];
        if (str.match(ranges.join('|'))) {
            return true;
        } else {
            return false;
        }
    }

    return service;
    });    
})();
