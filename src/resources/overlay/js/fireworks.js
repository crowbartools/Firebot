// fireworks
function fireworks(){

	var Fireworks, GRAVITY, K, SPEED, ToRadian, canvas, context, ctx, fireBoss, repeat, stage;

	canvas = document.getElementById("fireworks");

	context = canvas.getContext("2d");

	canvas.width = window.innerWidth;

	canvas.height = window.innerHeight;

	stage = new createjs.Stage(canvas);
	stage.autoClear = false;

	ctx = canvas.getContext("2d");

	ctx.fillStyle = "rgba(0, 0, 0, 0)";

	ctx.fillRect(0, 0, canvas.width, canvas.height);

	createjs.Ticker.setFPS(50);

	createjs.Touch.enable(stage);

	stage.update();

	GRAVITY = 1;

	K = 0.9;

	SPEED = 12;

	ToRadian = function(degree) {
	return degree * Math.PI / 180.0;
	};

	Fireworks = (function() {
	function Fireworks(sx, sy, particles) {
		var circle, i, j, rad, ref, speed;
		this.sx = sx != null ? sx : 100;
		this.sy = sy != null ? sy : 100;
		this.particles = particles != null ? particles : 70;
		this.sky = new createjs.Container();
		this.r = 0;
		this.h = Math.random() * 360 | 0;
		this.s = 100;
		this.l = 50;
		this.size = 3;
		for (i = j = 0, ref = this.particles; 0 <= ref ? j < ref : j > ref; i = 0 <= ref ? ++j : --j) {
		speed = Math.random() * 12 + 2;
		circle = new createjs.Shape();
		circle.graphics.f("hsla(" + this.h + ", " + this.s + "%, " + this.l + "%, 1)").dc(0, 0, this.size);
		circle.snapToPixel = true;
		circle.compositeOperation = "lighter";
		rad = ToRadian(Math.random() * 360 | 0);
		circle.set({
			x: this.sx,
			y: this.sy,
			vx: Math.cos(rad) * speed,
			vy: Math.sin(rad) * speed,
			rad: rad
		});
		this.sky.addChild(circle);
		}
		stage.addChild(this.sky);
	}

	Fireworks.prototype.explode = function() {
		var circle, j, p, ref;
		if (this.sky) {
		++this.h;
		for (p = j = 0, ref = this.sky.getNumChildren(); 0 <= ref ? j < ref : j > ref; p = 0 <= ref ? ++j : --j) {
			circle = this.sky.getChildAt(p);
			circle.vx = circle.vx * .95;
			circle.vy = circle.vy * .95;
			circle.x += circle.vx;
			circle.y += circle.vy + GRAVITY;
			this.l = Math.random() * 100;
			this.size = this.size + 0.0015;
			if (this.size > 0) {
				circle.graphics.c().f("hsla(" + this.h + ", 100%, " + this.l + "%, 1)").dc(0, 0, this.size);
			}
		}
		if (this.sky.alpha > 0.1) {
			this.sky.alpha -= K / 100;
		} else {
			stage.removeChild(this.sky);
			this.sky = null;
		}
		} else {

		}
	};

	return Fireworks;

	})();

	fireBoss = [];

	setInterval(function() {
		var x, y;
		x = Math.random() * canvas.width | 0;
		y = Math.random() * canvas.height | 0;
		fireBoss.push(new Fireworks(x, y));
		return fireBoss.push(new Fireworks(x, y));
	}, 1300);

	repeat = function() {
	var fireworks, j, ref;
		for (fireworks = j = 0, ref = fireBoss.length; 0 <= ref ? j < ref : j > ref; fireworks = 0 <= ref ? ++j : --j) {
			if (fireBoss[fireworks].sky) {
				fireBoss[fireworks].explode();
			}
		}

		// Clear Stage
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Update Stage
		stage.update();
	};

	createjs.Ticker.on("tick", repeat);


	return stage;

} // End Fireworks