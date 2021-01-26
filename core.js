'use strict'
//канвас и его контекст для работы с ним
const canvas = document.querySelector('#canvas');
const ctx = canvas.getContext('2d');

//объекты и их экземпляры
const objects = [];
let instances = [];

let currentId = 0;

//cпрайты
const sprites = new Map();

//тайлы
const tiles = new Map();

//звуки
const sounds = new Map();

//комнаты
const rooms = [];

//текущая комната
let currentRoom = null;

//разница во времени между кадрами
let deltaTime = 0;
let timePrevious = Date.now();

//камера
const camera = {
	x: 0,
	y: 0,
	scaleX: 1,
	scaleY: 1,
	w() {
		return canvas.offsetWidth / this.scaleX;
	},
	h() {
		return canvas.offsetHeight / this.scaleY;
	},
};

const getCoordsScaled = (x, y) => {
	return {
		x: x * camera.scaleX,
		y: y * camera.scaleY,
	}
}

const getCoordsScaledMax = (x, y, w, h) => {
	return {
		x: x * camera.scaleX,
		y: y * camera.scaleY,
		w: w * camera.scaleX,
		h: h * camera.scaleY,
	}
}

//координаты мыши
const mouse = {
	x: 0,
	y: 0,
};

//конфигурация игры
let config = {};

//буфферы c необходимыми значениями с ивентов
let keyDown = new Set();
let keyUp = new Set();
let keyPress = new Set();
let mouseDown = new Set();
let mouseUp = new Set();
let mousePress = new Set();

//fps и отрисовка фпc
let frames = 0;
let fps = 0;

const calculateFps = () => {
	fps = frames;
	frames = 0;
}

const drawFps = () => {
	ctx.save();
	let color = 'black';
	const step = config.fps / 10;
	if (fps > config.fps - step) {
		color = '#00dd00';
	} else if (fps > config.fps - 2 * step) {
		color = '#dddd00';
	} else {
		color = '#dd0000';
	}
	ctx.fillStyle = color;
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 2;
	ctx.font = 'bold 48px sans-serif';
	ctx.fillText(fps, 10, 50);
	ctx.strokeText(fps, 10, 50);
	ctx.restore();
}

//подключение одного или более скрипта по адресу или руту и адресу относительно него
const include = (path) => {
    var script = document.createElement('script');
    script.src = path;
    document.querySelector('head').appendChild(script);
}

const includeMany = (path, items) => {
	items.forEach(item => {
		include(`${path}/${item}`);
	});
}

//инициализация экземпляра объекта по объекту или его имени и координатам
const instanceCreateObj = (object) => {
	const newInstance = {...object, id: currentId};
	currentId++;
	//instances.push(newInstance);
	if (newInstance.create) {
		newInstance.create();
	}
	/*instances = instances.sort((a, b) => {
		if(a.depth === b.depth) {
			return 0; 
		} else {
			return a.depth < b.depth ? 1 : -1;
		}
	});*/
	let index = instances.findIndex(instance => {
		return newInstance.depth >= instance.depth;
	});
	if (index === -1) index = instances.length;
	instances = instances.slice(0, index).concat(newInstance).concat(instances.slice(index, instances.length));
	drawInstance(newInstance);
	return newInstance;
}

const instanceCreate = (name, x, y) => {
	const object = objects.find(obj => obj.name === name);
	if (object) {
		return instanceCreateObj({...object, x, y});
	} else {
		console.error(`Нет объекта с именем "${name}"`);
		return null;
	}
}

//найти ближайший инстанс
const findNearest = (name, x, y) => {
	const filtredInstances = instances.filter(instance => instance.name === name);
	let i = null;
	let min = Infinity;
	filtredInstances.forEach((instance, index) => {
		const distance = distanceBetween(x, y, instance.x, instance.y);
		if (distance < min) {
			min = distance;
			i = index;
		}
	})
	return filtredInstances[i];
}

//удаление инстанса
const instanceDestroy = (instance) => {
	if (instance.onDestroy) {
		instance.onDestroy();
	}
	instances = instances.filter(item => item.id !== instance.id);
}

//старт игры
const startGame = (initConfig) => {
	config = initConfig;

	window.addEventListener('load', () => goToRoom(config.entryPoint));

	includeMany(config.scriptsRoot, config.scripts);
	includeMany(config.objectsRoot, config.objects);
	includeMany(config.roomsRoot, config.rooms.map(room => room.path));
	config.sprites.forEach(sprite => {
		loadSprite(sprite[0], sprite[1]);
	});
	config.tiles.forEach(tile => {
		loadTile(tile[0], tile[1]);
	});
	config.sounds.forEach(audio => {
		loadSound(audio[0], audio[1]);
	});
	resizeCanvas();

	if (config.debug.fps) {
		setInterval(calculateFps, 1000);
	}
	
	setInterval(frame, 1000/config.fps);
}

//отрисовка одного кадра игры
const frame = () => {
	frames++;

	const timeCurrent = Date.now();
	deltaTime = (timeCurrent - timePrevious) / 1000 * config.fps;
	timePrevious = timeCurrent;

	ctx.fillStyle = config.background;
	ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

	//проверка коллизий
	let tempInstances = [...instances];
	while(tempInstances.length > 1) {
		const [current, ...another] = tempInstances;
		another.forEach(instance => {
			if(instance.collider && current.collider) {
				if (checkCollision(instance, current)) {
					if (current.collision) {
						current.collision(instance);
					}
					if (instance.collision) {
						instance.collision(current);
					}
				}
			}
		});
		tempInstances = another;
	}

	instances.forEach(instance => {
		if (instance.tile) {
			ctx.save();
			ctx.scale(camera.scaleX, camera.scaleY);
			//отрисовка тайлов
			instance.tiles.forEach(tile => {
				const screenX = tile.x - camera.x;
				const screenY = tile.y - camera.y;
				//проверка на то, входит ли тайл в границы канваса
				if (
					screenX + instance.tileSize.w > 0 && 
					screenY + instance.tileSize.h > 0 && 
					screenX < canvas.width / camera.scaleX && 
					screenY < canvas.height / camera.scaleY
				) {
					drawTile(instance, tile);
				}
			});
			ctx.restore();
		} else {
			//перед событиями которые могут изменить координаты запоминаем значения координат и записываем из после
			const xPrevious = instance.x;
			const yPrevious = instance.y;

			if (instance.step) {
				instance.step();
			}

			if (!instance.draw) {
				drawInstance(instance);
			} else {
				ctx.save();
				instance.draw();
				ctx.restore();
			}

			//отображение коллайдеров при дебаге
			if (config.debug.colliders) {
				if (instance.collider) {
					setDrawColor('white');
					switch (instance.collider.type) {
						case 'box':
							drawRect(instance.x + instance.collider.x1 - camera.x, 
								instance.y + instance.collider.y1 - camera.y, 
								instance.collider.x2 - instance.collider.x1,
								instance.collider.y2 - instance.collider.y1);
							break;
						case 'circle':
							drawEllipse(instance.x - instance.collider.r - camera.x,
								instance.y - instance.collider.r - camera.y,
								instance.collider.r * 2,
								instance.collider.r * 2);
							break;
					}
				}
			}

			instance.xPrevious = xPrevious;
			instance.yPrevious = yPrevious;
		}
	});

	//очистка буфферов ивентов каждый фрейм
	keyDown = new Set();
	keyUp = new Set();
	mouseDown = new Set();
	mouseUp = new Set();

	if (config.debug.fps) {
		drawFps();
	}
}

//отрисовка одного инстанса
const drawInstance = (instance) => {
	if (instance.sprite) {
		ctx.save();
		ctx.translate(Math.floor((instance.x - camera.x) * camera.scaleX), Math.floor((instance.y - camera.y) * camera.scaleY));
		ctx.rotate(instance.rotation * Math.PI / 180);
		ctx.scale(instance.scaleX * camera.scaleX, instance.scaleY * camera.scaleY);
		ctx.globalAlpha = instance.opacity >= 0 ? instance.opacity : 0;
		ctx.drawImage(instance.sprite[Math.floor(instance.frameNumber)], Math.floor(-instance.tpX), Math.floor(-instance.tpY));
		const nextFrame = instance.frameNumber + instance.animationSpeed;
		instance.frameNumber = nextFrame < instance.sprite.length ? nextFrame : 0;
		ctx.restore();
	}
} 

//отрисовка одного тайла
const drawTile = (instance, tile) => {
	ctx.drawImage(
		instance.tile, 
		Math.floor(tile.tx), 
		Math.floor(tile.ty), 
		instance.tileSize.w, 
		instance.tileSize.h, 
		Math.floor(tile.x - camera.x), 
		Math.floor(tile.y - camera.y), 
		instance.tileSize.w, 
		instance.tileSize.h
	);
} 

//добавление объекта в список объектов
const addObject = (object) => {
	//необязательные поля инициализируются значениями по умолчанию
	if (object.x === undefined) object.x = 0;
	if (object.y === undefined) object.y = 0;
	if (object.tpX === undefined) object.tpX = 0;
	if (object.tpY === undefined) object.tpY = 0;
	if (object.scaleX === undefined) object.scaleX = 1;
	if (object.scaleY === undefined) object.scaleY = 1;
	if (object.rotation === undefined) object.rotation = 0;
	if (object.opacity === undefined) object.opacity = 1;
	if (object.depth === undefined) object.depth = 0;
	if (object.frameNumber === undefined) object.frameNumber = 0;
	if (object.animationSpeed === undefined) object.animationSpeed = 1;
	if (object.xPrevious === undefined) object.xPrevious = null;
	if (object.yPrevious === undefined) object.yPrevious = null;
	if (object.sprite === undefined) object.sprite = null;
	if (object.collider === undefined) object.collider = null;

	objects.push(object);
}

const loadSound = (name, sound) => {
	const audio = new Audio();
	audio.src = `${config.soundsRoot}/${sound}`;
	sounds.set(name, audio);
}

const playSound = (name, volume = 1, loop = false) => {
	const sound = sounds.get(name);
	sound.loop = loop;
	sound.volume = volume;
	sound.load();
	sound.play();
}

//сохраняется изображение или список изображений по адресу указанному в sprite, для следующей отрисовки
const loadSprite = (name, sprite) => {
	const images = [].concat(sprite);
	const imgs = [];
	images.forEach((image, i) => {
		const img = new Image();
		img.src = `${config.spritesRoot}/${image}`;
		imgs.push(img);
	});
	sprites.set(name, imgs);
}

const loadTile = (name, tile) => {
	const img = new Image();
	img.src = `${config.tilesRoot}/${tile}`;
	tiles.set(name, img);
}

//изменение размера канваса при изменении размера браузера
const resizeCanvas = () => {
	canvas.width = Math.floor(canvas.offsetWidth);
	canvas.height = Math.floor(canvas.offsetHeight);

	//отключение сглаживания
	ctx.imageSmoothingEnabled = false;
}

//слушатели ивентов
document.addEventListener('keydown', (e) => {
	if (!keyPress.has(e.code)) {
		keyDown.add(e.code);
		keyPress.add(e.code);
	}
});
document.addEventListener('keyup', (e) => {
	keyUp.add(e.code);
	keyPress.delete(e.code);
});
canvas.addEventListener('mousedown', (e) => {
	mouseDown.add(e.button);
	mousePress.add(e.button);
});
document.addEventListener('mouseup', (e) => {
	mouseUp.add(e.button);
	mousePress.delete(e.button);
});
document.addEventListener('mousemove', (e) => {
	mouse.x = e.clientX / camera.scaleX;
	mouse.y = e.clientY / camera.scaleY;
});

window.addEventListener('resize', resizeCanvas);

//обработка карт с Tiled
const onTileMapLoaded = (name, data) => {
	rooms.push({
		//name,
		layers: data.layers,
		tileheight: data.tileheight,
		tilewidth: data.tilewidth,
		width: data.width,
		height: data.height,
		...config.rooms.find((room) => name === room.name)
	});
}

//перейти в комнату
const goToRoom = (name) => {
	instances = [];
	const room = rooms.find(room => room.name === name);
	if (room) {
		const tileSize = {
			h: room.tileheight,
			w: room.tilewidth,
		};
		currentRoom = {
			name: room.name,
			w: room.width * tileSize.w,
			h: room.height * tileSize.h,
		};
		
		let layerCount = 0;
		room.layers.forEach(layer => {
			switch (layer.type) {
				//инстанциирование всех объектов
				case 'objectgroup':
					layer.objects.forEach(object => {
						if (object.width === 0 && object.height === 0) {
							instanceCreate(object.name, object.x, object.y)
						} else {
							const instance = instanceCreate(object.name, object.x, object.y)
							//если есть спрайт можем растянуть
							if (instance.sprite && instance.sprite.length) {
								instance.tpX = 0;
								instance.tpY = 0;
								instance.scaleX = object.width / instance.sprite[0].width;
								instance.scaleY = object.height / instance.sprite[0].height;
								//если есть коллайдер делаем бокс коллайдер на весь объект
								if(instance.collider) {
									instance.collider = {
										type: 'box',
										x1: 0,
										y1: 0,
										x2: object.width,
										y2: object.height,
									}
								}
							}
						}
					});
					break;
				//загрузка тайлсета и нарезка на тайлы, чтобы в будущем их было проще отрисовывать
				case 'tilelayer':
					const tile = tiles.get(room.tileLayers[layerCount][0]);
					const instanceTiles = [];
					let x = 0;
					let y = 0;
					layer.data.forEach(id => {
						if (x >= layer.width * tileSize.w) {
							x = 0;
							y += tileSize.h;
						}
						if (id !== 0) {
							const tx = ((id - 1) * tileSize.w) % tile.width;
							const ty = Math.floor(((id - 1) * tileSize.w) / tile.width) * tileSize.h;
							instanceTiles.push({x, y, tx, ty});
						}
						x += tileSize.w;
					});
					instances.push({
						name: `__tileLayer${layerCount}`,
						tile,
						tiles: instanceTiles,
						tileSize,
						depth: room.tileLayers[layerCount][1],
					});
					layerCount++;
					break;
			}
		});
	} else {
		console.error(`Нет комнаты с именем "${name}"`);
	}
}

const roomRestart = () => {
	goToRoom(currentRoom.name);
}

//______________________________________________________________________________________________
//								функции не связанные с основой движка
//		(могут ипользоваться в основе движка, но сами не используют ее сущности и концепции)
//______________________________________________________________________________________________

const distanceBetween = (x1, y1, x2, y2) => {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return Math.sqrt(dx ** 2 + dy ** 2);
}

const randomFloat = (a, b) => {
    return a + Math.random() * (b - a);
}

const random = (a, b) => {
    return Math.floor(randomFloat(a, b));
}

const getDirectionVector = (x1, y1, x2, y2) => {
	const d = distanceBetween(x1, y1, x2, y2);
    return d !== 0 ? {
        x: (x2 - x1) / d,
        y: (y2 - y1) / d,
    } : {
        x: 0,
        y: 0,
    }
}

const moveToPoint = (object, x, y, speed) => {
	const d = distanceBetween(object.x, object.y, x, y);
	if (d > speed) {
		const v = getDirectionVector(object.x, object.y, x, y);
		object.x += (x - object.x) / d * speed;
		object.y += (y - object.y) / d * speed;
	} else {
		object.x = x;
		object.y = y;
	}
}

function* fromTo(from, to) {
    for (let i = from; i <= to; i++) {
        yield i;
    }
}

//______________________________________________________________________________________________
//					 				функции для проверки колизий
//______________________________________________________________________________________________

const checkCircleCircle = (obj1, obj2) => {
	return distanceBetween(obj1.x, obj1.y, obj2.x, obj2.y) < obj1.collider.r + obj2.collider.r;
}

const checkBoxBox = (obj1, obj2) => {
	const width = Math.min(obj1.x + obj1.collider.x2, obj2.x + obj2.collider.x2) - 
	Math.max(obj1.x + obj1.collider.x1, obj2.x + obj2.collider.x1);
	const height = Math.min(obj1.y + obj1.collider.y2, obj2.y + obj2.collider.y2) - 
	Math.max(obj1.y + obj1.collider.y1, obj2.y + obj2.collider.y1);
	return !(width < 0 || height < 0);
}

const checkBoxCircle = (obj1, obj2) => {
	const v1 = distanceBetween(obj1.x + obj1.collider.x1, obj1.y + obj1.collider.y1, obj2.x, obj2.y);
	const v2 = distanceBetween(obj1.x + obj1.collider.x1, obj1.y + obj1.collider.y2, obj2.x, obj2.y);
	const v3 = distanceBetween(obj1.x + obj1.collider.x2, obj1.y + obj1.collider.y1, obj2.x, obj2.y);
	const v4 = distanceBetween(obj1.x + obj1.collider.x2, obj1.y + obj1.collider.y2, obj2.x, obj2.y);
	const centerInBox = obj2.x > obj1.x + obj1.collider.x1 && obj2.x < obj1.x + obj1.collider.x2 &&
	obj2.y > obj1.y + obj1.collider.y1 && obj2.y < obj1.y + obj1.collider.y2
	return v1 < obj2.collider.r || v2 < obj2.collider.r || v3 < obj2.collider.r || v4 < obj2.collider.r || centerInBox;
}

const checkCollision = (obj1, obj2) => {
	if(obj1.collider.type === 'circle' && obj2.collider.type === 'circle') {
		return checkCircleCircle(obj1, obj2);
	} else if(obj1.collider.type === 'box' && obj2.collider.type === 'box') {
		return checkBoxBox(obj1, obj2);
	} else if(obj1.collider.type === 'box' && obj2.collider.type === 'circle') {
		return checkBoxCircle(obj1, obj2);
	} else if(obj1.collider.type === 'circle' && obj2.collider.type === 'box') {
		return checkBoxCircle(obj2, obj1);
	}
}

const collisionCollider = (filter, x, y, collider) => {
	let objs;
	if (typeof filter === 'string') {
		objs = instances.filter(instance => instance.name === filter);
	} else {
		objs = instances.filter(filter);
	}
	let res = false;
	objs.forEach(obj => {
		if (obj.collider) {
			res = res || checkCollision(obj, {x, y, collider});
		}
	});
	return res;
}

const collisionPoint = (filter, x, y) => {
	let objs;
	if (typeof filter === 'string') {
		objs = instances.filter(instance => instance.name === filter);
	} else {
		objs = instances.filter(filter);
	}
	let res = false;
	objs.forEach(obj => {
		if (obj.collider) {
			switch(obj.collider.type) {
				case 'circle':
					res = res || distanceBetween(obj.x, obj.y, x, y) < obj.collider.r;
					break;
				case 'box':
					res = res || (x > obj.x + obj.collider.x1 && x < obj.x + obj.collider.x2) && 
					(y > obj.y + obj.collider.y1 && y < obj.y + obj.collider.y2);
					break;
			}
		}
	});
	return res;
}

//______________________________________________________________________________________________
//					 					функции для отрисовки
//______________________________________________________________________________________________

const setDrawColor = (color) => {
	ctx.fillStyle = color;
	ctx.strokeStyle = color;
}

const setFont = (font) => {
	ctx.font = font;
}

const setLineWidth = (width) => {
	ctx.lineWidth = width;
}

const drawEllipseFull = (cfg) => {
	const {x, y, w, h} = getCoordsScaledMax(cfg.x, cfg.y, cfg.w, cfg.h);
	ctx.beginPath();
	ctx.ellipse(
		x ? x + w / 2 : 0, 
		y ? y + h / 2 : 0, 
		w / 2 || 0, 
		h / 2 || 0, 
		cfg.rotation || 0, 
		cfg.startAngle || 0, 
		cfg.endAngle || 2 * Math.PI
	);
	if (cfg.fill) {
		ctx.fill();
	}
	if (cfg.stroke) {
		ctx.stroke();
	}
};

const drawEllipse = (x, y, w, h) => {
	drawEllipseFull({ x, y, w, h, fill: false, stroke: true });
}

const drawEllipseFilled = (x, y, w, h) => {
	drawEllipseFull({ x, y, w, h, fill: true, stroke: false });
}

const drawRectFull = (cfg) => {
	const {x, y, w, h} = getCoordsScaledMax(cfg.x, cfg.y, cfg.w, cfg.h);
	ctx.beginPath();
	ctx.rect(x || 0, y || 0, w || 0, h);
	if (cfg.fill) {
		ctx.fill();
	}
	if (cfg.stroke) {
		ctx.stroke();
	}
};

const drawRect = (x, y, w, h) => {
	drawRectFull({ x, y, w, h, fill: false, stroke: true });
}

const drawRectFilled = (x, y, w, h) => {
	drawRectFull({ x, y, w, h, fill: true, stroke: false });
}

const drawTextFull = (cfg) => {
	const {x, y} = getCoordsScaled(cfg.x, cfg.y);
	if (cfg.fill) {
		ctx.fillText(cfg.text, x, y);
	}
	if (cfg.stroke) {
		ctx.strokeText(cfg.text, x, y);
	}
}

const drawText = (text, x, y) => {
	drawTextFull({x, y, text, fill: true, stroke: false});
}

const drawTextStroked = (text, x, y) => {
	drawTextFull({x, y, text, fill: false, stroke: true});
}

const drawLine = (x1, y1, x2, y2) => {
	const c1 = getCoordsScaled(x1, y1);
	const c2 = getCoordsScaled(x2, y2);
	ctx.beginPath();
	ctx.moveTo(c1.x, c1.y);
	ctx.lineTo(c2.x, c2.y);
	ctx.stroke();
}