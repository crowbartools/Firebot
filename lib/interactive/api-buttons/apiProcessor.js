const request = require('request');
const JsonDB = require('node-json-db');
const chat = require('../chat-connect.js');
const randomPuppy = require('random-puppy');
const validator = require('validator');

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
		var chatter = typeSettings['sendAs'];

		switch(apiType){
			case "Advice":
				randomAdvice(chatter);
				break;
			case "Cat Picture":
				randomCat(chatter);
				break;
			case "Cat Fact":
				randomCatFact(chatter);
				break;
			case "Dog Picture":
				randomDog(chatter);
				break;
			case "Dog Fact":
				randomDogFact(chatter);
				break;
			case "Aww":
				randomAww(chatter);
				break;
			case "Pokemon":
				randomPokemon(chatter);
				break;
			case "Number Trivia":
				numberTrivia(chatter);
				break;
			default:
				errorLog.log('There was an issue with button #'+rawid+' related to the name of the API. Try re-saving the button.');
		}

    } else if (holding > 0){
		errorLog.log('API Buttons should only have pressFrequency on in the dev lab.');
	}
}

function randomAdvice(chatter){
  var url = "http://api.adviceslip.com/advice";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var json = JSON.parse(body);
        var advice = json.slip["advice"];
        try{
            console.log('Advice: '+advice);
            chat.broadcast(chatter, 'Advice: '+advice);
        } catch (err){
					errorLog.log('Error sending advice to chat.')
        }   
	  } else {
		  errorLog.log('Error hitting the random advice api.')
	  }
	})
}

function randomCat(chatter){
	randomPuppy('catpictures')
		.then(url => {
			try{
				console.log('Random Cat: '+url);
				chat.broadcast(chatter, 'Random Cat: '+url);
			} catch (err){
				errorLog.log('Error sending cat picture to chat.')
			}	
	})	
}

function randomDog(chatter){
	randomPuppy('dogpictures')
		.then(url => {
			try{
				console.log('Random Dog: '+url);
				chat.broadcast(chatter, 'Random Dog: '+url);
			} catch (err){
				errorLog.log('Error sending dog picture to chat.')
			}	
	})		
}

function randomCatFact(chatter){
	//http://catfacts-api.appspot.com/api/facts
	var url = "http://catfacts-api.appspot.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var factUnclean = json.facts[0];
			var fact = validator.blacklist( factUnclean, /["']/g);
			try{
				console.log('Cat Fact: '+fact);
				chat.broadcast(chatter, 'Cat Fact: '+fact);
			} catch (err){
				errorLog.log('Error sending cat fact to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting the cat fact api.')
	  }
	})
}

function randomDogFact(chatter){
	//https://dog-api.kinduff.com/api/facts
	var url = "https://dog-api.kinduff.com/api/facts";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var factUnclean = json.facts[0];
			var fact = validator.blacklist( factUnclean, /["']/g);
			try{
				console.log('Dog Fact: '+fact);
				chat.broadcast(chatter, 'Dog Fact: '+fact);
			} catch (err){
				errorLog.log('Error sending dog fact to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting the dog fact api.')
	  }
	})
}

function randomPokemon(chatter){
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
				chat.broadcast(chatter, 'Pokemon: '+text);
			} catch (err){
				errorLog.log('Error sending pokemon to chat.')
			}		
	  } else {
		  errorLog.log('Error hitting pokemon API.')
	  }
	})
}

function randomAww(chatter){
	randomPuppy('aww')
		.then(url => {
			try{
				console.log('Random Aww: '+url);
				chat.broadcast(chatter, 'Random Aww: '+url);
			} catch (err){
				errorLog.log('Error sending Aww to chat.')
			}	
	})				
}

function numberTrivia(chatter){
	// http://numbersapi.com/random
	var url = "http://numbersapi.com/random";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		console.log('Random Number Trivia:'+body);
       chat.broadcast(chatter, 'Number Trivia: '+body);
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
