const request = require('request');
const JsonDB = require('node-json-db');
const chat = require('../chat-connect.js');
const randomPuppy = require('random-puppy');

const errorLog = require('../../error-logging/error-logging.js')

// API Processor
// This takes the packet, figures out the type, and then the the api function.
function apiProcessor(report){
    var dbSettings = new JsonDB('./user-settings/settings', true, false);
    var activeProfile = dbSettings.getData('./interactive/activeBoard');

    var dbControls = new JsonDB('./user-settings/controls/' + activeProfile, true, false);
		var controls = dbControls.getData('/tactile');

    // Get report info
    var rawid = report.id;
    var holding = report.holding;
    var press = report.pressFrequency;
    var button = controls[rawid];

    if (press > 0){
        // Get user specific settings
        var buttonID = button['id'];
        var typeSettings = button['typeSettings'];
        var apiType = typeSettings['apiType'];

				if(apiType == "Advice"){
					randomAdvice();
				} else if (apiType == "Cat Picture"){
					randomCat();
				} else if (apiType == "Cat Fact"){
					randomCatFact();
				} else if (apiType == "Dog Picture"){
					randomDog();
				} else if (apiType == "Dog Fact"){
					randomDogFact();
				} else if (apiType == "Aww"){
					randomAww();
				} else if (apiType == "Pokemon"){
					randomPokemon();
				} else if (apiType == "Number Trivia"){
					numberTrivia();
				}
    } else if (holding > 0){
			errorLog.log('API Buttons should only have pressFrequency on in the dev lab.');
		}
}

function randomAdvice(){
  var url = "http://api.adviceslip.com/advice";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
        var advice = json.slip["advice"];
        try{
            console.log('Advice: '+advice);
            chat.broadcast('Advice: '+advice);
        } catch (err){
					errorLog.log('Error sending advice to chat.')
        }   
	  } else {
		  errorLog.log('Error hitting the random advice api.')
	  }
	})
}

function randomCat(){
	randomPuppy('catpictures')
		.then(url => {
			try{
				console.log('Random Cat: '+url);
				chat.broadcast('Random Cat: '+url);
			} catch (err){
				errorLog.log('Error sending cat picture to chat.')
			}	
	})	
}

function randomDog(){
	randomPuppy('dogpictures')
		.then(url => {
			try{
				console.log('Random Dog: '+url);
				chat.broadcast('Random Dog: '+url);
			} catch (err){
				errorLog.log('Error sending dog picture to chat.')
			}	
	})		
}

function randomCatFact(){
	//http://catfacts-api.appspot.com/api/facts
	var url = "http://catfacts-api.appspot.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var factUnclean = json.facts[0];
			var fact = validator.blacklist( factUnclean, /["']/g);
			try{
				console.log('Cat Fact: '+fact);
				chat.broadcast('Cat Fact: '+fact);
			} catch (err){
				errorLog.log('Error sending cat fact to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting the cat fact api.')
	  }
	})
}

function randomDogFact(){
	//https://dog-api.kinduff.com/api/facts
	var url = "https://dog-api.kinduff.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var factUnclean = json.facts[0];
			var fact = validator.blacklist( factUnclean, /["']/g);
			try{
				console.log('Dog Fact: '+fact);
				chat.broadcast('Dog Fact: '+fact);
			} catch (err){
				errorLog.log('Error sending dog fact to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting the dog fact api.')
	  }
	})
}

function randomPokemon(){
	//http://pokeapi.co/api/v2/pokemon/NUMBER (811 max)
	var random = Math.floor(Math.random() * 721) + 1;
	var url = "http://pokeapi.co/api/v2/pokemon/"+random+"/";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var name = json.name;
			var nameCap = toTitleCase(name);
			var info = "http://pokemondb.net/pokedex/"+name;
			
			var moveset = json.moves;
			var movedata = moveset[Math.floor(Math.random()*moveset.length)];
			var move = movedata['move'];
			var movename = move.name;
			
			try{
				var text = "I choose you "+nameCap+"! "+nameCap+" used "+movename+"! "+info 
				
				console.log('Pokemon: '+text);
				chat.broadcast('Pokemon: '+text);
			} catch (err){
				errorLog.log('Error sending pokemon to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting pokemon API.')
	  }
	})
}

function randomAww(){
	randomPuppy('aww')
		.then(url => {
			try{
				console.log('Random Aww: '+url);
				chat.broadcast('Random Aww: '+url);
			} catch (err){
				errorLog.log('Error sending Aww to chat.')
			}	
	})				
}

function numberTrivia(){
	// http://numbersapi.com/random
	var url = "http://numbersapi.com/random";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		console.log('Random Number Trivia:'+body);
       chat.broadcast('Number Trivia: '+body);
	  } else {
		  errorLog.log('Error sending Number Trivia to chat.')
	  }
	})
}

// Capitalize Name
function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Export Functions
exports.play = apiProcessor;
