addObject({
    name: 'particle',
    sprite: sprites.get('particle'),
    direction: {
        x: 0,
        y: 0,
    },
    speed: 0,
    size: 0,
    create() {
        this.direction = {
            x: randomFloat(-1, 1),
            y: randomFloat(-1, 1),
        }
        this.speed = randomFloat(1, 3);
        this.size = randomFloat(1, 3);
    },
    step() {
        this.x += this.direction.x * this.speed * deltaTime;
        this.y += this.direction.y * this.speed * deltaTime;
        this.scaleX = this.size;
        this.scaleY = this.size;
        this.size -= 0.1 * deltaTime;
        this.opacity -= 0.025 / this.size * deltaTime;
        if (this.size <= 0) {
            instanceDestroy(this);
        }
    },
});