addObject({
    name: 'enemyDead',
    sprite: sprites.get('enemyRun'),
    animationSpeed: 0,
    depth: -1,
    tpX: 16,
	tpY: 16,
    rotation: 90,
    step() {
        this.opacity -= 0.025;
        if (this.opacity <= 0) {
            instanceDestroy(this);
        }
    }
})