const request = require('request');
const chat = require('../mixer-chat.js');
const randomPuppy = require('random-puppy');
const validator = require('validator');

// API Processor
// This takes the packet, figures out the type, and then the the api function.
function apiProcessor(effect){
    var apiType = effect.api;
    var chatter = effect.chatter;

    // Do something based on api type.
    if(apiType == "Advice"){
        randomAdvice(chatter);
    } else if (apiType == "Cat Picture"){
        randomCat(chatter);
    } else if (apiType == "Cat Fact"){
        randomCatFact(chatter);
    } else if (apiType == "Dog Picture"){
        randomDog(chatter);
    } else if (apiType == "Dog Fact"){
        randomDogFact(chatter);
    } else if (apiType == "Aww"){
        randomAww(chatter);
    } else if (apiType == "Pokemon"){
        randomPokemon(chatter);
    } else if (apiType == "Number Trivia"){
        numberTrivia(chatter);
    } else if (apiType == "Dad Joke"){
		dadJoke(chatter)
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
			renderWindow.webContents.send('error', "There was an error sending advice to chat.");
        }   
	  } else {
		  renderWindow.webContents.send('error', "I couldnt connect to the advice API. It may be down.");
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
				renderWindow.webContents.send('error', "There was an error sending a cat picture to chat.");
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
				renderWindow.webContents.send('error', "There was an error sending a dog picture to chat.");
			}	
	})		
}

function randomCatFact(chatter){
	//http://catfacts-api.appspot.com/api/facts
	var url = "https://catfact.ninja/fact";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
			var json = JSON.parse(body);
			var factUnclean = json.fact;
			var fact = validator.blacklist( factUnclean, /["']/g);
			try{
				console.log('Cat Fact: '+fact);
				chat.broadcast(chatter, 'Cat Fact: '+fact);
			} catch (err){
				renderWindow.webContents.send('error', "There was an error sending a cat fact to chat.");
			}		
	  } else {
		  renderWindow.webContents.send('error', "I couldnt connect to the cat fact api. It may be down.");
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
				renderWindow.webContents.send('error', "There was an error sending a dog fact to chat.");
			}		
	  } else {
		  renderWindow.webContents.send('error', "I couldnt conenct to the dog fact api. It may be down.");
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
				renderWindow.webContents.send('error', "There was an error sending a pokemon to chat.");
			}		
	  } else {
		  renderWindow.webContents.send('error', "I couldnt hit the pokemon api. It may be down.");
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
				renderWindow.webContents.send('error', "There was an error sending aww picture to chat.");
			}	
	})				
}

function numberTrivia(chatter){
	// http://numbersapi.com/random
	var url = "http://numbersapi.com/random";
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		try{
			console.log('Random Number Trivia:'+body);
			chat.broadcast(chatter, 'Number Trivia: '+body);
		}catch(err){
			renderWindow.webContents.send('error', "There was an error sending number trivia to chat.");
		}
	  } else {
		  renderWindow.webContents.send('error', "I couldnt connect to the number trivia api. It may be down.");
	  }
	})
}

function dadJoke(chatter){
	var options = {
		url: "https://icanhazdadjoke.com/",
		headers: {
			'Accept': "Application/json",
			'User-Agent': "Firebot Mixer Interactive - (https://firebot.pro) - firebottle@firebottle.tv"
		}
	}
	request(options, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			console.log(body);
			var json = JSON.parse(body);
			var joke = json.joke;
			try{
				console.log('Dad Joke: '+joke);
				chat.broadcast(chatter, 'Dad Joke: '+joke);
			} catch (err){
				renderWindow.webContents.send('error', "There was an error sending dad joke to chat.");
			}   
		} else {
			renderWindow.webContents.send('error', "I couldnt connect to the dad joke API. It may be down.");
		}
	})
  }

// Capitalize Name
function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

// Export Functions
exports.go = apiProcessor;
