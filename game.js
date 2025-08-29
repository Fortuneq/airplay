// Глобальные переменные
let canvas, ctx;
let gameState = 'menu'; // menu, playing, paused, gameOver, shop
let gameData = {
    score: 0,
    bestScore: 0,
    coins: 0,
    lives: 3,
    currentPlane: 'default',
    ownedPlanes: ['default'],
    activePowerups: [],
    settings: {
        sound: true,
        vibration: true
    }
};

// Игровые объекты
let plane = {
    x: 0,
    y: 0,
    width: 40,
    height: 30,
    velocityY: 0,
    rotation: 0,
    trail: []
};

let obstacles = [];
let coins = [];
let powerups = [];
let particles = [];
let clouds = [];

// Игровые константы
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const SPEED = 3;
const OBSTACLE_SPAWN_RATE = 120;
const COIN_SPAWN_RATE = 200;
const POWERUP_SPAWN_RATE = 600;

// Telegram Web App
let tg = null;
let tgUser = null;

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎮 Инициализация игры Airplay...');
    
    initTelegram();
    initCanvas();
    initEventListeners();
    loadGameData();
    initUI();
    
    // Показать экран загрузки
    showScreen('loading-screen');
    
    // Инициализация позиции самолёта
    plane.x = 100;
    plane.y = canvas.height / 2;
    
    console.log(`✈️ Самолёт инициализирован на позиции: x=${plane.x}, y=${plane.y}`);
    console.log(`🎯 Размер канваса: ${canvas.width}x${canvas.height}`);
    console.log(`📱 Поддержка эмодзи: ${supportsEmoji()}`);
    
    // Симуляция загрузки
    setTimeout(() => {
        showScreen('menu-screen');
        generateClouds();
        gameLoop();
        console.log('🚀 Игра запущена!');
    }, 1500);
});

// Инициализация Telegram Web App
function initTelegram() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        tg = Telegram.WebApp;
        tgUser = tg.initDataUnsafe?.user;
        
        // Настройка темы
        tg.expand();
        tg.setHeaderColor('#1e3c72');
        
        // Включить тактильную обратную связь
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
        
        // Обработчик закрытия
        tg.onEvent('mainButtonClicked', () => {
            tg.close();
        });
        
        console.log('Telegram Web App инициализирован');
        if (tgUser) {
            console.log('Пользователь:', tgUser.first_name);
        }
    } else {
        console.log('Работа вне Telegram');
    }
}

// Инициализация канваса
function initCanvas() {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Установка размеров
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Инициализация позиции самолёта
    plane.x = 100;
    plane.y = canvas.height / 2;
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Обновить позицию самолёта при изменении размера
    if (plane.y === 0) {
        plane.y = canvas.height / 2;
    }
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Кнопки меню
    document.getElementById('play-btn').addEventListener('click', startGame);
    document.getElementById('shop-btn').addEventListener('click', () => showScreen('shop-screen'));
    document.getElementById('share-btn').addEventListener('click', shareGame);
    
    // Кнопки игры
    document.getElementById('pause-btn').addEventListener('click', pauseGame);
    document.getElementById('resume-btn').addEventListener('click', resumeGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('menu-btn').addEventListener('click', () => showScreen('menu-screen'));
    
    // Кнопки конца игры
    document.getElementById('play-again-btn').addEventListener('click', startGame);
    document.getElementById('share-score-btn').addEventListener('click', shareScore);
    document.getElementById('back-menu-btn').addEventListener('click', () => showScreen('menu-screen'));
    
    // Кнопки магазина
    document.getElementById('close-shop-btn').addEventListener('click', () => showScreen('menu-screen'));
    
    // Кнопки модального окна покупки
    document.getElementById('confirm-purchase').addEventListener('click', confirmPurchase);
    document.getElementById('cancel-purchase').addEventListener('click', () => hideModal('purchase-modal'));
    
    // Управление игрой
    canvas.addEventListener('touchstart', handleInput);
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchmove', (e) => e.preventDefault());
    
    // Предотвратить скролл
    document.addEventListener('touchmove', (e) => {
        if (gameState === 'playing') {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Обработчики магазина
    initShopEventListeners();
}

function initShopEventListeners() {
    const shopItems = document.querySelectorAll('.shop-item');
    shopItems.forEach(item => {
        item.addEventListener('click', () => {
            const type = item.dataset.type;
            const id = item.dataset.id;
            handleShopItemClick(type, id, item);
        });
    });
}

// Инициализация UI
function initUI() {
    updateUI();
    updateShopUI();
}

// Загрузка данных игры
function loadGameData() {
    const saved = localStorage.getItem('airplay-game-data');
    if (saved) {
        gameData = { ...gameData, ...JSON.parse(saved) };
    }
    
    // Загрузка данных из Telegram Cloud Storage (если доступно)
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.getItem('gameData', (error, result) => {
            if (!error && result) {
                gameData = { ...gameData, ...JSON.parse(result) };
                updateUI();
            }
        });
    }
}

// Сохранение данных игры
function saveGameData() {
    localStorage.setItem('airplay-game-data', JSON.stringify(gameData));
    
    // Сохранение в Telegram Cloud Storage (если доступно)
    if (tg && tg.CloudStorage) {
        tg.CloudStorage.setItem('gameData', JSON.stringify(gameData));
    }
}

// Обновление UI
function updateUI() {
    document.getElementById('best-score').textContent = gameData.bestScore;
    document.getElementById('coins').textContent = gameData.coins;
    document.getElementById('current-score').textContent = gameData.score;
    document.getElementById('game-coins').textContent = gameData.coins;
    document.getElementById('shop-coins').textContent = gameData.coins;
}

// Показать экран
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Тактильная обратная связь
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Показать модальное окно
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
    setTimeout(() => {
        document.getElementById(modalId).classList.add('active');
    }, 10);
}

// Скрыть модальное окно
function hideModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    setTimeout(() => {
        document.getElementById(modalId).style.display = 'none';
    }, 300);
}

// Начать игру
function startGame() {
    gameState = 'playing';
    gameData.score = 0;
    gameData.lives = 3;
    
    // Сброс игровых объектов
    obstacles = [];
    coins = [];
    powerups = [];
    particles = [];
    
    // Сброс самолёта
    plane.x = 100;
    plane.y = canvas.height / 2;
    plane.velocityY = 0;
    plane.rotation = 0;
    plane.trail = [];
    
    showScreen('game-screen');
    updateUI();
}

// Пауза игры
function pauseGame() {
    if (gameState === 'playing') {
        gameState = 'paused';
        showModal('pause-screen');
    }
}

// Продолжить игру
function resumeGame() {
    if (gameState === 'paused') {
        gameState = 'playing';
        hideModal('pause-screen');
    }
}

// Перезапустить игру
function restartGame() {
    hideModal('pause-screen');
    startGame();
}

// Конец игры
function gameOver() {
    gameState = 'gameOver';
    
    // Тактильная обратная связь
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
    
    // Обновление рекордов
    let isNewRecord = false;
    if (gameData.score > gameData.bestScore) {
        gameData.bestScore = gameData.score;
        isNewRecord = true;
    }
    
    // Начисление монет
    const earnedCoins = Math.floor(gameData.score / 10);
    gameData.coins += earnedCoins;
    
    // Сохранение
    saveGameData();
    
    // Обновление UI конца игры
    document.getElementById('final-score').textContent = gameData.score;
    document.getElementById('earned-coins').textContent = earnedCoins;
    document.getElementById('new-record').style.display = isNewRecord ? 'block' : 'none';
    
    updateUI();
    showModal('game-over-screen');
}

// Обработка ввода
function handleInput(e) {
    e.preventDefault();
    
    if (gameState === 'playing') {
        plane.velocityY = JUMP_STRENGTH;
        
        // Тактильная обратная связь
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('light');
        }
    }
}

// Основной игровой цикл
function gameLoop() {
    if (gameState === 'playing') {
        update();
        render();
    } else if (gameState === 'menu' || gameState === 'shop') {
        renderBackground();
        // В меню тоже показываем самолёт для демонстрации
        renderPlane();
    }
    
    requestAnimationFrame(gameLoop);
}

// Обновление игры
function update() {
    // Обновление самолёта
    updatePlane();
    
    // Спавн объектов
    spawnObjects();
    
    // Обновление объектов
    updateObstacles();
    updateCoins();
    updatePowerups();
    updateParticles();
    updateClouds();
    
    // Проверка коллизий
    checkCollisions();
    
    // Увеличение счёта
    gameData.score += 1;
    updateUI();
}

// Обновление самолёта
function updatePlane() {
    // Гравитация
    plane.velocityY += GRAVITY;
    plane.y += plane.velocityY;
    
    // Ограничения экрана
    if (plane.y < 0) {
        plane.y = 0;
        plane.velocityY = 0;
    }
    if (plane.y > canvas.height - plane.height) {
        plane.y = canvas.height - plane.height;
        plane.velocityY = 0;
    }
    
    // Поворот самолёта
    plane.rotation = Math.max(-30, Math.min(30, plane.velocityY * 3));
    
    // Добавление точки в след
    plane.trail.push({ x: plane.x + plane.width / 2, y: plane.y + plane.height / 2, alpha: 1 });
    
    // Ограничение длины следа
    if (plane.trail.length > 10) {
        plane.trail.shift();
    }
    
    // Уменьшение прозрачности следа
    plane.trail.forEach((point, index) => {
        point.alpha = (index + 1) / plane.trail.length * 0.5;
    });
}

// Спавн объектов
function spawnObjects() {
    // Препятствия
    if (Math.random() < 1 / OBSTACLE_SPAWN_RATE) {
        spawnObstacle();
    }
    
    // Монеты
    if (Math.random() < 1 / COIN_SPAWN_RATE) {
        spawnCoin();
    }
    
    // Бонусы
    if (Math.random() < 1 / POWERUP_SPAWN_RATE) {
        spawnPowerup();
    }
}

// Спавн препятствия
function spawnObstacle() {
    const height = 50 + Math.random() * 100;
    const gap = 150;
    const y = Math.random() * (canvas.height - gap - height);
    
    obstacles.push({
        x: canvas.width,
        y: y,
        width: 30,
        height: height,
        type: 'top'
    });
    
    obstacles.push({
        x: canvas.width,
        y: y + height + gap,
        width: 30,
        height: canvas.height - (y + height + gap),
        type: 'bottom'
    });
}

// Спавн монеты
function spawnCoin() {
    coins.push({
        x: canvas.width,
        y: 50 + Math.random() * (canvas.height - 100),
        width: 20,
        height: 20,
        rotation: 0,
        collected: false
    });
}

// Спавн бонуса
function spawnPowerup() {
    const types = ['shield', 'slow', 'magnet'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerups.push({
        x: canvas.width,
        y: 50 + Math.random() * (canvas.height - 100),
        width: 30,
        height: 30,
        type: type,
        collected: false,
        animation: 0
    });
}

// Обновление препятствий
function updateObstacles() {
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= SPEED;
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// Обновление монет
function updateCoins() {
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= SPEED;
        coin.rotation += 5;
        
        if (coin.x + coin.width < 0) {
            coins.splice(i, 1);
        }
    }
}

// Обновление бонусов
function updatePowerups() {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.x -= SPEED;
        powerup.animation += 0.1;
        
        if (powerup.x + powerup.width < 0) {
            powerups.splice(i, 1);
        }
    }
}

// Обновление частиц
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2;
        particle.life--;
        
        if (particle.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Обновление облаков
function updateClouds() {
    for (let i = clouds.length - 1; i >= 0; i--) {
        clouds[i].x -= clouds[i].speed;
        
        if (clouds[i].x + clouds[i].width < 0) {
            clouds[i].x = canvas.width + Math.random() * 100;
        }
    }
}

// Генерация облаков
function generateClouds() {
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height * 0.7,
            width: 60 + Math.random() * 40,
            height: 30 + Math.random() * 20,
            speed: 0.5 + Math.random() * 1,
            opacity: 0.3 + Math.random() * 0.4
        });
    }
}

// Проверка коллизий
function checkCollisions() {
    // Коллизии с препятствиями
    obstacles.forEach(obstacle => {
        if (isColliding(plane, obstacle)) {
            gameOver();
        }
    });
    
    // Коллизии с монетами
    coins.forEach((coin, index) => {
        if (!coin.collected && isColliding(plane, coin)) {
            coin.collected = true;
            gameData.coins += 1;
            createCoinParticles(coin.x, coin.y);
            coins.splice(index, 1);
            
            // Тактильная обратная связь
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
        }
    });
    
    // Коллизии с бонусами
    powerups.forEach((powerup, index) => {
        if (!powerup.collected && isColliding(plane, powerup)) {
            powerup.collected = true;
            activatePowerup(powerup.type);
            createPowerupParticles(powerup.x, powerup.y, powerup.type);
            powerups.splice(index, 1);
        }
    });
}

// Проверка коллизии между двумя объектами
function isColliding(obj1, obj2) {
    return obj1.x < obj2.x + obj2.width &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.height &&
           obj1.y + obj1.height > obj2.y;
}

// Активация бонуса
function activatePowerup(type) {
    switch (type) {
        case 'shield':
            // Временная неуязвимость
            gameData.activePowerups.push({
                type: 'shield',
                duration: 300,
                timer: 300
            });
            break;
        case 'slow':
            // Замедление времени
            gameData.activePowerups.push({
                type: 'slow',
                duration: 600,
                timer: 600
            });
            break;
        case 'magnet':
            // Магнит для монет
            gameData.activePowerups.push({
                type: 'magnet',
                duration: 450,
                timer: 450
            });
            break;
    }
}

// Создание частиц монеты
function createCoinParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: '#FFD700',
            size: 2 + Math.random() * 3
        });
    }
}

// Создание частиц бонуса
function createPowerupParticles(x, y, type) {
    const colors = {
        shield: '#00BFFF',
        slow: '#9370DB',
        magnet: '#FF4500'
    };
    
    for (let i = 0; i < 8; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 40,
            color: colors[type] || '#FFFFFF',
            size: 3 + Math.random() * 4
        });
    }
}

// Отрисовка
function render() {
    console.log(`🎨 Рендер кадра - gameState: ${gameState}`);
    
    // Очистка канваса
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    renderBackground();
    
    // Облака
    renderClouds();
    
    // След самолёта
    renderTrail();
    
    // Самолёт - ГЛАВНОЕ!
    renderPlane();
    
    // Препятствия
    renderObstacles();
    
    // Монеты
    renderCoins();
    
    // Бонусы
    renderPowerups();
    
    // Частицы
    renderParticles();
    
    // Эффекты активных бонусов
    renderPowerupEffects();
    
    // Отладочная информация
    renderDebugInfo();
}

// Отладочная информация
function renderDebugInfo() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 350, 120);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Позиция самолёта: x=${plane.x.toFixed(0)}, y=${plane.y.toFixed(0)}`, 20, 30);
    ctx.fillText(`Размер канваса: ${canvas.width}x${canvas.height}`, 20, 50);
    ctx.fillText(`Поддержка эмодзи: ${supportsEmoji() ? 'Да' : 'Нет'}`, 20, 70);
    ctx.fillText(`Состояние игры: ${gameState}`, 20, 90);
    ctx.fillText(`Самолёт: ${gameData.currentPlane}`, 20, 110);
    
    // Показываем красный квадрат там, где должен быть самолёт
    ctx.fillStyle = 'red';
    ctx.fillRect(plane.x, plane.y, plane.width, plane.height);
    ctx.fillStyle = 'yellow';
    ctx.fillRect(plane.x + plane.width/2 - 2, plane.y + plane.height/2 - 2, 4, 4);
}

// Отрисовка фона
function renderBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#98FB98');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Отрисовка облаков
function renderClouds() {
    ctx.fillStyle = 'white';
    clouds.forEach(cloud => {
        ctx.globalAlpha = cloud.opacity;
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/3, cloud.y, cloud.width/4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width/2, cloud.y, cloud.width/3, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
}

// Отрисовка следа самолёта
function renderTrail() {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    
    if (plane.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(plane.trail[0].x, plane.trail[0].y);
        
        for (let i = 1; i < plane.trail.length; i++) {
            ctx.globalAlpha = plane.trail[i].alpha;
            ctx.lineTo(plane.trail[i].x, plane.trail[i].y);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

// Отрисовка самолёта
function renderPlane() {
    // Отладочная информация
    console.log(`Рендеринг самолёта: x=${plane.x}, y=${plane.y}, state=${gameState}`);
    
    ctx.save();
    ctx.translate(plane.x + plane.width/2, plane.y + plane.height/2);
    ctx.rotate(plane.rotation * Math.PI / 180);
    
    // Проверяем поддержку эмодзи
    if (supportsEmoji()) {
        // Отрисовка эмодзи самолёта
        const planeSymbol = getPlaneSymbol(gameData.currentPlane);
        ctx.font = '30px Arial, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(planeSymbol, 0, 0);
        console.log(`Отрисован эмодзи самолёт: ${planeSymbol}`);
    } else {
        // Альтернативная отрисовка для десктопа
        drawPlaneShape();
        console.log('Отрисована векторная графика самолёта');
    }
    
    ctx.restore();
}

// Функция проверки поддержки эмодзи
function supportsEmoji() {
    // Создаём временный canvas для проверки
    const testCanvas = document.createElement('canvas');
    testCanvas.width = testCanvas.height = 1;
    const testCtx = testCanvas.getContext('2d');
    
    testCtx.textBaseline = 'top';
    testCtx.font = '16px Arial';
    testCtx.fillText('✈️', 0, 0);
    
    // Если эмодзи поддерживается, пиксели будут не прозрачными
    const imageData = testCtx.getImageData(0, 0, 1, 1).data;
    return imageData[3] > 0; // Проверяем альфа-канал
}

// Альтернативная отрисовка самолёта для десктопа
function drawPlaneShape() {
    const size = 15;
    
    // Цвет самолёта в зависимости от типа
    const colors = {
        default: '#4A90E2',
        fighter: '#E74C3C',
        jet: '#9B59B6'
    };
    
    ctx.fillStyle = colors[gameData.currentPlane] || colors.default;
    ctx.strokeStyle = '#2C3E50';
    ctx.lineWidth = 2;
    
    // Рисуем простую форму самолёта
    ctx.beginPath();
    // Нос самолёта (треугольник)
    ctx.moveTo(size, 0);
    ctx.lineTo(-size/2, -size/3);
    ctx.lineTo(-size/2, size/3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Крылья
    ctx.beginPath();
    ctx.rect(-size/3, -size/2, size/1.5, size/4);
    ctx.rect(-size/3, size/4, size/1.5, size/4);
    ctx.fill();
    ctx.stroke();
    
    // Хвост
    ctx.beginPath();
    ctx.moveTo(-size/2, 0);
    ctx.lineTo(-size, -size/4);
    ctx.lineTo(-size, size/4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Получить символ самолёта
function getPlaneSymbol(planeType) {
    const symbols = {
        default: '✈️',
        fighter: '🛩️',
        jet: '🚀'
    };
    return symbols[planeType] || symbols.default;
}

// Отрисовка препятствий
function renderObstacles() {
    ctx.fillStyle = '#8B4513';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    
    obstacles.forEach(obstacle => {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
}

// Отрисовка монет
function renderCoins() {
    coins.forEach(coin => {
        ctx.save();
        ctx.translate(coin.x + coin.width/2, coin.y + coin.height/2);
        ctx.rotate(coin.rotation * Math.PI / 180);
        
        if (supportsEmoji()) {
            ctx.font = '20px Arial, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FFD700';
            ctx.fillText('💰', 0, 0);
        } else {
            // Альтернативная отрисовка монеты
            drawCoinShape();
        }
        
        ctx.restore();
    });
}

// Альтернативная отрисовка монеты
function drawCoinShape() {
    const radius = 8;
    
    // Внешний круг (золотой)
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Внутренний символ доллара
    ctx.fillStyle = '#FFA500';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);
}

// Отрисовка бонусов
function renderPowerups() {
    powerups.forEach(powerup => {
        ctx.save();
        ctx.translate(powerup.x + powerup.width/2, powerup.y + powerup.height/2);
        
        // Анимация пульсации
        const scale = 1 + Math.sin(powerup.animation * 5) * 0.1;
        ctx.scale(scale, scale);
        
        if (supportsEmoji()) {
            ctx.font = '25px Arial, "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const symbols = {
                shield: '🛡️',
                slow: '🐌',
                magnet: '🧲'
            };
            
            ctx.fillText(symbols[powerup.type] || '⭐', 0, 0);
        } else {
            // Альтернативная отрисовка бонуса
            drawPowerupShape(powerup.type);
        }
        
        ctx.restore();
    });
}

// Альтернативная отрисовка бонусов
function drawPowerupShape(type) {
    const size = 12;
    
    // Цвета для разных типов бонусов
    const colors = {
        shield: '#00BFFF',
        slow: '#9370DB', 
        magnet: '#FF4500'
    };
    
    ctx.fillStyle = colors[type] || '#FFA500';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    
    switch(type) {
        case 'shield':
            // Рисуем щит
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Крест на щите
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-size/2, 0);
            ctx.lineTo(size/2, 0);
            ctx.moveTo(0, -size/2);
            ctx.lineTo(0, size/2);
            ctx.stroke();
            break;
            
        case 'slow':
            // Рисуем часы
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Стрелки часов
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -size/2);
            ctx.moveTo(0, 0);
            ctx.lineTo(size/3, 0);
            ctx.stroke();
            break;
            
        case 'magnet':
            // Рисуем магнит (подкову)
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI, false);
            ctx.strokeStyle = colors[type];
            ctx.lineWidth = 6;
            ctx.stroke();
            
            // Концы магнита
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-size, -2, 4, 8);
            ctx.fillStyle = '#0000FF';
            ctx.fillRect(size-4, -2, 4, 8);
            break;
            
        default:
            // Звезда по умолчанию
            drawStar(0, 0, size);
            break;
    }
}

// Функция отрисовки звезды
function drawStar(cx, cy, size) {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.5;
    
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / spikes;
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// Отрисовка частиц
function renderParticles() {
    particles.forEach(particle => {
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.life / 40;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
    });
    ctx.globalAlpha = 1;
}

// Отрисовка эффектов активных бонусов
function renderPowerupEffects() {
    gameData.activePowerups.forEach((powerup, index) => {
        switch (powerup.type) {
            case 'shield':
                // Эффект щита
                ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(plane.x + plane.width/2, plane.y + plane.height/2, 35, 0, Math.PI * 2);
                ctx.stroke();
                break;
            case 'slow':
                // Эффект замедления времени
                ctx.fillStyle = 'rgba(147, 112, 219, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                break;
        }
        
        // Уменьшение таймера
        powerup.timer--;
        if (powerup.timer <= 0) {
            gameData.activePowerups.splice(index, 1);
        }
    });
}

// Магазин
function updateShopUI() {
    const items = document.querySelectorAll('.shop-item');
    items.forEach(item => {
        const type = item.dataset.type;
        const id = item.dataset.id;
        
        if (type === 'plane') {
            if (gameData.ownedPlanes.includes(id)) {
                item.classList.add('owned');
                item.querySelector('.item-price').textContent = 'В наличии';
                item.querySelector('.item-price').classList.add('owned');
                
                if (gameData.currentPlane === id) {
                    item.classList.add('selected');
                } else {
                    item.classList.remove('selected');
                }
            }
        }
    });
}

function handleShopItemClick(type, id, element) {
    if (type === 'plane') {
        if (gameData.ownedPlanes.includes(id)) {
            // Выбрать самолёт
            gameData.currentPlane = id;
            saveGameData();
            updateShopUI();
        } else {
            // Показать модальное окно покупки
            showPurchaseModal(type, id, element);
        }
    } else if (type === 'powerup') {
        // Показать модальное окно покупки бонуса
        showPurchaseModal(type, id, element);
    }
}

let currentPurchaseItem = null;

function showPurchaseModal(type, id, element) {
    const prices = {
        plane: { fighter: 100, jet: 250 },
        powerup: { shield: 50, coins: 75, slow: 100 }
    };
    
    const names = {
        plane: { fighter: 'Истребитель', jet: 'Реактивный самолёт' },
        powerup: { shield: 'Щит на старте', coins: 'x2 монеты', slow: 'Замедление времени' }
    };
    
    const price = prices[type][id];
    const name = names[type][id];
    
    if (gameData.coins < price) {
        // Недостаточно монет
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('error');
        }
        return;
    }
    
    currentPurchaseItem = { type, id, price };
    
    document.getElementById('purchase-title').textContent = `Купить ${name}?`;
    document.getElementById('purchase-text').textContent = `Цена: ${price} монет`;
    
    showModal('purchase-modal');
}

function confirmPurchase() {
    if (!currentPurchaseItem) return;
    
    const { type, id, price } = currentPurchaseItem;
    
    if (gameData.coins >= price) {
        gameData.coins -= price;
        
        if (type === 'plane') {
            gameData.ownedPlanes.push(id);
            gameData.currentPlane = id;
        }
        
        saveGameData();
        updateUI();
        updateShopUI();
        
        // Тактильная обратная связь
        if (tg && tg.HapticFeedback) {
            tg.HapticFeedback.notificationOccurred('success');
        }
    }
    
    hideModal('purchase-modal');
    currentPurchaseItem = null;
}

// Поделиться игрой
function shareGame() {
    const text = `🎮 Играю в Airplay! Проверь свои навыки пилотирования!`;
    
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${window.location.href}&text=${encodeURIComponent(text)}`);
    } else {
        // Fallback для браузера
        if (navigator.share) {
            navigator.share({
                title: 'Airplay Game',
                text: text,
                url: window.location.href
            });
        } else {
            // Копирование в буфер обмена
            navigator.clipboard.writeText(`${text} ${window.location.href}`);
            alert('Ссылка скопирована в буфер обмена!');
        }
    }
}

// Поделиться результатом
function shareScore() {
    const text = `🎮 Мой рекорд в Airplay: ${gameData.score} очков! 🏆 Можешь побить?`;
    
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${window.location.href}&text=${encodeURIComponent(text)}`);
    } else {
        // Fallback для браузера
        if (navigator.share) {
            navigator.share({
                title: 'Мой результат в Airplay',
                text: text,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(`${text} ${window.location.href}`);
            alert('Результат скопирован в буфер обмена!');
        }
    }
}

// Вспомогательные функции
function getRandomColor() {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Обработчики клавиатуры для тестирования
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameState === 'playing') {
        e.preventDefault();
        handleInput(e);
    }
    
    if (e.code === 'Escape') {
        if (gameState === 'playing') {
            pauseGame();
        } else if (gameState === 'paused') {
            resumeGame();
        }
    }
});