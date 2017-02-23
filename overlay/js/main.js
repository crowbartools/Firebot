function beamSocketConnect(){
	if ("WebSocket" in window){
		// Let us open a web socket
		ws = new ReconnectingWebSocket("ws://localhost:8080");
		ws.onopen = function(){
			console.log("Connection is opened...");
		};

		// When we get a message from the Firebot GUI...
		ws.onmessage = function (evt){
			var data = JSON.parse(evt.data);
			var event = data.event;
			
			// Route events to certain functions
			if (event == "image"){
				showImage(data);
			}
			
			if (event == "celebration"){
				celebrate(data);
			}
		};

		// Connection closed for some reason. Reconnecting Websocket will try to reconnect.
		ws.onclose = function(){
		  console.log("Connection is closed...");
		};

	} else {
		// The browser doesn't support WebSocket
		console.error("Woah, something broke. Abandon ship!");
	}
}
beamSocketConnect();

// Celebration Handler
// This will take the celebration request and decide what to do with it.
function celebrate(data){
	// Celebrate Packet
	//{"event": "celebration", "celebrationType": celebrationType, "celebrationDuration":celebrationDuration};
	var type = data.celebrationType;
	var duration = data.celebrationDuration;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	if (type == "fireworks"){
		var imageFinal = '<canvas id="fireworks" class="'+divClass+'-image celebration '+type+'" style="display:none;"></canvas>';

		// Throw div on page and start up.
		$('body').append(imageFinal);
		fireworks();
		$('.'+divClass+'-image').fadeIn('fast');

		setTimeout(function(){ 
			$('.'+divClass+'-image').fadeOut('fast', function(){
				$('.'+divClass+'-image').remove();
			});
		}, duration);
	}
}

// Image Handling
// This will take the data that is sent to it from the GUI and render an image on the overlay.
function showImage(data){
	// Image Packet...
	// {"event":"image","filepath":filepath, "imageX":imageX, "imageY":imageY, "imageDuration":imageDuration};
	var filepath = data.filepath;
	var filepathNew = filepath.replace(/\\/g,"/");
	var imagePosition = data.imagePosition;
	var imageDuration = data.imageDuration;

	// Get time in milliseconds to use as class name.
	var d = new Date();
	var divClass = d.getTime();

	var imageFinal = '<div class="'+divClass+'-image '+imagePosition+'" style="display:none;"><img src="file:///'+filepathNew+'?time='+divClass+'"></div>';
	
	$('body').append(imageFinal);
	$('.'+divClass+'-image').fadeIn('fast');

	setTimeout(function(){ 
		$('.'+divClass+'-image').fadeOut('fast', function(){
			$('.'+divClass+'-image').remove();
		});
	}, imageDuration);
}

// Error Handling & Keep Alive
function errorHandle(ws){
  var wsState = ws.readyState;
  if (wsState !== 1){
    // Connection not open.
    console.log('Ready State is '+wsState);
  } else {
    // Connection open, send keep alive.
    ws.send(2);
  }
}


// fireworks
function fireworks(){
	// Options
	var options = {
		/* Which hue should be used for the first batch of rockets? */
		startingHue: 120,
		/* How many ticks the script should wait before a new firework gets spawned, if the user is holding down his mouse button. */
		clickLimiter: 5,
		/* How fast the rockets should automatically spawn, based on ticks */
		timerInterval: 40,
		/* Show pulsing circles marking the targets? */
		showTargets: false,
		/* Rocket movement options, should be self-explanatory */
		rocketSpeed: 2,
		rocketAcceleration: 1.03,
		/* Particle movement options, should be self-explanatory */
		particleFriction: 0.95,
		particleGravity: 1,
		/* Minimum and maximum amount of particle spawns per rocket */
		particleMinCount: 25,
		particleMaxCount: 40,
		/* Minimum and maximum radius of a particle */
		particleMinRadius: 3,
		particleMaxRadius: 8
	};

	// Local variables
	var fireworks = [];
	var particles = [];
	var mouse = {down: false, x: 0, y: 0};
	var currentHue = options.startingHue;
	var clickLimiterTick = 0;
	var timerTick = 0;

	// Helper function for canvas animations
	window.requestAnimFrame = (function() {
		return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(cb) {
				window.setTimeout(callback, 1000 / 60);
			}
	})();

	// Helper function to return random numbers within a specified range
	function random(min, max) {
		return Math.random() * (max - min) + min;
	}

	// Helper function to calculate the distance between 2 points
	function calculateDistance(p1x, p1y, p2x, p2y) {
		var xDistance = p1x - p2x;
		var yDistance = p1y - p2y;
		return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
	}

	// Setup some basic variables
	var canvas = document.getElementById('fireworks');
	var canvasCtx = canvas.getContext('2d');
	var canvasWidth = window.innerWidth;
	var canvasHeight = window.innerHeight;

	// Resize canvas
	canvas.width = canvasWidth;
	canvas.height = canvasHeight;

	// Firework class
	function Firework(sx, sy, tx, ty) {  
		// Set coordinates (x/y = actual, sx/sy = starting, tx/ty = target)
		this.x = this.sx = sx;
		this.y = this.sy = sy;
		this.tx = tx; this.ty = ty;
		
		// Calculate distance between starting and target point
		this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
		this.distanceTraveled = 0;

		// To simulate a trail effect, the last few coordinates will be stored
		this.coordinates = [];
		this.coordinateCount = 3;
		
		// Populate coordinate array with initial data
		while(this.coordinateCount--) {
			this.coordinates.push([this.x, this.y]);
		}
		
		// Some settings, you can adjust them if you'd like to do so.
		this.angle = Math.atan2(ty - sy, tx - sx);
		this.speed = options.rocketSpeed;
		this.acceleration = options.rocketAcceleration;
		this.brightness = random(50, 80);
		this.hue = currentHue;
		this.targetRadius = 1;
		this.targetDirection = false;  // false = Radius is getting bigger, true = Radius is getting smaller
	};

	// This method should be called each frame to update the firework
	Firework.prototype.update = function(index) {
		// Update the coordinates array
		this.coordinates.pop();
		this.coordinates.unshift([this.x, this.y]);
		
		// Cycle the target radius (used for the pulsing target circle)
		if(!this.targetDirection) {
			if(this.targetRadius < 8)
				this.targetRadius += 0.15;
			else
				this.targetDirection = true;  
		} else {
			if(this.targetRadius > 1)
				this.targetRadius -= 0.15;
			else
				this.targetDirection = false;
		}
		
		// Speed up the firework (could possibly travel faster than the speed of light) 
		this.speed *= this.acceleration;
		
		// Calculate the distance the firework has travelled so far (based on velocities)
		var vx = Math.cos(this.angle) * this.speed;
		var vy = Math.sin(this.angle) * this.speed;
		this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);
		
		// If the distance traveled (including velocities) is greater than the initial distance
		// to the target, then the target has been reached. If that's not the case, keep traveling.
		if(this.distanceTraveled >= this.distanceToTarget) {
			createParticles(this.tx, this.ty);
			fireworks.splice(index, 1);
		} else {
			this.x += vx;
			this.y += vy;
		}
	};

	// Draws the firework
	Firework.prototype.draw = function() {
		var lastCoordinate = this.coordinates[this.coordinates.length - 1];
		
		// Draw the rocket
		canvasCtx.beginPath();
		canvasCtx.moveTo(lastCoordinate[0], lastCoordinate[1]);
		canvasCtx.lineTo(this.x, this.y);
		canvasCtx.strokeStyle = 'hsl(' + this.hue + ',100%,' + this.brightness + '%)';
		canvasCtx.stroke();
		
		// Draw the target (pulsing circle)
		if(options.showTargets) {
			canvasCtx.beginPath();
			canvasCtx.arc(this.tx, this.ty, this.targetRadius, 0, Math.PI * 2);
			canvasCtx.stroke();
		}
	};

	// Particle class
	function Particle(x, y) {
		// Set the starting point
		this.x = x;
		this.y = y;
		
		// To simulate a trail effect, the last few coordinates will be stored
		this.coordinates = [];
		this.coordinateCount = 5;
		
		// Populate coordinate array with initial data
		while(this.coordinateCount--) {
			this.coordinates.push([this.x, this.y]);
		}
		
		// Set a random angle in all possible directions (radians)
		this.angle = random(0, Math.PI * 2);
		this.speed = random(1, 10);
		
		// Add some friction and gravity to the particle
		this.friction = options.particleFriction;
		this.gravity = options.particleGravity;
		
		// Change the hue to a random number
		this.hue = random(currentHue - 20, currentHue + 20);
		this.brightness = random(50, 80);
		this.alpha = 1;
		
		// Set how fast the particles decay
		this.decay = random(0.01, 0.03);
	}

	// Updates the particle, should be called each frame
	Particle.prototype.update = function(index) {
		// Update the coordinates array
		this.coordinates.pop();
		this.coordinates.unshift([this.x, this.y]);
		
		// Slow it down (based on friction)
		this.speed *= this.friction;
		
		// Apply velocity to the particle
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed + this.gravity;
		
		// Fade out the particle, and remove it if alpha is low enough
		this.alpha -= this.decay;
		if(this.alpha <= this.decay) {
			particles.splice(index, 1);
		}
	}

	// Draws the particle
	Particle.prototype.draw = function() {
		var lastCoordinate = this.coordinates[this.coordinates.length - 1];
		var radius = Math.round(random(options.particleMinRadius, options.particleMaxRadius));
		
		// Create a new shiny gradient
		var gradient = canvasCtx.createRadialGradient(this.x, this.y, 0, this.x, this.y, radius);
		gradient.addColorStop(0.0, 'white');
		gradient.addColorStop(0.1, 'white');
		gradient.addColorStop(0.1, 'hsla(' + this.hue + ',100%,' + this.brightness + '%,' + this.alpha + ')');
		gradient.addColorStop(1.0, 'black');
		
		// Draw the gradient
		canvasCtx.beginPath();
		canvasCtx.fillStyle = gradient;
		canvasCtx.arc(this.x, this.y, radius, Math.PI * 2, false);
		canvasCtx.fill();
	}

	// Create a bunch of particles at the given position
	function createParticles(x, y) {
		var particleCount = Math.round(random(options.particleMinCount, options.particleMaxCount));
		while(particleCount--) {
			particles.push(new Particle(x, y));
		}
	}

	// Add an event listener to the window so we're able to react to size changes
	window.addEventListener('resize', function(e) {
		canvas.width = canvasWidth = window.innerWidth;
		canvas.height = canvasHeight = window.innerHeight;
	});

	// Add event listeners to the canvas to handle mouse interactions
	canvas.addEventListener('mousemove', function(e) {
		e.preventDefault();
		mouse.x = e.pageX - canvas.offsetLeft;
		mouse.y = e.pageY - canvas.offsetTop;
	});

	canvas.addEventListener('mousedown', function(e) {
		e.preventDefault();
		mouse.down = true;
	});

	canvas.addEventListener('mouseup', function(e) {
		e.preventDefault();
		mouse.down = false;
	});

	// Main application / script, called when the window is loaded
	function gameLoop() {
		// This function will rund endlessly by using requestAnimationFrame (or fallback to setInterval)
		requestAnimFrame(gameLoop);
		
		// Increase the hue to get different colored fireworks over time
		currentHue += 0.5;
		
		// 'Clear' the canvas at a specific opacity, by using 'destination-out'. This will create a trailing effect.
		canvasCtx.globalCompositeOperation = 'destination-out';
		canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
		canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
		canvasCtx.globalCompositeOperation = 'lighter';
		
		// Loop over all existing fireworks (they should be updated & drawn)
		var i = fireworks.length;
		while(i--) {
			fireworks[i].draw();
			fireworks[i].update(i);
		}
		
		// Loop over all existing particles (they should be updated & drawn)
		var i = particles.length;
		while(i--) {
			particles[i].draw();
			particles[i].update(i);
		}
		
		// Launch fireworks automatically to random coordinates, if the user does not interact with the scene
		if(timerTick >= options.timerInterval) {
			if(!mouse.down) {
				fireworks.push(new Firework(canvasWidth / 2, canvasHeight, random(0, canvasWidth), random(0, canvasHeight / 2)));
				timerTick = 0;
			}
		} else {
			timerTick++;
		}
		
		// Limit the rate at which fireworks can be spawned by mouse
		if(clickLimiterTick >= options.clickLimiter) {
			if(mouse.down) {
				fireworks.push(new Firework(canvasWidth / 2, canvasHeight, mouse.x, mouse.y));
				clickLimiterTick = 0;
			}
		} else {
			clickLimiterTick++;
		}
	}

	// Start it up.
	gameLoop();
}
