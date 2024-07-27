// Game state
let gameState = {
    crypto: 0,
    clickPower: 1,
    upgrades: {
        gpu: { level: 0, cost: 50, power: 1, scaling: 1.5 },
        asic: { level: 0, cost: 500, power: 10, scaling: 1.8 },
        quantum: { level: 0, cost: 5000, power: 100, scaling: 2.2 },
        solarPanel: { level: 0, cost: 1000, power: 5, scaling: 2 }
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
    
    // Update electricity progress bar
    const electricityPercentage = (gameState.electricity.current / gameState.electricity.max) * 100;
    document.getElementById('electricityProgress').style.width = `${electricityPercentage}%`;
    
    updateUpgradesList();
}

// Update upgrades list
function updateUpgradesList() {
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    Object.entries(gameState.upgrades).forEach(([key, upgrade]) => {
        const li = document.createElement('div');
        li.className = 'bg-card-bg bg-opacity-80 rounded-lg p-4 shadow-md border border-gray-700 backdrop-filter backdrop-blur-sm';
        li.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-lg">${key.toUpperCase()}</span>
                <span class="text-yellow-400">Level ${upgrade.level}</span>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-green-400">${Math.floor(upgrade.cost)} BTC</span>
                <button class="upgrade-btn bg-btn-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" data-upgrade="${key}">Upgrade</button>
            </div>
        `;
        upgradesList.appendChild(li);
    });
    
    // Add event listeners to upgrade buttons
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', function() {
            buyUpgrade(this.getAttribute('data-upgrade'));
        });
    });
}

// Handle crypto clicking
function clickCrypto() {
    if (gameState.electricity.current >= 1) {
        gameState.crypto += gameState.clickPower;
        gameState.electricity.current -= 1;
        updateDisplay();
        animateClick(gameState.clickPower);
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

// Animate click
function animateClick(amount) {
    const container = document.getElementById('clickAnimationContainer');
    const popup = document.createElement('div');
    popup.className = 'click-popup text-2xl text-yellow-400';
    popup.textContent = `+${amount} BTC`;
    
    // Random position within the click area
    const x = Math.random() * (container.offsetWidth - 100);
    const y = Math.random() * (container.offsetHeight - 100);
    
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    container.appendChild(popup);
    
    // Remove the element after the animation completes
    setTimeout(() => {
        container.removeChild(popup);
    }, 2000);
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
        if (upgradeKey === 'solarPanel') {
            gameState.electricity.max += 50;
            gameState.electricity.regenRate += 0.5;
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
    notification.className = `p-4 rounded-lg shadow-lg mb-2 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => notificationContainer.removeChild(notification), 500);
    }, 2500);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('#mineSection, #upgradeSection');
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
            if (typeof window.Telegram.WebApp.CloudStorage.setItem === 'function') {
                window.Telegram.WebApp.CloudStorage.setItem('cryptoTycoonSave', gameStateString, (error, success) => {
                    if (error) {
                        console.log('Error saving game state to CloudStorage:', error);
                    } else {
                        console.log('Game saved successfully to CloudStorage');
                    }
                });
            } else {
                console.log('CloudStorage setItem is not a function, using only localStorage');
            }
        } catch (error) {
            console.log('Error saving to CloudStorage, using only localStorage:', error);
        }
    }
}

// Load game state
function loadGame() {
    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        try {
            if (typeof window.Telegram.WebApp.CloudStorage.getItem === 'function') {
                window.Telegram.WebApp.CloudStorage.getItem('cryptoTycoonSave', (error, value) => {
                    if (error) {
                        console.log('Error loading game state from CloudStorage:', error);
                        loadFromLocalStorage();
                    } else if (value) {
                        try {
                            gameState = JSON.parse(value);
                            updateDisplay();
                            console.log('Game loaded successfully from CloudStorage');
                        } catch (parseError) {
                            console.log('Error parsing game state from CloudStorage:', parseError);
                            loadFromLocalStorage();
                        }
                    } else {
                        loadFromLocalStorage();
                    }
                });
            } else {
                console.log('CloudStorage getItem is not a function, using only localStorage');
                loadFromLocalStorage();
            }
        } catch (error) {
            console.log('Error accessing CloudStorage, using only localStorage:', error);
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
            solarPanel: { level: 0, cost: 1000, power: 5, scaling: 2 }
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
            window.Telegram.WebApp.MainButton.hide();
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
