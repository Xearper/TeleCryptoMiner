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
    return (
        gameState.upgrades.gpu.level * gameState.upgrades.gpu.power +
        gameState.upgrades.asic.level * gameState.upgrades.asic.power +
        gameState.upgrades.quantum.level * gameState.upgrades.quantum.power
    ) * 3600 / 20; // Multiply by 3600 for hourly rate, divide by 20 as per passive income calculation
}

// Update game display
function updateDisplay() {
    if (gameState && typeof gameState.crypto !== 'undefined') {
        document.getElementById('cryptoAmount').textContent = `${gameState.crypto.toFixed(2)} BTC`;
        document.getElementById('usernameDisplay').textContent = gameState.username;
        document.getElementById('hourlyIncomeDisplay').textContent = `${calculateHourlyIncome().toFixed(2)} BTC/hr`;
        document.getElementById('currentElectricity').textContent = Math.floor(gameState.electricity.current);
        document.getElementById('maxElectricity').textContent = gameState.electricity.max;
        
        // Update electricity progress bar
        const electricityProgress = document.getElementById('electricityProgress');
        electricityProgress.style.width = `${(gameState.electricity.current / gameState.electricity.max) * 100}%`;
        
        const upgradesList = document.getElementById('upgradesList');
        upgradesList.innerHTML = '';
        for (const [key, upgrade] of Object.entries(gameState.upgrades)) {
            const li = document.createElement('li');
            li.innerHTML = `
                <button class="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white font-bold py-2 px-4 rounded transition-all duration-200 transform hover:scale-105" onclick="buyUpgrade('${key}')">
                    <i class="fas fa-microchip mr-2"></i>Buy ${key.toUpperCase()} (Level ${upgrade.level})
                    <br>Cost: ${upgrade.cost.toFixed(2)} BTC
                </button>
            `;
            upgradesList.appendChild(li);
        }
        
        const statsList = document.getElementById('statsList');
        statsList.innerHTML = `
            <li><i class="fas fa-user mr-2"></i>Player Name: ${gameState.username}</li>
            <li><i class="fas fa-hand-pointer mr-2"></i>Click Power: ${gameState.clickPower.toFixed(2)}</li>
            <li><i class="fas fa-microchip mr-2"></i>GPUs: ${gameState.upgrades.gpu.level}</li>
            <li><i class="fas fa-server mr-2"></i>ASICs: ${gameState.upgrades.asic.level}</li>
            <li><i class="fas fa-atom mr-2"></i>Quantum Computers: ${gameState.upgrades.quantum.level}</li>
            <li><i class="fas fa-bolt mr-2"></i>Max Electricity: ${gameState.electricity.max}</li>
        `;
    } else {
        console.error('Invalid game state in updateDisplay');
    }
}

// Handle crypto clicking
function clickCrypto() {
    if (gameState.electricity.current >= 1) {
        gameState.crypto += gameState.clickPower;
        gameState.electricity.current -= 1;
        updateDisplay();
        animateClick();updateMiningProgress();
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

// Animate click
function animateClick() {
    const clicker = document.getElementById('cryptoClicker');
    clicker.classList.add('pulse');
    setTimeout(() => clicker.classList.remove('pulse'), 300);

    const clickerContainer = document.getElementById('clickerContainer');
    const floatText = document.createElement('div');
    floatText.textContent = `+${gameState.clickPower.toFixed(2)} BTC`;
    floatText.className = 'float-text text-yellow-500 font-bold text-lg';
    floatText.style.left = `${Math.random() * 50 + 25}%`;
    floatText.style.top = `${Math.random() * 20 + 40}%`;
    clickerContainer.appendChild(floatText);
    setTimeout(() => clickerContainer.removeChild(floatText), 1000);
}

// Update mining progress
function updateMiningProgress() {
    const progressBar = document.getElementById('miningProgress');
    let currentWidth = parseFloat(progressBar.style.width) || 0;
    currentWidth += 10; // Increase by 10% per click
    if (currentWidth > 100) {
        currentWidth = 0;
        showNotification('Mining cycle complete!', 'success');
    }
    progressBar.style.width = `${currentWidth}%`;
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
        console.log(`Upgraded ${upgradeKey} to level ${upgrade.level}. New click power: ${gameState.clickPower}`);
    } else {
        showNotification(`Not enough BTC to upgrade ${upgradeKey.toUpperCase()}!`, 'error');
        console.log(`Failed to upgrade ${upgradeKey}. Required: ${upgrade.cost}, Available: ${gameState.crypto}`);
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
    console.log(`Passive income: +${passiveGain.toFixed(2)} BTC`);
}

// Show notification
function showNotification(message, type) {
    const notificationContainer = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification p-4 rounded-lg shadow-lg ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    setTimeout(() => notificationContainer.removeChild(notification), 3000);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            
            // Hide all sections
            sections.forEach(section => section.classList.add('hidden'));
            
            // Show target section
            document.getElementById(`${targetSection}Section`).classList.remove('hidden');
            
            // Update button styles
            navButtons.forEach(navBtn => navBtn.classList.remove('text-blue-500'));
            btn.classList.add('text-blue-500');
        });
    });
}

// Toggle dark/light mode
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    
    // Update background color
    document.body.classList.toggle('bg-gray-100');
    document.body.classList.toggle('bg-gray-900');

    // Update text color
    document.body.classList.toggle('text-gray-800');
    document.body.classList.toggle('text-gray-200');

    // Update nav button colors
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.classList.toggle('text-gray-800');
        btn.classList.toggle('dark:text-gray-200');
    });

    if (isTelegram && window.Telegram.WebApp.setHeaderColor) {
        window.Telegram.WebApp.setHeaderColor(document.documentElement.classList.contains('dark') ? '#1F2937' : '#FFFFFF');
    }
}

// Save game state
function saveGame() {
    const gameStateString = JSON.stringify(gameState);
    localStorage.setItem('cryptoTycoonSave', gameStateString);
    console.log('Game saved to localStorage');

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
        console.log('CloudStorage not available, falling back to localStorage');
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
        gameState = gameState || {};
        gameState.username = window.Telegram.WebApp.initDataUnsafe.user.username || 
                             `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name || ''}`.trim();
    } else {
        gameState = gameState || {};
        gameState.username = gameState.username || "Player" + Math.floor(Math.random() * 1000);
    }

    loadGame();
    updateDisplay();
    setupNavigation();
    
    document.getElementById('cryptoClicker').addEventListener('click', clickCrypto);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('refillElectricity').addEventListener('click', refillElectricity);
    
    setInterval(passiveIncome, 1000);
    setInterval(regenerateElectricity, 1000);
    setInterval(saveGame, 60000); // Save every minute

    document.querySelector('.nav-btn[data-section="mine"]').classList.add('text-blue-500');

    console.log('Game initialized');

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

            window.Telegram.WebApp.onEvent('themeChanged', () => {
                const isDark = window.Telegram.WebApp.colorScheme === 'dark';
                document.documentElement.classList.toggle('dark', isDark);
                toggleTheme();
            });
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', init);
