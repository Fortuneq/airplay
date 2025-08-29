// ✈️ Airplay 3D - Three.js версия игры
// Вдохновлено Fly.pieter.com

// Глобальные переменные Three.js
let scene, camera, renderer;
let airplane, airplaneGroup;
let terrain = [];
let obstacles = [];
let coins = [];
let particles = [];
let clouds = [];

// Игровые переменные
let gameState = 'menu'; // menu, playing, paused, gameOver
let gameData = {
    score: 0,
    bestScore: 0,
    coins: 0,
    speed: 0,
    altitude: 0,
    distance: 0
};

// Константы игры
const WORLD_SIZE = 1000;
const AIRPLANE_SPEED = 2;
const TERRAIN_SEGMENTS = 100;
const SKY_COLOR = 0x87CEEB;
const TERRAIN_COLOR = 0x228B22;

// Telegram Web App
let tg = null;

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Инициализация Airplay 3D...');
    
    initTelegram();
    init3D();
    initEventListeners();
    loadGameData();
    
    // Показать экран загрузки
    showScreen('loading-screen');
    
    setTimeout(() => {
        showScreen('menu-screen');
        startRenderLoop();
        console.log('🚀 3D игра запущена!');
    }, 1500);
});

// Инициализация Telegram Web App
function initTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        tg = Telegram.WebApp;
        tg.expand();
        tg.setHeaderColor('#1e3c72');
        tg.ready();
        console.log('Telegram Web App инициализирован');
    }
}

// Инициализация 3D сцены
function init3D() {
    const container = document.getElementById('game-container');
    
    // Создание сцены
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SKY_COLOR, 100, 1000);
    
    // Создание камеры
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Создание рендерера
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(SKY_COLOR, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    container.appendChild(renderer.domElement);
    
    // Освещение
    setupLighting();
    
    // Создание самолёта
    createAirplane();
    
    // Создание мира
    createTerrain();
    createSky();
    
    // Обработка изменения размера окна
    window.addEventListener('resize', onWindowResize);
    
    console.log('✅ 3D сцена инициализирована');
}

// Настройка освещения
function setupLighting() {
    // Основной свет (солнце)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-1, 1, 1);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Окружающий свет
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Свет от неба
    const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x228B22, 0.4);
    scene.add(hemisphereLight);
}

// Создание самолёта
function createAirplane() {
    airplaneGroup = new THREE.Group();
    
    // Корпус самолёта
    const fuselageGeometry = new THREE.CylinderGeometry(0.3, 0.8, 4, 8);
    const fuselageMaterial = new THREE.MeshLambertMaterial({ color: 0x1e90ff });
    const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.castShadow = true;
    airplaneGroup.add(fuselage);
    
    // Крылья
    const wingGeometry = new THREE.BoxGeometry(6, 0.2, 1.5);
    const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x1e90ff });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.castShadow = true;
    airplaneGroup.add(wings);
    
    // Хвост
    const tailGeometry = new THREE.BoxGeometry(0.3, 2, 1);
    const tailMaterial = new THREE.MeshLambertMaterial({ color: 0x1e90ff });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.position.set(-1.5, 0.5, 0);
    tail.castShadow = true;
    airplaneGroup.add(tail);
    
    // Пропеллер
    const propGeometry = new THREE.BoxGeometry(0.1, 3, 0.1);
    const propMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const propeller = new THREE.Mesh(propGeometry, propMaterial);
    propeller.position.set(2.2, 0, 0);
    airplaneGroup.add(propeller);
    
    // Позиция самолёта
    airplaneGroup.position.set(0, 10, 0);
    scene.add(airplaneGroup);
    
    // Сохраняем ссылку для анимации пропеллера
    airplane = {
        group: airplaneGroup,
        propeller: propeller,
        speed: 0,
        targetY: 10,
        rotation: { x: 0, z: 0 }
    };
}

// Создание ландшафта
function createTerrain() {
    const terrainGeometry = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS);
    
    // Создаем случайный ландшафт
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] = Math.random() * 20 - 10; // Случайная высота
    }
    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
    
    const terrainMaterial = new THREE.MeshLambertMaterial({ 
        color: TERRAIN_COLOR,
        wireframe: false 
    });
    
    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrainMesh.rotation.x = -Math.PI / 2;
    terrainMesh.position.y = -30;
    terrainMesh.receiveShadow = true;
    
    scene.add(terrainMesh);
    terrain.push(terrainMesh);
}

// Создание неба и облаков
function createSky() {
    // Создание облаков
    for (let i = 0; i < 20; i++) {
        createCloud();
    }
}

// Создание одного облака
function createCloud() {
    const cloudGroup = new THREE.Group();
    
    // Несколько сфер для создания облака
    for (let i = 0; i < Math.random() * 3 + 3; i++) {
        const cloudGeometry = new THREE.SphereGeometry(Math.random() * 8 + 4, 6, 6);
        const cloudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff, 
            opacity: 0.8, 
            transparent: true 
        });
        const cloudPart = new THREE.Mesh(cloudGeometry, cloudMaterial);
        
        cloudPart.position.set(
            Math.random() * 20 - 10,
            Math.random() * 10 - 5,
            Math.random() * 20 - 10
        );
        
        cloudGroup.add(cloudPart);
    }
    
    // Позиция облака в мире
    cloudGroup.position.set(
        Math.random() * WORLD_SIZE - WORLD_SIZE/2,
        Math.random() * 100 + 50,
        Math.random() * WORLD_SIZE - WORLD_SIZE/2
    );
    
    scene.add(cloudGroup);
    clouds.push(cloudGroup);
}

// Создание препятствий
function spawnObstacle() {
    const obstacleGeometry = new THREE.BoxGeometry(2, 20, 2);
    const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    obstacle.position.set(
        Math.random() * 200 - 100,
        Math.random() * 30 + 10,
        airplane.group.position.z + 200
    );
    
    obstacle.castShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Создание монет
function spawnCoin() {
    const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 8);
    const coinMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
    const coin = new THREE.Mesh(coinGeometry, coinMaterial);
    
    coin.position.set(
        Math.random() * 100 - 50,
        Math.random() * 20 + 15,
        airplane.group.position.z + 150
    );
    
    coin.userData = { collected: false, rotationSpeed: 0.1 };
    scene.add(coin);
    coins.push(coin);
}

// Обработчики событий
function initEventListeners() {
    // Кнопки меню
    document.getElementById('play-btn').addEventListener('click', startGame);
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    
    // Управление самолётом
    const container = document.getElementById('game-container');
    container.addEventListener('mousedown', handleInput);
    container.addEventListener('touchstart', handleInput);
    
    // Управление мышью для поворотов
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('touchmove', handleTouchMove);
    
    // Клавиатура
    document.addEventListener('keydown', handleKeyDown);
}

// Обработка ввода
function handleInput(event) {
    event.preventDefault();
    
    if (gameState === 'playing') {
        airplane.targetY += 2; // Подъем
        
        // Тактильная обратная связь
        if (tg?.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
}

// Обработка движения мыши
function handleMouseMove(event) {
    if (gameState !== 'playing') return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    airplane.rotation.z = mouseX * 0.3;
    airplane.rotation.x = mouseY * 0.2;
}

// Обработка касаний
function handleTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length > 0 && gameState === 'playing') {
        const touch = event.touches[0];
        const rect = renderer.domElement.getBoundingClientRect();
        const touchX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        const touchY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        
        airplane.rotation.z = touchX * 0.3;
        airplane.rotation.x = touchY * 0.2;
    }
}

// Обработка клавиатуры
function handleKeyDown(event) {
    if (gameState !== 'playing') return;
    
    switch(event.code) {
        case 'Space':
            event.preventDefault();
            airplane.targetY += 2;
            break;
        case 'ArrowLeft':
            airplane.group.position.x -= 2;
            break;
        case 'ArrowRight':
            airplane.group.position.x += 2;
            break;
        case 'ArrowUp':
            airplane.targetY += 1;
            break;
        case 'ArrowDown':
            airplane.targetY -= 1;
            break;
    }
}

// Начало игры
function startGame() {
    gameState = 'playing';
    gameData.score = 0;
    gameData.distance = 0;
    
    // Сброс позиции самолёта
    airplane.group.position.set(0, 10, 0);
    airplane.targetY = 10;
    
    showScreen('game-screen');
    updateUI();
    
    console.log('🛫 Игра началась!');
}

// Пауза
function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showModal('pause-screen');
    }
}

// Основной цикл обновления
function update() {
    if (gameState !== 'playing') return;
    
    // Обновление самолёта
    updateAirplane();
    
    // Движение мира
    updateWorld();
    
    // Спавн объектов
    spawnObjects();
    
    // Обновление объектов
    updateObstacles();
    updateCoins();
    updateClouds();
    
    // Проверка коллизий
    checkCollisions();
    
    // Обновление счёта
    gameData.distance += AIRPLANE_SPEED;
    gameData.score = Math.floor(gameData.distance / 10);
    updateUI();
}

// Обновление самолёта
function updateAirplane() {
    // Плавное движение по Y
    const currentY = airplane.group.position.y;
    airplane.group.position.y = THREE.MathUtils.lerp(currentY, airplane.targetY, 0.05);
    
    // Гравитация
    airplane.targetY -= 0.1;
    airplane.targetY = Math.max(5, airplane.targetY); // Минимальная высота
    
    // Наклоны самолёта
    airplane.group.rotation.z = THREE.MathUtils.lerp(airplane.group.rotation.z, airplane.rotation.z, 0.1);
    airplane.group.rotation.x = THREE.MathUtils.lerp(airplane.group.rotation.x, airplane.rotation.x, 0.1);
    
    // Вращение пропеллера
    airplane.propeller.rotation.x += 0.8;
    
    // Обновление позиции камеры (следует за самолётом)
    updateCamera();
}

// Обновление камеры
function updateCamera() {
    const idealOffset = new THREE.Vector3(-15, 5, 10);
    const idealPosition = airplane.group.position.clone().add(idealOffset);
    
    camera.position.lerp(idealPosition, 0.05);
    camera.lookAt(airplane.group.position);
}

// Движение мира
function updateWorld() {
    // Двигаем препятствия и объекты к игроку
    [...obstacles, ...coins].forEach(object => {
        object.position.z -= AIRPLANE_SPEED;
    });
    
    // Удаляем объекты позади игрока
    removeOldObjects();
}

// Спавн новых объектов
function spawnObjects() {
    // Препятствия
    if (Math.random() < 0.02) {
        spawnObstacle();
    }
    
    // Монеты
    if (Math.random() < 0.03) {
        spawnCoin();
    }
}

// Обновление препятствий
function updateObstacles() {
    obstacles.forEach((obstacle, index) => {
        if (obstacle.position.z < airplane.group.position.z - 50) {
            scene.remove(obstacle);
            obstacles.splice(index, 1);
        }
    });
}

// Обновление монет
function updateCoins() {
    coins.forEach((coin, index) => {
        // Вращение монет
        coin.rotation.y += coin.userData.rotationSpeed;
        
        if (coin.position.z < airplane.group.position.z - 50) {
            scene.remove(coin);
            coins.splice(index, 1);
        }
    });
}

// Обновление облаков
function updateClouds() {
    clouds.forEach(cloud => {
        cloud.position.z -= AIRPLANE_SPEED * 0.1; // Облака движутся медленнее
        
        // Если облако ушло за горизонт, перемещаем его вперёд
        if (cloud.position.z < airplane.group.position.z - 200) {
            cloud.position.z = airplane.group.position.z + 400;
            cloud.position.x = Math.random() * WORLD_SIZE - WORLD_SIZE/2;
        }
    });
}

// Удаление старых объектов
function removeOldObjects() {
    // Очистка массивов от удалённых объектов
    obstacles = obstacles.filter(obstacle => obstacle.parent !== null);
    coins = coins.filter(coin => coin.parent !== null);
}

// Проверка коллизий
function checkCollisions() {
    const airplaneBox = new THREE.Box3().setFromObject(airplane.group);
    
    // Коллизии с препятствиями
    obstacles.forEach(obstacle => {
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        if (airplaneBox.intersectsBox(obstacleBox)) {
            gameOver();
        }
    });
    
    // Коллизии с монетами
    coins.forEach((coin, index) => {
        if (coin.userData.collected) return;
        
        const coinBox = new THREE.Box3().setFromObject(coin);
        if (airplaneBox.intersectsBox(coinBox)) {
            collectCoin(coin, index);
        }
    });
    
    // Коллизия с землёй
    if (airplane.group.position.y < 2) {
        gameOver();
    }
}

// Сбор монеты
function collectCoin(coin, index) {
    coin.userData.collected = true;
    gameData.coins += 1;
    
    // Эффект исчезновения
    const scale = { value: 1 };
    
    // Создаем анимацию без TWEEN (для упрощения)
    const animateScale = () => {
        scale.value -= 0.05;
        coin.scale.setScalar(Math.max(0, scale.value));
        
        if (scale.value <= 0) {
            scene.remove(coin);
            coins.splice(index, 1);
        } else {
            requestAnimationFrame(animateScale);
        }
    };
    
    animateScale();
    
    // Тактильная обратная связь
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
    
    updateUI();
}

// Конец игры
function gameOver() {
    gameState = 'gameOver';
    
    // Тактильная обратная связь
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    // Обновление рекордов
    if (gameData.score > gameData.bestScore) {
        gameData.bestScore = gameData.score;
    }
    
    saveGameData();
    
    // Показать экран окончания игры
    document.getElementById('final-score').textContent = gameData.score;
    document.getElementById('earned-coins').textContent = Math.floor(gameData.score / 10);
    
    updateUI();
    showModal('game-over-screen');
}

// Основной цикл рендеринга
function startRenderLoop() {
    function animate() {
        requestAnimationFrame(animate);
        
        // Обновление только если игра запущена
        if (gameState === 'playing') {
            update();
        }
        
        // Рендеринг
        renderer.render(scene, camera);
    }
    
    animate();
}

// Обработка изменения размера окна
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Вспомогательные функции UI (используем из старого файла)
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    setTimeout(() => {
        document.getElementById(modalId).classList.add('active');
    }, 10);
}

function updateUI() {
    document.getElementById('current-score').textContent = gameData.score;
    document.getElementById('game-coins').textContent = gameData.coins;
    document.getElementById('best-score').textContent = gameData.bestScore;
    document.getElementById('coins').textContent = gameData.coins;
}

function loadGameData() {
    const saved = localStorage.getItem('airplay-3d-data');
    if (saved) {
        gameData = { ...gameData, ...JSON.parse(saved) };
    }
}

function saveGameData() {
    localStorage.setItem('airplay-3d-data', JSON.stringify(gameData));
}

console.log('🎮 Airplay 3D загружен!');