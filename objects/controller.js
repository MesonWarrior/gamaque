addObject({
    name: 'controller',
    create() {
        const camera = instanceCreate('camera', 0, 0);
        camera.prompt = 'player';
        instanceCreate('cursor', mouse.x, mouse.y);
    }
});