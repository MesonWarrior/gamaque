addObject({
	name: 'enemy',
	sprite: sprites.get('enemyRun'),
	depth: -1,
	tpX: 16,
	tpY: 16,
	animationSpeed: 0.1,
	collider: {
		type: 'box',
		x1: -8,
		y1: -16,
		x2: 8,
		y2: 16,
	},
	target: null,
	state: 0,
	count: 0,
	speed: 1,
	hp: 100,
	maxHp: 100,
	step() {
		this.animationSpeed = 0.1 * deltaTime;

		if (!this.target) {
			this.target = findNearest('player', this.x, this.y);
		}

		if (this.target.x > this.x) {
			this.scaleX = 1;
		} else {
			this.scaleX = -1;
		}

		moveToPoint(this, this.target.x, this.target.y, this.speed * deltaTime);

		if (distanceBetween(this.x, this.y, this.target.x, this.target.y) < 96) {
			if (this.state === 0) {
				this.state = 1;
				this.sprite = sprites.get('enemyAtack');
				this.frameNumber = 0;
			}

			if (distanceBetween(this.x, this.y, this.target.x, this.target.y) < 32) {
				this.speed = 0;
			} else {
				this.speed = 2;
			}

			if (this.count > 10) {
				const howMuch = random(2, 6);
				for (let i = 0; i < howMuch; i++) {
					instanceCreate('particle', this.x, this.y);
				}
				this.count = 0;
			} else {
				this.count++;
			}
		} else {
			if (this.state === 1) {
				this.state = 0;
				this.sprite = sprites.get('enemyRun');
				this.frameNumber = 0;
				this.speed = 1;
			}
		}
	},
	onDestroy() {
		instanceCreate('enemyDead', this.x, this.y);
	},
	collision(obj) {
		switch(obj.name) {
			case 'bullet':
				this.hp -= obj.dmg;
				if (this.hp <= 0) {
					instanceDestroy(this);
				}
				break;
		}
	},
	draw() {
		drawShadow(this.x, this.y + 8, 20, 8, 0.25);
		drawInstance(this);
		drawHpBar(this.x - 10 - camera.x, this.y - 20 - camera.y, 20, 3, this.hp, this.maxHp);
	}
});