const shell = require('electron').shell;
const fs = require('fs');
const {ipcRenderer} = require('electron');
const JsonDB = require('node-json-db');
const request = require('request');
const List = require('list.js');
const howler = require('howler');
const compareVersions = require('compare-versions');
const marked = require('marked');

const WebSocket = require('ws');
const WebSocketServer = require('ws').Server,
    wss = new WebSocketServer({
        port: 8080
    });


// Open Link In Browser
// This opens link in system default browser.
$(document).on('click', 'a[href^="http"]', function(event) {
    event.preventDefault();
    shell.openExternal(this.href);
});

// Navbar Collapse
// Collapse the navbar when a menu item is selected.
$("nav").find("li").on("click", "a", function () {
    var slide = parseInt( $(this).attr('slide') );
    $('.carousel').carousel(slide);
    $('.carousel').carousel('pause');
    $('.navbar-collapse').collapse('hide');
});


///////////////
// Helper 
//////////////

// Get Current Board
// This function returns the db for the currently selected board.
function getCurrentBoard(){
    // Get the current board.
    var dbSettings = new JsonDB("./user-settings/settings", true, true);
    try{
        // Get last board name.
        var gameName = dbSettings.getData('/interactive/lastBoard');

        // Get settings for last board.
        var dbControls = new JsonDB("./user-settings/controls/"+gameName, true, true);

        return dbControls;
    } catch(err){};
}

// Get Unique Id
// This function returns a string to be used as a unique id for settings.
function getUniqueId(){

    var uniqueid =String.fromCharCode(Math.floor((Math.random()*25)+65));
    do {                
        // between numbers and characters (48 is 0 and 90 is Z (42-48 = 90)
        var ascicode=Math.floor((Math.random()*42)+48);
        if (ascicode<58 || ascicode>64){
            // exclude all chars between : (58) and @ (64)
           uniqueid+=String.fromCharCode(ascicode);    
        }                
    } while (uniqueid.length<32);

    return uniqueid;
}