// Game state
let gameState = {
    crypto: 0,
    clickPower: 1,
    upgrades: {
        gpu: { level: 0, cost: 50, power: 1, scaling: 1.5 },
        asic: { level: 0, cost: 500, power: 10, scaling: 1.8 },
        quantum: { level: 0, cost: 5000, power: 100, scaling: 2.2 },
        electricity: { level: 1, cost: 1000, scaling: 2 }
    },
    lastUpdate: Date.now(),
    username: "Player",
    electricity: {
        current: 50,
        max: 50,
        regenRate: 1, // 1 electricity per second
        lastRegen: Date.now()
    }
};

// Check if running in Telegram environment
const isTelegram = window.Telegram && window.Telegram.WebApp;

// Calculate hourly income
function calculateHourlyIncome() {
    return Math.floor((
        gameState.upgrades.gpu.level * gameState.upgrades.gpu.power +
        gameState.upgrades.asic.level * gameState.upgrades.asic.power +
        gameState.upgrades.quantum.level * gameState.upgrades.quantum.power
    ) * 3600 / 20); // Multiply by 3600 for hourly rate, divide by 20 as per passive income calculation
}

// Update game display
function updateDisplay() {
    document.getElementById('cryptoAmount').textContent = `${Math.floor(gameState.crypto)} BTC`;
    document.getElementById('usernameDisplay').textContent = gameState.username;
    document.getElementById('hourlyIncomeDisplay').textContent = `${calculateHourlyIncome()} BTC/hr`;
    document.getElementById('currentElectricity').textContent = Math.floor(gameState.electricity.current);
    document.getElementById('maxElectricity').textContent = gameState.electricity.max;
    
    updateUpgradesList();
}

// Update upgrades list
function updateUpgradesList() {
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    for (const [key, upgrade] of Object.entries(gameState.upgrades)) {
        const li = document.createElement('li');
        li.innerHTML = `
            <button class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-all duration-200 transform hover:scale-105" onclick="buyUpgrade('${key}')">
                <div class="flex justify-between items-center">
                    <span>${key.toUpperCase()} (Level ${upgrade.level})</span>
                    <span>${Math.floor(upgrade.cost)} BTC</span>
                </div>
            </button>
        `;
        upgradesList.appendChild(li);
    }
}

// Handle crypto clicking
function clickCrypto() {
    if (gameState.electricity.current >= 1) {
        gameState.crypto += gameState.clickPower;
        gameState.electricity.current -= 1;
        updateDisplay();
        animateClick();
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

// Animate click
function animateClick() {
    const clicker = document.getElementById('cryptoClicker');
    clicker.classList.add('clicked');
    setTimeout(() => clicker.classList.remove('clicked'), 100);

    const floatText = document.createElement('div');
    floatText.textContent = `+${Math.floor(gameState.clickPower)} BTC`;
    floatText.className = 'float-text text-yellow-500 font-bold text-lg absolute';
    floatText.style.left = `${Math.random() * 80 + 10}%`;
    floatText.style.top = `${Math.random() * 60 + 20}%`;
    document.body.appendChild(floatText);
    setTimeout(() => document.body.removeChild(floatText), 1000);
}

// Regenerate electricity
function regenerateElectricity() {
    const now = Date.now();
    const timeDiff = (now - gameState.electricity.lastRegen) / 1000; // in seconds
    const regenAmount = timeDiff * gameState.electricity.regenRate;
    gameState.electricity.current = Math.min(gameState.electricity.current + regenAmount, gameState.electricity.max);
    gameState.electricity.lastRegen = now;
    updateDisplay();
}

// Refill electricity
function refillElectricity() {
    gameState.electricity.current = gameState.electricity.max;
    updateDisplay();
    showNotification("Electricity refilled!", "success");
}

// Buy upgrade
function buyUpgrade(upgradeKey) {
    const upgrade = gameState.upgrades[upgradeKey];
    if (gameState.crypto >= upgrade.cost) {
        gameState.crypto -= upgrade.cost;
        upgrade.level++;
        upgrade.cost *= upgrade.scaling;
        if (upgradeKey === 'electricity') {
            gameState.electricity.max += 50;
        } else {
            gameState.clickPower += upgrade.power;
        }
        updateDisplay();
        saveGame();
        showNotification(`Upgraded ${upgradeKey.toUpperCase()} to level ${upgrade.level}!`, 'success');
    } else {
        showNotification(`Not enough BTC to upgrade ${upgradeKey.toUpperCase()}!`, 'error');
    }
}

// Passive income
function passiveIncome() {
    const now = Date.now();
    const timeDiff = (now - gameState.lastUpdate) / 1000; // in seconds
    const passiveGain = timeDiff * (
        gameState.upgrades.gpu.level * gameState.upgrades.gpu.power +
        gameState.upgrades.asic.level * gameState.upgrades.asic.power +
        gameState.upgrades.quantum.level * gameState.upgrades.quantum.power
    ) / 20; // Divide by 20 to make passive income slower
    gameState.crypto += passiveGain;
    gameState.lastUpdate = now;
    updateDisplay();
    saveGame();
}

// Show notification
function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification p-4 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white mb-2`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notificationContainer.removeChild(notification), 500);
    }, 2500);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById(`${targetSection}Section`).classList.remove('hidden');
            navButtons.forEach(navBtn => navBtn.classList.remove('text-blue-500'));
            btn.classList.add('text-blue-500');
        });
    });
}

// Save game state
function saveGame() {
    const gameStateString = JSON.stringify(gameState);
    localStorage.setItem('cryptoTycoonSave', gameStateString);

    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        try {
            window.Telegram.WebApp.CloudStorage.setItem('cryptoTycoonSave', gameStateString, (error, success) => {
                if (error) {
                    console.error('Error saving game state to CloudStorage:', error);
                } else {
                    console.log('Game saved successfully to CloudStorage');
                }
            });
        } catch (error) {
            console.error('Error saving to CloudStorage:', error);
        }
    }
}

// Load game state
function loadGame() {
    let loaded = false;

    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        try {
            window.Telegram.WebApp.CloudStorage.getItem('cryptoTycoonSave', (error, value) => {
                if (error) {
                    console.error('Error loading game state from CloudStorage:', error);
                } else if (value) {
                    try {
                        gameState = JSON.parse(value);
                        updateDisplay();
                        console.log('Game loaded successfully from CloudStorage');
                        loaded = true;
                    } catch (parseError) {
                        console.error('Error parsing game state from CloudStorage:', parseError);
                    }
                }
                if (!loaded) loadFromLocalStorage();
            });
        } catch (error) {
            console.error('Error accessing CloudStorage:', error);
            loadFromLocalStorage();
        }
    } else {
        loadFromLocalStorage();
    }
}

// Load game from localStorage
function loadFromLocalStorage() {
    const savedGame = localStorage.getItem('cryptoTycoonSave');
    if (savedGame) {
        try {
            gameState = JSON.parse(savedGame);
            updateDisplay();
            console.log('Game loaded from localStorage');
        } catch (error) {
            console.error('Error parsing game state from localStorage:', error);
            resetGameState();
        }
    } else {
        console.log('No saved game found');
        resetGameState();
    }
}

// Reset game state to initial values
function resetGameState() {
    gameState = {
        crypto: 0,
        clickPower: 1,
        upgrades: {
            gpu: { level: 0, cost: 50, power: 1, scaling: 1.5 },
            asic: { level: 0, cost: 500, power: 10, scaling: 1.8 },
            quantum: { level: 0, cost: 5000, power: 100, scaling: 2.2 },
            electricity: { level: 1, cost: 1000, scaling: 2 }
        },
        lastUpdate: Date.now(),
        username: gameState.username || "Player",
        electricity: {
            current: 50,
            max: 50,
            regenRate: 1,
            lastRegen: Date.now()
        }
    };
    updateDisplay();
    showNotification('Starting new game', 'info');
}

// Initialize game
function init() {
    if (isTelegram && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
        gameState.username = window.Telegram.WebApp.initDataUnsafe.user.username || 
                             `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name || ''}`.trim();
    } else {
        gameState.username = gameState.username || "Player" + Math.floor(Math.random() * 1000);
    }

    loadGame();
    updateDisplay();
    setupNavigation();
    
    document.getElementById('cryptoClicker').addEventListener('click', clickCrypto);
    document.getElementById('refillElectricity').addEventListener('click', refillElectricity);
    
    setInterval(passiveIncome, 1000);
    setInterval(regenerateElectricity, 1000);
    setInterval(saveGame, 60000); // Save every minute

    if (isTelegram) {
        if (window.Telegram.WebApp.ready) window.Telegram.WebApp.ready();
        
        if (window.Telegram.WebApp.MainButton) {
            window.Telegram.WebApp.MainButton.setText('Save Game').show();
            window.Telegram.WebApp.MainButton.onClick(saveGame);
        }

        if (window.Telegram.WebApp.onEvent) {
            window.Telegram.WebApp.onEvent('backButtonClicked', () => {
                saveGame();
                window.Telegram.WebApp.close();
            });
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', init);
