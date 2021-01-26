addObject({
	name: 'camera',
	prompt: '',
	target: null,
	speed: 5,
	create() {
		camera.scaleX = 2;
		camera.scaleY = 2;
	},
    step() {
		this.move();
		this.scale();
	},
	move() {
		if(this.target) {
			let xMove = this.x;
			let yMove = this.y;
			if (this.target.x < camera.x + camera.w() / 3) {
				if (this.target.x - camera.w() / 3 > 0)
					xMove = this.target.x - camera.w() / 3;
			} else if (this.target.x > camera.x + camera.w() * 2/3) {
				if (this.target.x + camera.w() / 3 < currentRoom.w)
					xMove = this.target.x - camera.w() * 2/3;
			}

			if (this.target.y < camera.y + camera.h() / 3) {
				if (this.target.y - camera.h() / 3 > 0)
					yMove = this.target.y - camera.h() / 3;
			} else if (this.target.y > camera.y + camera.h() * 2/3) {
				if (this.target.y + camera.h() / 3 < currentRoom.h)
					yMove = this.target.y - camera.h() * 2/3;
			}

			if (distanceBetween(this.x, this.y, this.target.x, this.target.y) > this.speed) {
				moveToPoint(this, xMove, yMove, this.speed);
				camera.x = this.x;
				camera.y = this.y;
			}
		} else {
			this.target = findNearest(this.prompt, this.x, this.y);
			if(this.target) {
				this.x = this.target.x - camera.w() / 2;
				this.y = this.target.y - camera.h() / 2; 
				camera.x = this.x;
				camera.y = this.y;
			}
		}
	},
	scale() {
		keyDown.forEach(code => {
			switch (code) {
				case 'KeyO':
					camera.scaleX *= 2;
					camera.scaleY *= 2;
					break;
				case 'KeyP':
					camera.scaleX /= 2;
					camera.scaleY /= 2;
					break;
			}
		});
	}
});