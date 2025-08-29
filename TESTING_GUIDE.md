# 🧪 Руководство по тестированию Airplay Mini App

## 📑 Содержание
1. [Типы тестирования](#типы-тестирования)
2. [Подготовка к тестированию](#подготовка-к-тестированию)
3. [Функциональное тестирование](#функциональное-тестирование)
4. [Тестирование интеграции с Telegram](#тестирование-интеграции-с-telegram)
5. [Тестирование на устройствах](#тестирование-на-устройствах)
6. [Тестирование производительности](#тестирование-производительности)
7. [Тестирование безопасности](#тестирование-безопасности)
8. [Пользовательское тестирование](#пользовательское-тестирование)
9. [Автоматизированное тестирование](#автоматизированное-тестирование)

---

## 🎯 Типы тестирования

### 1. **Функциональное тестирование**
- Проверка основной игровой механики
- Тестирование UI/UX элементов
- Проверка системы прогрессии

### 2. **Интеграционное тестирование**
- Telegram Web App API
- Cloud Storage синхронизация
- Тактильная обратная связь

### 3. **Кроссплатформенное тестирование**
- iOS устройства
- Android устройства  
- Desktop браузеры

### 4. **Тестирование производительности**
- Скорость загрузки
- FPS в игре
- Потребление памяти

### 5. **Пользовательское тестирование**
- UX тестирование
- A/B тестирование
- Фокус-группы

---

## 🛠️ Подготовка к тестированию

### Тестовое окружение

#### Локальное тестирование
```bash
# Запуск локального сервера
python -m http.server 8000
# или
npx serve .
# или
php -S localhost:8000
```

#### HTTPS для Telegram тестирования
```bash
# Использование ngrok для HTTPS туннеля
ngrok http 8000
# Получите HTTPS URL: https://abc123.ngrok.io
```

### Тестовые данные
```javascript
// Тестовые игровые данные
const testGameData = {
    score: 1500,
    bestScore: 5000,
    coins: 250,
    ownedPlanes: ['default', 'fighter'],
    currentPlane: 'fighter',
    gamesPlayed: 25,
    totalPlayTime: 3600000 // 1 час
};

// Функция для загрузки тестовых данных
function loadTestData() {
    if (window.location.search.includes('test=true')) {
        Object.assign(gameData, testGameData);
        console.log('Загружены тестовые данные');
    }
}
```

### Тестовые режимы
```javascript
// Режимы тестирования
const TEST_MODES = {
    DEBUG: 'debug',           // Отладочная информация
    GODMODE: 'godmode',      // Неуязвимость
    SPEED: 'speed',          // Ускоренная игра
    UI_TEST: 'ui_test'       // Тест интерфейса
};

function enableTestMode(mode) {
    switch(mode) {
        case TEST_MODES.DEBUG:
            window.DEBUG_MODE = true;
            showDebugInfo = true;
            break;
        case TEST_MODES.GODMODE:
            window.GOD_MODE = true;
            break;
        case TEST_MODES.SPEED:
            SPEED *= 2;
            OBSTACLE_SPAWN_RATE /= 2;
            break;
    }
}

// Активация через URL параметры
// https://your-game.com/?mode=debug&test=true
```

---

## ⚙️ Функциональное тестирование

### Игровая механика

#### Тест 1: Управление самолётом
**Цель**: Проверить отзывчивость управления

**Шаги**:
1. Запустите игру
2. Нажимайте на экран в разных местах
3. Проверьте реакцию самолёта
4. Тестируйте на границах экрана

**Ожидаемый результат**:
- [ ] Самолёт реагирует на каждое касание
- [ ] Нет задержки между касанием и движением
- [ ] Управление работает во всех частях экрана
- [ ] Самолёт не выходит за границы

**Критерии**:
```javascript
// Автоматический тест управления
function testPlaneControl() {
    const initialY = plane.y;
    
    // Симуляция нажатия
    handleInput({ preventDefault: () => {} });
    
    // Проверка через 100ms
    setTimeout(() => {
        const moved = Math.abs(plane.y - initialY) > 5;
        console.log('Тест управления:', moved ? '✅' : '❌');
    }, 100);
}
```

#### Тест 2: Коллизии
**Цель**: Проверить точность обнаружения столкновений

**Тестовые сценарии**:
- [ ] Столкновение с препятствиями
- [ ] Сбор монет
- [ ] Активация бонусов
- [ ] Границы игрового поля

```javascript
// Тест коллизий
function testCollisions() {
    // Создание тестового препятствия
    const testObstacle = {
        x: plane.x + 10,
        y: plane.y + 10,
        width: 30,
        height: 50
    };
    
    // Проверка коллизии
    const collision = isColliding(plane, testObstacle);
    console.log('Тест коллизий:', collision ? '✅' : '❌');
}
```

#### Тест 3: Система счёта
**Цель**: Проверить правильность начисления очков

**Проверки**:
- [ ] Увеличение счёта за время
- [ ] Бонусы за сбор монет
- [ ] Корректное отображение рекорда
- [ ] Сохранение статистики

### Интерфейс пользователя

#### Тест 4: Навигация по меню
**Чек-лист**:
- [ ] Главное меню загружается
- [ ] Кнопка "Играть" работает
- [ ] Магазин открывается
- [ ] Настройки доступны
- [ ] Возврат в главное меню работает

#### Тест 5: Модальные окна
**Проверки**:
- [ ] Окно паузы появляется
- [ ] Окно окончания игры показывается
- [ ] Окна покупки работают
- [ ] Закрытие окон функционирует
- [ ] Анимации проигрываются

#### Тест 6: Адаптивность
**Разрешения экрана**:
- [ ] 320x568 (iPhone SE)
- [ ] 375x667 (iPhone 8)
- [ ] 414x896 (iPhone 11)
- [ ] 360x640 (Android)
- [ ] 768x1024 (iPad)

```javascript
// Тест адаптивности
function testResponsiveness() {
    const viewports = [
        {width: 320, height: 568},
        {width: 375, height: 667},
        {width: 414, height: 896}
    ];
    
    viewports.forEach(viewport => {
        // Симуляция изменения размера
        window.innerWidth = viewport.width;
        window.innerHeight = viewport.height;
        
        resizeCanvas();
        
        // Проверка что игра помещается
        const fits = canvas.width <= viewport.width && 
                    canvas.height <= viewport.height;
        
        console.log(`${viewport.width}x${viewport.height}:`, fits ? '✅' : '❌');
    });
}
```

---

## 📱 Тестирование интеграции с Telegram

### Основные API

#### Тест 7: Telegram Web App API
**Проверки**:
- [ ] Скрипт Telegram загружается
- [ ] `window.Telegram.WebApp` существует
- [ ] `tg.ready()` вызывается успешно
- [ ] `tg.expand()` работает

```javascript
// Автоматический тест API
function testTelegramAPI() {
    const tests = {
        scriptLoaded: typeof Telegram !== 'undefined',
        webAppExists: !!window.Telegram?.WebApp,
        userDataExists: !!tg?.initDataUnsafe?.user,
        hapticAvailable: !!tg?.HapticFeedback,
        cloudStorageAvailable: !!tg?.CloudStorage
    };
    
    Object.entries(tests).forEach(([test, result]) => {
        console.log(`${test}:`, result ? '✅' : '❌');
    });
}
```

#### Тест 8: Получение данных пользователя
**Сценарии**:
- [ ] Данные пользователя получаются
- [ ] Имя отображается в интерфейсе
- [ ] ID пользователя корректный
- [ ] Язык определяется правильно

#### Тест 9: Cloud Storage
**Тестирование**:
- [ ] Сохранение данных
- [ ] Загрузка данных
- [ ] Синхронизация между устройствами
- [ ] Обработка ошибок

```javascript
// Комплексный тест Cloud Storage
async function testCloudStorage() {
    if (!tg?.CloudStorage) {
        console.log('Cloud Storage недоступен ❌');
        return;
    }
    
    const testKey = 'test_data';
    const testValue = { timestamp: Date.now(), test: true };
    
    // Тест сохранения
    return new Promise((resolve) => {
        tg.CloudStorage.setItem(testKey, JSON.stringify(testValue), (error) => {
            if (error) {
                console.log('Сохранение в Cloud Storage: ❌', error);
                resolve();
                return;
            }
            
            // Тест загрузки
            tg.CloudStorage.getItem(testKey, (error, result) => {
                if (error) {
                    console.log('Загрузка из Cloud Storage: ❌', error);
                    resolve();
                    return;
                }
                
                const loaded = JSON.parse(result);
                const success = loaded.timestamp === testValue.timestamp;
                
                console.log('Cloud Storage тест:', success ? '✅' : '❌');
                
                // Очистка тестовых данных
                tg.CloudStorage.removeItem(testKey);
                resolve();
            });
        });
    });
}
```

#### Тест 10: Тактильная обратная связь
**Проверки**:
- [ ] `impactOccurred('light')` работает
- [ ] `impactOccurred('medium')` работает  
- [ ] `impactOccurred('heavy')` работает
- [ ] `notificationOccurred()` работает
- [ ] `selectionChanged()` работает

---

## 📱 Тестирование на устройствах

### iOS тестирование

#### Safari iOS
**Особенности**:
- Проверка касаний и жестов
- Тестирование viewport
- Проверка производительности
- Работа в полноэкранном режиме

**Чек-лист iOS**:
- [ ] Загрузка без ошибок
- [ ] Касания обрабатываются корректно
- [ ] Нет скролла страницы во время игры
- [ ] Звуки работают (при наличии)
- [ ] Тактильная обратная связь активна

#### Telegram iOS
- [ ] Открытие через бота
- [ ] Полноэкранный режим
- [ ] Кнопки интерфейса Telegram
- [ ] Возврат в чат

### Android тестирование

#### Chrome Android
**Специфика Android**:
- Разнообразие размеров экрана
- Различные плотности пикселей
- Кнопка "назад" системы

**Чек-лист Android**:
- [ ] Адаптация под разные экраны
- [ ] Обработка кнопки "назад"
- [ ] Производительность на слабых устройствах
- [ ] Работа в фоновом режиме

#### Telegram Android
- [ ] Интеграция с системными функциями
- [ ] Быстрое переключение приложений
- [ ] Уведомления

### Desktop тестирование

#### Браузерное тестирование
**Браузеры**:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

#### Telegram Desktop
- [ ] Базовая функциональность
- [ ] Управление мышью/клавиатурой
- [ ] Горячие клавиши

---

## ⚡ Тестирование производительности

### Метрики производительности

#### Тест 11: Время загрузки
**Цели**:
- Загрузка < 3 секунд на 3G
- Загрузка < 1 секунды на WiFi

```javascript
// Измерение времени загрузки
const loadStartTime = performance.now();

window.addEventListener('load', () => {
    const loadTime = performance.now() - loadStartTime;
    console.log(`Время загрузки: ${loadTime.toFixed(2)}ms`);
    
    // Отправка метрики
    if (tg) {
        tg.sendData(JSON.stringify({
            metric: 'load_time',
            value: loadTime,
            platform: tg.platform
        }));
    }
});
```

#### Тест 12: FPS в игре
**Цель**: Стабильные 60 FPS

```javascript
// Мониторинг FPS
let frameCount = 0;
let lastTime = performance.now();

function measureFPS() {
    frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        console.log(`FPS: ${fps}`);
        
        // Предупреждение при низком FPS
        if (fps < 30) {
            console.warn('Низкий FPS!', fps);
        }
        
        frameCount = 0;
        lastTime = currentTime;
    }
}

// Добавить в игровой цикл
function gameLoop() {
    // ... игровая логика ...
    measureFPS();
    requestAnimationFrame(gameLoop);
}
```

#### Тест 13: Использование памяти
```javascript
// Мониторинг памяти (только в Chrome)
function checkMemoryUsage() {
    if (performance.memory) {
        const memory = {
            used: Math.round(performance.memory.usedJSHeapSize / 1048576),
            total: Math.round(performance.memory.totalJSHeapSize / 1048576),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
        
        console.log(`Память: ${memory.used}/${memory.total} MB (лимит: ${memory.limit} MB)`);
        
        // Предупреждение при высоком использовании
        if (memory.used / memory.limit > 0.8) {
            console.warn('Высокое использование памяти!');
        }
    }
}

// Проверка каждые 30 секунд
setInterval(checkMemoryUsage, 30000);
```

### Нагрузочное тестирование

#### Тест 14: Длительная игра
**Сценарий**: Игра 10+ минут непрерывно
**Проверки**:
- [ ] Нет утечек памяти
- [ ] Производительность стабильна
- [ ] Нет ошибок JavaScript
- [ ] Аудио продолжает работать

#### Тест 15: Множество объектов
```javascript
// Стресс-тест с большим количеством объектов
function stressTest() {
    // Создание множества препятствий
    for (let i = 0; i < 50; i++) {
        spawnObstacle();
        spawnCoin();
        spawnPowerup();
    }
    
    // Мониторинг производительности
    const startTime = performance.now();
    
    setTimeout(() => {
        const endTime = performance.now();
        const frameTime = endTime - startTime;
        
        console.log(`Стресс-тест: ${frameTime.toFixed(2)}ms на кадр`);
    }, 1000);
}
```

---

## 🔒 Тестирование безопасности

### Валидация данных

#### Тест 16: Проверка пользовательского ввода
```javascript
// Тест на инъекции и некорректные данные
function testInputValidation() {
    const maliciousInputs = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '../../etc/passwd',
        'DROP TABLE users;',
        '\\x00\\x01\\x02'
    ];
    
    maliciousInputs.forEach(input => {
        // Тест обработки имени пользователя
        const sanitized = sanitizeInput(input);
        const safe = !sanitized.includes('<script>') && 
                    !sanitized.includes('javascript:');
        
        console.log(`Санитизация "${input}":`, safe ? '✅' : '❌');
    });
}
```

#### Тест 17: Проверка Telegram данных
```javascript
// Валидация данных от Telegram
function validateTelegramData() {
    if (!tg || !tg.initData) {
        return false;
    }
    
    // Проверка формата данных
    const data = tg.initDataUnsafe;
    
    const validations = {
        hasUser: !!data.user,
        validUserId: data.user?.id && Number.isInteger(data.user.id),
        validUsername: !data.user?.username || /^[a-zA-Z0-9_]{5,32}$/.test(data.user.username),
        validAuthDate: data.auth_date && data.auth_date > 0
    };
    
    const allValid = Object.values(validations).every(v => v);
    console.log('Валидация Telegram данных:', allValid ? '✅' : '❌');
    
    return allValid;
}
```

---

## 👥 Пользовательское тестирование

### A/B тестирование

#### Тест 18: Варианты интерфейса
```javascript
// A/B тест кнопок
const variants = {
    A: { buttonColor: '#FF6B6B', buttonText: '🚀 ИГРАТЬ' },
    B: { buttonColor: '#4ECDC4', buttonText: 'Начать игру' }
};

function initABTest() {
    const variant = Math.random() > 0.5 ? 'A' : 'B';
    const config = variants[variant];
    
    // Применение варианта
    document.querySelector('#play-btn').style.backgroundColor = config.buttonColor;
    document.querySelector('#play-btn').textContent = config.buttonText;
    
    // Отслеживание результатов
    gameData.abTestVariant = variant;
}
```

### Фокус-группы

#### Тестовые задания
1. **Первый запуск**: "Попробуйте разобраться в игре без инструкций"
2. **Достижение цели**: "Наберите 1000 очков"
3. **Использование магазина**: "Купите новый самолёт"
4. **Социальные функции**: "Поделитесь результатом с друзьями"

#### Метрики UX
- Время до первого действия
- Количество ошибок
- Время выполнения задач
- Показатель удовлетворённости

---

## 🤖 Автоматизированное тестирование

### Unit тесты

```javascript
// Простой фреймворк для тестов
class TestRunner {
    constructor() {
        this.tests = [];
        this.results = [];
    }
    
    test(name, testFn) {
        this.tests.push({ name, testFn });
    }
    
    run() {
        this.tests.forEach(({ name, testFn }) => {
            try {
                const result = testFn();
                this.results.push({ name, passed: result, error: null });
                console.log(`✅ ${name}`);
            } catch (error) {
                this.results.push({ name, passed: false, error });
                console.log(`❌ ${name}:`, error.message);
            }
        });
        
        this.printSummary();
    }
    
    printSummary() {
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        console.log(`\nТестов пройдено: ${passed}/${total}`);
    }
}

// Примеры тестов
const runner = new TestRunner();

runner.test('Инициализация игры', () => {
    initGame();
    return gameData !== null && canvas !== null;
});

runner.test('Создание препятствий', () => {
    spawnObstacle();
    return obstacles.length > 0;
});

runner.test('Коллизии работают', () => {
    const testObj1 = { x: 0, y: 0, width: 10, height: 10 };
    const testObj2 = { x: 5, y: 5, width: 10, height: 10 };
    return isColliding(testObj1, testObj2);
});

// Запуск тестов
if (window.location.search.includes('test=auto')) {
    runner.run();
}
```

### Интеграционные тесты

```javascript
// Тест полного игрового цикла
async function integrationTest() {
    console.log('🧪 Запуск интеграционного теста...');
    
    // 1. Инициализация
    initGame();
    await delay(100);
    
    // 2. Запуск игры
    startGame();
    await delay(100);
    
    // 3. Симуляция игры
    for (let i = 0; i < 10; i++) {
        handleInput({ preventDefault: () => {} });
        update();
        render();
        await delay(50);
    }
    
    // 4. Завершение игры
    gameOver();
    await delay(100);
    
    // 5. Проверка результатов
    const success = gameData.score > 0 && gameState === 'gameOver';
    console.log('Интеграционный тест:', success ? '✅' : '❌');
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## 📊 Мониторинг и аналитика

### Сбор метрик

```javascript
// Система сбора метрик
class GameAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
    }
    
    track(event, data = {}) {
        const eventData = {
            event,
            data,
            timestamp: Date.now(),
            sessionTime: Date.now() - this.sessionStart
        };
        
        this.events.push(eventData);
        console.log('📊 Event:', eventData);
        
        // Отправка в Telegram (если доступно)
        if (tg) {
            tg.sendData(JSON.stringify(eventData));
        }
    }
    
    getSessionMetrics() {
        return {
            duration: Date.now() - this.sessionStart,
            eventsCount: this.events.length,
            events: this.events
        };
    }
}

// Использование
const analytics = new GameAnalytics();

// Отслеживание событий
analytics.track('game_started');
analytics.track('coin_collected', { coinValue: 10 });
analytics.track('game_over', { score: 1500, duration: 120 });
```

---

## 📋 Чек-лист релиза

### Перед публикацией
- [ ] Все функциональные тесты пройдены
- [ ] Telegram интеграция работает
- [ ] Тестирование на iOS и Android выполнено
- [ ] Производительность оптимизирована
- [ ] Безопасность проверена
- [ ] Аналитика настроена
- [ ] Документация обновлена

### После публикации
- [ ] Мониторинг ошибок активен
- [ ] Метрики собираются
- [ ] Обратная связь от пользователей обрабатывается
- [ ] Обновления планируются

🎯 **Готово!** Игра протестирована и готова к релизу!