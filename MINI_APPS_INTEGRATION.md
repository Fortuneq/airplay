# 🔗 Подключение Telegram Mini Apps для Airplay

## 📑 Содержание
1. [Что такое Telegram Mini Apps](#что-такое-telegram-mini-apps)
2. [Подготовка приложения](#подготовка-приложения)
3. [Интеграция Telegram Web App API](#интеграция-telegram-web-app-api)
4. [Настройка аутентификации](#настройка-аутентификации)
5. [Использование Cloud Storage](#использование-cloud-storage)
6. [Тактильная обратная связь](#тактильная-обратная-связь)
7. [Адаптация под Telegram](#адаптация-под-telegram)
8. [Тестирование интеграции](#тестирование-интеграции)
9. [Продвинутые возможности](#продвинутые-возможности)

---

## 🔍 Что такое Telegram Mini Apps

### Описание
**Telegram Mini Apps** - это веб-приложения, которые запускаются внутри Telegram и имеют доступ к специальным API для:
- Получения данных пользователя
- Сохранения данных в облаке
- Тактильной обратной связи
- Интеграции с UI Telegram

### Преимущества для игр
- 🎮 **Встроенный запуск** - игра открывается прямо в Telegram
- 👤 **Автоматическая авторизация** - пользователь уже авторизован
- ☁️ **Облачное хранение** - прогресс синхронизируется между устройствами
- 🎯 **Социальные функции** - легкая интеграция с контактами Telegram
- 📱 **Нативные ощущения** - тактильная обратная связь и UI адаптация

---

## 🛠️ Подготовка приложения

### Требования к веб-приложению

#### 1. HTTPS обязателен
```bash
# Ваше приложение ДОЛЖНО работать по HTTPS
https://your-domain.com/  ✅
http://your-domain.com/   ❌
```

#### 2. Responsive дизайн
```css
/* Приложение должно адаптироваться под разные размеры */
@media (max-width: 480px) {
    /* Мобильные стили */
}
```

#### 3. Подключение Telegram Script
```html
<!DOCTYPE html>
<html>
<head>
    <!-- ВАЖНО: Скрипт должен загружаться ПЕРВЫМ -->
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <title>Airplay Game</title>
</head>
<body>
    <!-- Ваше приложение -->
    <script src="game.js"></script>
</body>
</html>
```

---

## 🚀 Интеграция Telegram Web App API

### Базовая инициализация

```javascript
// Глобальная переменная Telegram Web App
let tg = window.Telegram?.WebApp;

// Проверка доступности API
if (tg) {
    console.log('Telegram Web App API доступен');
    initTelegramFeatures();
} else {
    console.log('Запуск вне Telegram');
    initStandaloneMode();
}

function initTelegramFeatures() {
    // Расширяем приложение на весь экран
    tg.expand();
    
    // Настраиваем цвета темы
    tg.setHeaderColor('#1e3c72');
    tg.setBackgroundColor('#667eea');
    
    // Показываем, что приложение готово
    tg.ready();
    
    console.log('Telegram Web App инициализирован');
}
```

### Получение информации о пользователе

```javascript
function getUserInfo() {
    if (!tg) return null;
    
    // Получаем данные пользователя
    const user = tg.initDataUnsafe?.user;
    
    if (user) {
        return {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            username: user.username,
            languageCode: user.language_code,
            isPremium: user.is_premium
        };
    }
    
    return null;
}

// Использование
const userInfo = getUserInfo();
if (userInfo) {
    document.getElementById('welcome-text').textContent = 
        `Привет, ${userInfo.firstName}!`;
}
```

### Определение платформы и темы

```javascript
function getTelegramEnvironment() {
    if (!tg) return null;
    
    return {
        platform: tg.platform,        // ios, android, web, etc.
        version: tg.version,          // версия Telegram
        colorScheme: tg.colorScheme,  // light или dark
        themeParams: tg.themeParams,  // цвета темы
        viewportHeight: tg.viewportHeight,
        viewportStableHeight: tg.viewportStableHeight
    };
}

// Адаптация под тему
const env = getTelegramEnvironment();
if (env?.colorScheme === 'dark') {
    document.body.classList.add('dark-theme');
}
```

---

## 🔐 Настройка аутентификации

### Валидация данных пользователя

```javascript
// Проверка подписи данных (важно для безопасности)
function validateTelegramData() {
    if (!tg || !tg.initData) {
        return { valid: false, reason: 'No Telegram data' };
    }
    
    // initData содержит подписанные данные пользователя
    const initData = tg.initData;
    
    // В production нужно проверить подпись на сервере
    // используя bot token
    
    return { 
        valid: true, 
        data: tg.initDataUnsafe,
        rawData: initData 
    };
}
```

### Интеграция с игровыми данными

```javascript
// Привязка аккаунта Telegram к игровому профилю
function linkTelegramAccount() {
    const validation = validateTelegramData();
    
    if (validation.valid && validation.data.user) {
        const user = validation.data.user;
        
        // Создаём или обновляем игровой профиль
        gameData.telegramUser = {
            id: user.id,
            name: user.first_name,
            username: user.username,
            avatar: user.photo_url
        };
        
        // Загружаем сохранённый прогресс
        loadCloudGameData();
        
        console.log(`Аккаунт привязан: ${user.first_name}`);
    }
}
```

---

## ☁️ Использование Cloud Storage

### Основные операции

```javascript
// Сохранение данных в облако Telegram
function saveToCloud(key, data) {
    if (!tg?.CloudStorage) {
        console.log('Cloud Storage недоступен');
        return;
    }
    
    const jsonData = JSON.stringify(data);
    
    tg.CloudStorage.setItem(key, jsonData, (error, success) => {
        if (error) {
            console.error('Ошибка сохранения в облако:', error);
        } else {
            console.log(`Данные сохранены в облако: ${key}`);
        }
    });
}

// Загрузка данных из облака
function loadFromCloud(key, callback) {
    if (!tg?.CloudStorage) {
        callback(null);
        return;
    }
    
    tg.CloudStorage.getItem(key, (error, result) => {
        if (error) {
            console.error('Ошибка загрузки из облака:', error);
            callback(null);
        } else {
            try {
                const data = result ? JSON.parse(result) : null;
                callback(data);
            } catch (e) {
                console.error('Ошибка парсинга данных:', e);
                callback(null);
            }
        }
    });
}

// Получение списка ключей
function getCloudKeys(callback) {
    if (!tg?.CloudStorage) {
        callback([]);
        return;
    }
    
    tg.CloudStorage.getKeys((error, keys) => {
        if (error) {
            console.error('Ошибка получения ключей:', error);
            callback([]);
        } else {
            callback(keys || []);
        }
    });
}
```

### Интеграция с игровыми данными

```javascript
// Сохранение прогресса игры
function saveGameProgress() {
    const progressData = {
        score: gameData.score,
        bestScore: gameData.bestScore,
        coins: gameData.coins,
        unlockedPlanes: gameData.ownedPlanes,
        currentPlane: gameData.currentPlane,
        achievements: gameData.achievements,
        lastSaved: Date.now()
    };
    
    // Сохраняем локально
    localStorage.setItem('airplay-game-data', JSON.stringify(progressData));
    
    // Сохраняем в облако Telegram
    saveToCloud('gameProgress', progressData);
    saveToCloud('statistics', {
        gamesPlayed: gameData.gamesPlayed,
        totalPlayTime: gameData.totalPlayTime,
        averageScore: gameData.averageScore
    });
}

// Загрузка прогресса игры
function loadGameProgress() {
    // Сначала загружаем локальные данные
    const localData = localStorage.getItem('airplay-game-data');
    if (localData) {
        try {
            const data = JSON.parse(localData);
            mergeGameData(data);
        } catch (e) {
            console.error('Ошибка загрузки локальных данных:', e);
        }
    }
    
    // Затем загружаем данные из облака
    loadFromCloud('gameProgress', (cloudData) => {
        if (cloudData) {
            // Сравниваем время последнего сохранения
            const localTime = gameData.lastSaved || 0;
            const cloudTime = cloudData.lastSaved || 0;
            
            if (cloudTime > localTime) {
                // Облачные данные новее
                mergeGameData(cloudData);
                console.log('Загружен прогресс из облака');
            } else {
                console.log('Локальный прогресс актуальнее');
            }
        }
        
        updateUI();
    });
}

function mergeGameData(newData) {
    // Безопасное слияние данных
    Object.keys(newData).forEach(key => {
        if (gameData.hasOwnProperty(key)) {
            gameData[key] = newData[key];
        }
    });
}
```

---

## 📳 Тактильная обратная связь

### Типы обратной связи

```javascript
// Лёгкая вибрация (нажатие кнопки)
function lightHaptic() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Средняя вибрация (успешное действие)
function mediumHaptic() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
}

// Сильная вибрация (ошибка, конец игры)
function heavyHaptic() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('heavy');
    }
}

// Уведомления
function successNotification() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

function errorNotification() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
    }
}

function warningNotification() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('warning');
    }
}

// Выбор элемента
function selectionChanged() {
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.selectionChanged();
    }
}
```

### Интеграция в игровые события

```javascript
// В обработчиках игровых событий
function handleJump() {
    plane.velocityY = JUMP_STRENGTH;
    lightHaptic(); // Лёгкая вибрация при прыжке
}

function collectCoin() {
    gameData.coins++;
    mediumHaptic(); // Средняя вибрация при сборе монеты
    updateCoinsDisplay();
}

function gameOver() {
    gameState = 'gameOver';
    heavyHaptic(); // Сильная вибрация при окончании игры
    showGameOverScreen();
}

function unlockAchievement() {
    successNotification(); // Уведомление об успехе
    showAchievementPopup();
}

function purchaseItem() {
    if (gameData.coins >= price) {
        successNotification();
        // Покупка успешна
    } else {
        errorNotification();
        // Недостаточно средств
    }
}
```

---

## 🎨 Адаптация под Telegram

### Адаптация цветовой схемы

```javascript
function applyTelegramTheme() {
    if (!tg) return;
    
    const themeParams = tg.themeParams;
    
    // Применяем цвета Telegram к игре
    document.documentElement.style.setProperty(
        '--tg-bg-color', themeParams.bg_color || '#ffffff'
    );
    document.documentElement.style.setProperty(
        '--tg-text-color', themeParams.text_color || '#000000'
    );
    document.documentElement.style.setProperty(
        '--tg-hint-color', themeParams.hint_color || '#999999'
    );
    document.documentElement.style.setProperty(
        '--tg-button-color', themeParams.button_color || '#2481cc'
    );
    document.documentElement.style.setProperty(
        '--tg-button-text-color', themeParams.button_text_color || '#ffffff'
    );
    
    // Применяем темную/светлую тему
    if (tg.colorScheme === 'dark') {
        document.body.classList.add('telegram-dark');
    } else {
        document.body.classList.add('telegram-light');
    }
}

// CSS переменные в styles.css
/*
:root {
    --tg-bg-color: #ffffff;
    --tg-text-color: #000000;
    --tg-hint-color: #999999;
    --tg-button-color: #2481cc;
    --tg-button-text-color: #ffffff;
}

.telegram-dark {
    --game-bg: var(--tg-bg-color);
    --game-text: var(--tg-text-color);
}

.telegram-light {
    --game-bg: var(--tg-bg-color);
    --game-text: var(--tg-text-color);
}
*/
```

### Управление viewport

```javascript
function handleViewportChanges() {
    if (!tg) return;
    
    // Обработка изменения размеров viewport
    tg.onEvent('viewportChanged', () => {
        const height = tg.viewportHeight;
        const stableHeight = tg.viewportStableHeight;
        
        // Адаптируем размеры canvas
        resizeGameCanvas(height, stableHeight);
    });
    
    // Обработка изменения темы
    tg.onEvent('themeChanged', () => {
        applyTelegramTheme();
    });
}

function resizeGameCanvas(height, stableHeight) {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
        canvas.style.height = `${height}px`;
        
        // Обновляем размеры игры
        canvas.height = height;
        
        // Пересчитываем позиции игровых объектов
        updateGameDimensions();
    }
}
```

---

## 🧪 Тестирование интеграции

### Проверочный чек-лист

#### Telegram Web App API:
- [ ] Скрипт Telegram загружается
- [ ] `window.Telegram.WebApp` доступен
- [ ] Приложение расширяется на весь экран
- [ ] Цвета темы применяются

#### Пользовательские данные:
- [ ] Данные пользователя получаются корректно
- [ ] Имя пользователя отображается в интерфейсе
- [ ] Подпись данных валидна (в production)

#### Cloud Storage:
- [ ] Данные сохраняются в облако
- [ ] Данные загружаются из облака
- [ ] Синхронизация между устройствами работает
- [ ] Обработка ошибок сети

#### Тактильная обратная связь:
- [ ] Лёгкая вибрация при касаниях
- [ ] Средняя вибрация при событиях
- [ ] Сильная вибрация при важных событиях
- [ ] Уведомления работают корректно

### Тестовый код

```javascript
// Функция для тестирования всех возможностей
function runTelegramIntegrationTest() {
    console.log('🧪 Тестирование Telegram интеграции...');
    
    // 1. Проверка доступности API
    console.log('1. Telegram Web App:', tg ? '✅' : '❌');
    
    // 2. Проверка пользовательских данных
    const user = getUserInfo();
    console.log('2. Данные пользователя:', user ? '✅' : '❌', user);
    
    // 3. Проверка платформы
    const env = getTelegramEnvironment();
    console.log('3. Окружение:', env ? '✅' : '❌', env);
    
    // 4. Тест тактильной обратной связи
    if (tg?.HapticFeedback) {
        console.log('4. Тактильная обратная связь: ✅');
        setTimeout(() => lightHaptic(), 1000);
    } else {
        console.log('4. Тактильная обратная связь: ❌');
    }
    
    // 5. Тест Cloud Storage
    if (tg?.CloudStorage) {
        console.log('5. Cloud Storage: ✅');
        testCloudStorage();
    } else {
        console.log('5. Cloud Storage: ❌');
    }
}

function testCloudStorage() {
    const testData = { test: true, timestamp: Date.now() };
    
    saveToCloud('test', testData);
    
    setTimeout(() => {
        loadFromCloud('test', (data) => {
            if (data && data.test) {
                console.log('   Cloud Storage сохранение/загрузка: ✅');
            } else {
                console.log('   Cloud Storage сохранение/загрузка: ❌');
            }
        });
    }, 1000);
}

// Запуск тестов при инициализации
if (tg) {
    tg.ready();
    runTelegramIntegrationTest();
}
```

---

## 🚀 Продвинутые возможности

### Отправка данных обратно боту

```javascript
// Отправка результатов игры боту
function sendGameResultToBot(score, coins) {
    if (!tg) return;
    
    const gameResult = {
        action: 'game_completed',
        score: score,
        coins: coins,
        timestamp: Date.now(),
        duration: gameData.gameDuration
    };
    
    tg.sendData(JSON.stringify(gameResult));
}

// Закрытие приложения с данными
function closeAppWithResults() {
    const finalData = {
        finalScore: gameData.bestScore,
        totalCoins: gameData.coins,
        achievementsUnlocked: gameData.achievements.length
    };
    
    // Отправляем данные и закрываем
    tg.sendData(JSON.stringify(finalData));
    tg.close();
}
```

### Кнопки интерфейса Telegram

```javascript
// Показать главную кнопку
function showMainButton(text, callback) {
    if (!tg?.MainButton) return;
    
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(callback);
}

// Скрыть главную кнопку
function hideMainButton() {
    if (tg?.MainButton) {
        tg.MainButton.hide();
    }
}

// Показать кнопку "Назад"
function showBackButton(callback) {
    if (!tg?.BackButton) return;
    
    tg.BackButton.show();
    tg.BackButton.onClick(callback);
}

// Пример использования в игре
function showGameOverButtons() {
    showMainButton('Играть ещё раз', restartGame);
    showBackButton(() => showScreen('menu-screen'));
}
```

### Интеграция с контактами

```javascript
// Поделиться результатом с друзьями
function shareGameResult(score) {
    if (!tg) return;
    
    const shareText = `🎮 Мой рекорд в Airplay: ${score} очков! Сможешь побить?`;
    const gameUrl = window.location.href;
    
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`;
    
    tg.openTelegramLink(shareUrl);
}

// Пригласить друга в игру
function inviteFriend() {
    if (!tg) return;
    
    const inviteText = '🎮 Попробуй классную игру Airplay! Управляй самолётом и бей рекорды! ✈️';
    const botUrl = 'https://t.me/your_bot_username';
    
    const inviteUrl = `https://t.me/share/url?url=${encodeURIComponent(botUrl)}&text=${encodeURIComponent(inviteText)}`;
    
    tg.openTelegramLink(inviteUrl);
}
```

---

## 📋 Финальная интеграция

### Полная инициализация

```javascript
// Основная функция инициализации Telegram интеграции
function initTelegramIntegration() {
    if (!tg) {
        console.log('Запуск в standalone режиме');
        initStandaloneMode();
        return;
    }
    
    console.log('Инициализация Telegram Mini App...');
    
    // Базовая настройка
    tg.ready();
    tg.expand();
    
    // Настройка внешнего вида
    tg.setHeaderColor('#1e3c72');
    applyTelegramTheme();
    
    // Получение данных пользователя
    linkTelegramAccount();
    
    // Загрузка прогресса из облака
    loadGameProgress();
    
    // Настройка обработчиков событий
    handleViewportChanges();
    
    // Настройка кнопок интерфейса
    setupTelegramButtons();
    
    // Включение тактильной обратной связи
    enableHapticFeedback();
    
    console.log('Telegram интеграция завершена ✅');
}

// Настройка кнопок Telegram
function setupTelegramButtons() {
    // Главная кнопка по умолчанию скрыта
    tg.MainButton.hide();
    
    // Кнопка назад появляется при необходимости
    tg.BackButton.hide();
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initTelegramIntegration();
    initGame();
});
```

🎯 **Готово!** Telegram Mini Apps интеграция настроена и готова к использованию!