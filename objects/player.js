addObject({
	name: 'player',
	sprite: sprites.get('playerIdle'),
	depth: 0,
	tpX: 32,
	tpY: 32,
	scaleX: 0.5,
	scaleY: 0.5,
	collider: {
		type: 'box',
		x1: -8,
		y1: 0,
		x2: 8,
		y2: 16,
	},
	hp: 75,
	maxhp: 100,
	speed: 4,
	direction: {
		x: 0,
		y: 0,
	},
	inertia: 0,
	rad: 200,
	delay: 0,
	bulletSpeed: 5,
	state: 0,
	animationSpeed: 0.1,
	step() {
		this.animationSpeed = 0.1 * deltaTime;

		this.control();
		this.shoot();
		this.rotate();
		this.moving();
	},
	draw() {
		drawShadow(this.x, this.y + 8, 20, 8, 0.25);
		drawInstance(this);
		// const g = distanceBetween(mouse.x + camera.x, mouse.y + camera.y, this.x, this.y);
		// if (g > this.rad) {
		// 	drawEllipse(this.x - camera.x - this.rad, this.y - camera.y - this.rad, this.rad * 2, this.rad * 2, '#ffffff66');
		// }

		drawHpBar(8, camera.h() - 16, 100, 8, this.hp, this.maxhp);

		setFont('bold 24px sans-serif');
		setDrawColor('white');
		setLineWidth(1.5)
		drawText(this.hp + '/' + this.maxhp, 116, camera.h() - 8)
		setDrawColor('black');
		drawTextStroked(this.hp + '/' + this.maxhp, 116, camera.h() - 8)
	},
	control() {
		let x = 0;
		let y = 0;
		keyPress.forEach(code => {
			switch (code) {
				case 'KeyD':
					x += 1;
					break;
				case 'KeyA':
					x += -1;
					break;
				case 'KeyS':
					y += 1;
					break;
				case 'KeyW':
					y += -1;
					break;
			}
		});
		if (x !== 0 || y !== 0) {
			this.direction = {x, y};
			if (this.inertia < this.speed) {
				this.inertia += 0.35 * deltaTime;
			}
		}
	},
	shoot() {
		mousePress.forEach(button => {
			if (button === 0) {
				if (this.delay > this.bulletSpeed) {
					this.delay = 0;
					const bullet = instanceCreate('bullet', this.x, this.y)
					bullet.direction = getDirectionVector(this.x, this.y, mouse.x + camera.x, mouse.y + camera.y),
					bullet.init = {
						x: this.x,
						y: this.y,
					},
					bullet.distRad = this.rad;
				} else {
					this.delay += deltaTime;
				}
			}
		});
	},
	rotate() {
		if (mouse.x > this.x - camera.x) {
			this.scaleX = -0.5;
		} else {
			this.scaleX = 0.5;
		}
	},
	moving() {
		const direction = getDirectionVector(0, 0, this.direction.x, this.direction.y);

		const moveX = this.inertia * direction.x * deltaTime;
		const moveY = this.inertia * direction.y * deltaTime;

		if (!collisionCollider('solid', this.x + moveX, this.y, this.collider)) {
			this.x += moveX;
		}
		if (!collisionCollider('solid', this.x, this.y + moveY, this.collider)) {
			this.y += moveY;
		}

		if (this.inertia > 0) {
			this.inertia -= 0.2 * deltaTime;
			if (this.state !== 1) {
				this.state = 1;
				this.sprite = sprites.get('playerRun');
				this.frameNumber = 0;
			}
		} else {
			this.inertia = 0;
			if (this.state !== 0) {
				this.state = 0;
				this.sprite = sprites.get('playerIdle');
				this.frameNumber = 0;
			}
		}
	},
});