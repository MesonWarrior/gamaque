addObject({
    name: 'cursor',
    sprite: sprites.get('cursor'),
    tpX: 4,
    tpY: 4,
    step() {
        this.x = mouse.x + camera.x;
        this.y = mouse.y + camera.y;
    }
})