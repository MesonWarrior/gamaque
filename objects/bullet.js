addObject({
	name: 'bullet',
	sprite: sprites.get('bullet'),
	depth: -1,
	tpX: 16,
	tpY: 16,
	collider: {
		type: 'circle',
		r: 8,
	},
	scaleX: 0.5,
	scaleY: 0.5,
	speed: 6,
	dmg: 10,
	init: {
		x: 0,
		y: 0,
	},
	direction: {
		x: 1,
		y: 0,
	},
	destRad: 0,
	step() {
		this.x += this.speed * this.direction.x * deltaTime;
		this.y += this.speed * this.direction.y * deltaTime;

		if (this.rotation < 360 - 2) {
			this.rotation += 2;
		} else {
			this.rotation = 0;
		}

		if (distanceBetween(this.init.x, this.init.y, this.x, this.y) > this.distRad) {
			instanceDestroy(this);
		}
	},
	onDestroy() {
		const howMuch = random(2, 6);
		for (let i = 0; i < howMuch; i++) {
			instanceCreate('particle', this.x, this.y);
		}
	},
	collision(obj) {
		switch(obj.name) {
			case 'enemy':
				instanceDestroy(this);
				break;
			case 'solid':
				instanceDestroy(this);
				break;
		}
	},
	draw() {
		drawShadow(this.x, this.y + 8, 14, 6, 0.25);
		drawInstance(this);
	}
});