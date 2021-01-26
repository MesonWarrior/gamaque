startGame({
	fps: 60,
	background: '#000',
	spritesRoot: 'sprites',
	tilesRoot: 'tiles',
	scriptsRoot: 'scripts',
	objectsRoot: 'objects',
	roomsRoot: 'rooms',
	soundsRoot: 'sounds',
	sprites: [
		['playerIdle', 'player/idle.png'],
		['playerRun', [...fromTo(0,1)].map(i => `player/run/${i}.png`)],
		['enemyRun', [...fromTo(0,9)].map(i => `enemy/run/${i}.gif`)],
		['enemyAtack', [...fromTo(0,1)].map(i => `enemy/atack/${i}.gif`)],
		['bullet', 'bullet.png'],
		['particle', 'particle.png'],
		['cursor', 'cursor.png'],
		['empty', 'empty.png'],
	],
	tiles: [
		['mapTiles', 'mapTiles.png']
	],
	scripts: [
		'scripts.js', 
		'globals.js',
	],
	objects: [
		'player.js',
		'bullet.js',
		'enemy.js',
		'particle.js',
		'camera.js',
		'enemyDead.js',
		'controller.js',
		'cursor.js',
		'solid.js',
	],
	rooms: [
		{
			name: 'map',
			path: 'map.js',
			tileLayers: [
				['mapTiles', 100],
				['mapTiles', 101],
			],
		},
	],
	sounds: [],
	entryPoint: 'map',
	debug: {
		fps: true,
		colliders: false,
	}
});