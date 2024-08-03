// Game state
let gameState = {
    crypto: new Decimal(0),
    clickPower: new Decimal(1),
    upgrades: {
        gpu: { level: 0, cost: new Decimal(50), power: new Decimal(1), scaling: new Decimal(1.5) },
        asic: { level: 0, cost: new Decimal(500), power: new Decimal(10), scaling: new Decimal(1.8) },
        quantum: { level: 0, cost: new Decimal(5000), power: new Decimal(100), scaling: new Decimal(2.2) },
        solarPanel: { level: 0, cost: new Decimal(1000), power: new Decimal(5), scaling: new Decimal(2) }
    },
    lastUpdate: Date.now(),
    username: "Player",
    electricity: {
        current: new Decimal(50),
        max: new Decimal(50),
        regenRate: new Decimal(1),
        lastRegen: Date.now()
    },
    stats: {
        totalClicks: 0,
        totalMined: new Decimal(0),
        upgradesPurchased: 0,
        playTime: 0
    }
};

// Global leaderboard variable
let globalLeaderboard = [];

// Check if running in Telegram environment
const isTelegram = window.Telegram && window.Telegram.WebApp;

// Calculate hourly income
function calculateHourlyIncome() {
    return gameState.upgrades.gpu.level * gameState.upgrades.gpu.power
        .plus(gameState.upgrades.asic.level * gameState.upgrades.asic.power)
        .plus(gameState.upgrades.quantum.level * gameState.upgrades.quantum.power)
        .times(3600).dividedBy(20).floor();
}


// New function to format large numbers
function formatLargeNumber(num) {
    const decimalNum = new Decimal(num);
    if (decimalNum.gte(1e6)) {
        return decimalNum.dividedBy(1e6).toFixed(2) + 'm';
    } else if (decimalNum.gte(1e3)) {
        return decimalNum.dividedBy(1e3).toFixed(2) + 'k';
    } else {
        return decimalNum.toFixed(2);
    }
}


// Update game display
function updateDisplay() {
    const cryptoAmount = gameState.crypto.isNaN() || !gameState.crypto.isFinite() 
        ? "Error" 
        : formatLargeNumber(gameState.crypto);
    document.getElementById('cryptoAmount').textContent = `${cryptoAmount} BTC`;
    document.getElementById('usernameDisplay').textContent = gameState.username;
    document.getElementById('hourlyIncomeDisplay').textContent = `${formatLargeNumber(calculateHourlyIncome())} BTC/hr`;
    document.getElementById('currentElectricity').textContent = formatLargeNumber(gameState.electricity.current);
    document.getElementById('maxElectricity').textContent = formatLargeNumber(gameState.electricity.max);
    
    const electricityPercentage = gameState.electricity.current.dividedBy(gameState.electricity.max).times(100).toNumber();
    document.getElementById('electricityProgress').style.width = `${electricityPercentage}%`;
    
    updateUpgradesList();
    updateStatsList();
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
                <span class="text-green-400">${formatLargeNumber(upgrade.cost)} BTC</span>
                <button class="upgrade-btn bg-btn-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50" data-upgrade="${key}">Upgrade</button>
            </div>
        `;
        upgradesList.appendChild(li);
    });
    
    document.querySelectorAll('.upgrade-btn').forEach(button => {
        button.addEventListener('click', function() {
            buyUpgrade(this.getAttribute('data-upgrade'));
        });
    });
}


// Update stats list
function updateStatsList() {
    const statsList = document.getElementById('statsList');
    statsList.innerHTML = `
        <div class="flex justify-between items-center">
            <span>Total Clicks:</span>
            <span>${formatLargeNumber(gameState.stats.totalClicks)}</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Total BTC Mined:</span><span>${formatLargeNumber(gameState.stats.totalMined)} BTC</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Upgrades Purchased:</span>
            <span>${formatLargeNumber(gameState.stats.upgradesPurchased)}</span>
        </div>
        <div class="flex justify-between items-center">
            <span>Play Time:</span>
            <span>${formatPlayTime(gameState.stats.playTime)}</span>
        </div>
    `;
}

// Format play time
function formatPlayTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

// Handle crypto clicking
function clickCrypto() {
    if (gameState.electricity.current.gte(1)) {
        const mined = gameState.clickPower;
        gameState.crypto = gameState.crypto.plus(mined);
        gameState.electricity.current = gameState.electricity.current.minus(1);
        gameState.stats.totalClicks++;
        gameState.stats.totalMined = gameState.stats.totalMined.plus(mined);
        updateDisplay();
        animateClick(mined);
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

// Animate click
function animateClick(amount) {
    const container = document.getElementById('clickAnimationContainer');
    const popup = document.createElement('div');
    popup.className = 'click-popup text-2xl text-yellow-400';
    popup.textContent = `+${formatLargeNumber(amount)} BTC`;
    
    const x = Math.random() * (container.offsetWidth - 100);
    const y = Math.random() * (container.offsetHeight - 100);
    
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    
    container.appendChild(popup);
    
    setTimeout(() => {
        container.removeChild(popup);
    }, 2000);
}

// Regenerate electricity
function regenerateElectricity() {
    const now = Date.now();
    const timeDiff = new Decimal(now - gameState.electricity.lastRegen).dividedBy(1000);
    const regenAmount = timeDiff.times(gameState.electricity.regenRate);
    gameState.electricity.current = Decimal.min(
        gameState.electricity.current.plus(regenAmount),
        gameState.electricity.max
    );
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
    console.log(`Attempting to buy upgrade: ${upgradeKey}`);
    const upgrade = gameState.upgrades[upgradeKey];
    if (gameState.crypto.gte(upgrade.cost)) {
        gameState.crypto = gameState.crypto.minus(upgrade.cost);
        upgrade.level++;
        upgrade.cost = upgrade.cost.times(upgrade.scaling);
        if (upgradeKey === 'solarPanel') {
            gameState.electricity.max = gameState.electricity.max.plus(50);
            gameState.electricity.regenRate = gameState.electricity.regenRate.plus(0.5);
        } else {
            gameState.clickPower = gameState.clickPower.plus(upgrade.power);
        }
        gameState.stats.upgradesPurchased++;
        updateDisplay();
        saveGame();
        console.log(`Successfully upgraded ${upgradeKey}. Showing success notification.`);
        showNotification(`Upgraded ${upgradeKey.toUpperCase()} to level ${upgrade.level}!`, 'success');
    } else {
        console.log(`Not enough BTC to upgrade ${upgradeKey}. Showing error notification.`);
        showNotification(`Not enough BTC to upgrade ${upgradeKey.toUpperCase()}!`, 'error');
    }
}

// Passive income
function passiveIncome() {
    const now = Date.now();
    const timeDiff = new Decimal(now - gameState.lastUpdate).dividedBy(1000);
    const passiveGain = timeDiff.times(
        gameState.upgrades.gpu.level * gameState.upgrades.gpu.power
        .plus(gameState.upgrades.asic.level * gameState.upgrades.asic.power)
        .plus(gameState.upgrades.quantum.level * gameState.upgrades.quantum.power)
    ).dividedBy(20);
    gameState.crypto = gameState.crypto.plus(passiveGain);
    gameState.stats.totalMined = gameState.stats.totalMined.plus(passiveGain);
    gameState.stats.playTime += timeDiff.toNumber();
    gameState.lastUpdate = now;
    updateDisplay();
    saveGame();
}

function showNotification(message, type) {
    console.log(`Attempting to show notification: ${message} (${type})`);
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.error('Notification container not found in the DOM');
        return;
    }
    const notification = document.createElement('div');
    notification.className = `p-4 rounded-lg shadow-lg mb-2 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    notification.textContent = message;
    notificationContainer.appendChild(notification);
    console.log('Notification added to container');
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
            notificationContainer.removeChild(notification);
            console.log('Notification removed from container');
        }, 500);
    }, 2500);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('#mineSection, #upgradeSection, #statsSection, #leaderboardSection');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.dataset.section;
            sections.forEach(section => section.classList.add('hidden'));
            document.getElementById(`${targetSection}Section`).classList.remove('hidden');
            navButtons.forEach(navBtn => navBtn.classList.remove('text-blue-500'));
            btn.classList.add('text-blue-500');
            
            if (targetSection === 'leaderboard') {
                updateLeaderboardDisplay();
            }
        });
    });
}

// Save game state
function saveGame() {
    validateGameState();
    const gameStateString = JSON.stringify(gameState, (key, value) =>
        value instanceof Decimal ? value.toString() : value
    );
    localStorage.setItem('cryptoTycoonSave', gameStateString);

    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        try {
            window.Telegram.WebApp.CloudStorage.setItem('cryptoTycoonSave', gameStateString, (error, success) => {
                if (error) {
                    console.log('Error saving game state to CloudStorage:', error);
                } else {
                    console.log('Game saved successfully to CloudStorage');
                }
            });
        } catch (error) {
            console.log('Error saving to CloudStorage, using only localStorage:', error);
        }
    }
    
    updateLeaderboard();
}

// Load game state
function loadGame() {
    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        try {
            window.Telegram.WebApp.CloudStorage.getItem('cryptoTycoonSave', (error, value) => {
                if (error) {
                    console.log('Error loading game state from CloudStorage:', error);
                    loadFromLocalStorage();
                } else if (value) {
                    try {
                        parseAndSetGameState(value);
                        console.log('Game loaded successfully from CloudStorage');
                    } catch (parseError) {
                        console.log('Error parsing game state from CloudStorage:', parseError);
                        loadFromLocalStorage();
                    }
                } else {
                    loadFromLocalStorage();
                }
            });
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
            parseAndSetGameState(savedGame);
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

// Parse and set game state
function parseAndSetGameState(stateString) {
    const parsedState = JSON.parse(stateString, (key, value) => {
        if (typeof value === 'string' && /^-?\d*\.?\d+(e[+-]?\d+)?$/.test(value)) {
            return new Decimal(value);
        }
        return value;
    });
    Object.assign(gameState, parsedState);
    validateGameState();
    updateDisplay();
}

// Reset game state to initial values
function resetGameState() {
    gameState = {
        crypto: new Decimal(0),
        clickPower: new Decimal(1),
        upgrades: {
            gpu: { level: 0, cost: new Decimal(50), power: new Decimal(1), scaling: new Decimal(1.5) },
            asic: { level: 0, cost: new Decimal(500), power: new Decimal(10), scaling: new Decimal(1.8) },
            quantum: { level: 0, cost: new Decimal(5000), power: new Decimal(100), scaling: new Decimal(2.2) },
            solarPanel: { level: 0, cost: new Decimal(1000), power: new Decimal(5), scaling: new Decimal(2) }
        },
        lastUpdate: Date.now(),
        username: gameState.username || "Player",
        electricity: {
            current: new Decimal(50),
            max: new Decimal(50),
            regenRate: new Decimal(1),
            lastRegen: Date.now()
        },
        stats: {
            totalClicks: 0,
            totalMined: new Decimal(0),
            upgradesPurchased: 0,
            playTime: 0
        }
    };
    updateDisplay();
    showNotification('Starting new game', 'info');
}

// Validate game state (continued)
function validateGameState() {
    const validationErrors = [];
    if (gameState.crypto.isNaN() || !gameState.crypto.isFinite()) {
        validationErrors.push("Invalid crypto value");
        gameState.crypto = new Decimal(0);
    }
    if (gameState.clickPower.isNaN() || !gameState.clickPower.isFinite() || gameState.clickPower.lt(1)) {
        validationErrors.push("Invalid click power");
        gameState.clickPower = new Decimal(1);
    }
    Object.values(gameState.upgrades).forEach(upgrade => {
        if (upgrade.cost.isNaN() || !upgrade.cost.isFinite() || upgrade.cost.lt(0)) {
            validationErrors.push(`Invalid cost for ${upgrade.name}`);
            upgrade.cost = new Decimal(50);
        }
    });
    if (gameState.electricity.current.isNaN() || !gameState.electricity.current.isFinite() || gameState.electricity.current.lt(0)) {
        validationErrors.push("Invalid current electricity");
        gameState.electricity.current = new Decimal(0);
    }
    if (gameState.electricity.max.isNaN() || !gameState.electricity.max.isFinite() || gameState.electricity.max.lt(50)) {
        validationErrors.push("Invalid max electricity");
        gameState.electricity.max = new Decimal(50);
    }
    if (validationErrors.length > 0) {
        console.error("Game state validation errors:", validationErrors);
        showNotification("Game state error detected and fixed", "error");
    }
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    globalLeaderboard.slice(0, 10).forEach((entry, index) => {
        const item = createLeaderboardItem(index + 1, entry.username, formatLargeNumber(new Decimal(entry.crypto)));
        leaderboardList.appendChild(item);
    });

    if (isTelegram && window.Telegram.WebApp.CloudStorage) {
        window.Telegram.WebApp.CloudStorage.getItem('cryptoTycoonLeaderboard', (error, value) => {
            if (error) {
                console.error('Error fetching leaderboard:', error);
                return;
            }

            let leaderboard = value ? JSON.parse(value) : [];

            // Update or add the current user's entry
            const existingEntryIndex = leaderboard.findIndex(entry => entry.username === gameState.username);
            if (existingEntryIndex !== -1) {
                leaderboard[existingEntryIndex] = leaderboardEntry;
            } else {
                leaderboard.push(leaderboardEntry);
            }

            // Sort leaderboard by crypto amount
            leaderboard.sort((a, b) => new Decimal(b.crypto).minus(new Decimal(a.crypto)).toNumber());

            // Keep only top 100 entries to save storage space
            leaderboard = leaderboard.slice(0, 100);

            // Save updated leaderboard
            window.Telegram.WebApp.CloudStorage.setItem('cryptoTycoonLeaderboard', JSON.stringify(leaderboard), (error) => {
                if (error) {
                    console.error('Error saving leaderboard:', error);
                } else {
                    console.log('Leaderboard updated successfully');
                    globalLeaderboard = leaderboard;
                    updateLeaderboardDisplay();
                }
            });
        });
    }
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    globalLeaderboard.slice(0, 10).forEach((entry, index) => {
        const li = document.createElement('div');
        li.className = 'flex justify-between items-center';
        li.innerHTML = `
            <span>${index + 1}. ${entry.username}</span>
            <span>${new Decimal(entry.crypto).toFixed(2)} BTC</span>
        `;
        leaderboardList.appendChild(li);
    });

// Display user's rank
const userRank = globalLeaderboard.findIndex(entry => entry.username === gameState.username) + 1;
const userRankElement = document.getElementById('userRank');
userRankElement.innerHTML = `
    <span class="text-lg font-semibold">Your Rank: 
        <span class="text-btc-orange">#${userRank}</span>
    </span>
    <br>
    <span class="text-sm">${formatLargeNumber(gameState.crypto)} BTC</span>
`;
}


function clickCrypto() {
    if (gameState.electricity.current.gte(1)) {
        const mined = gameState.clickPower;
        gameState.crypto = gameState.crypto.plus(mined);
        gameState.electricity.current = gameState.electricity.current.minus(1);
        gameState.stats.totalClicks++;
        gameState.stats.totalMined = gameState.stats.totalMined.plus(mined);
        updateDisplay();
        animateClick(mined);

        // Trigger vibration in Telegram environment
        if (isTelegram && window.Telegram.WebApp.hapticFeedback) {
            try {
                window.Telegram.WebApp.hapticFeedback.impactOccurred('light');
                console.log('Vibration triggered');
            } catch (error) {
                console.error('Error triggering vibration:', error);
            }
        }
    } else {
        showNotification("Not enough electricity!", "error");
    }
}

function createLeaderboardItem(rank, username, btcAmount) {
    const item = document.createElement('div');
    item.className = 'flex justify-between items-center p-2 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-colors duration-200';
    item.innerHTML = `
        <div class="flex items-center">
            <span class="text-lg font-semibold mr-3 ${rank <= 3 ? 'text-yellow-400' : 'text-gray-400'}">#${rank}</span>
            <span class="text-white">${username}</span>
        </div>
        <span class="text-btc-orange font-semibold">${btcAmount} BTC</span>
    `;
    return item;
}

// Usage in updateLeaderboardDisplay function
function updateLeaderboardDisplay() {
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';

    globalLeaderboard.slice(0, 10).forEach((entry, index) => {
        const item = createLeaderboardItem(index + 1, entry.username, new Decimal(entry.crypto).toFixed(2));
        leaderboardList.appendChild(item);
    });

    // Display user's rank
    const userRank = globalLeaderboard.findIndex(entry => entry.username === gameState.username) + 1;
    const userRankElement = document.getElementById('userRank');
    userRankElement.innerHTML = `
        <span class="text-lg font-semibold">Your Rank: 
            <span class="text-btc-orange">#${userRank}</span>
        </span>
        <br>
        <span class="text-sm">${gameState.crypto.toFixed(2)} BTC</span>
    `;
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

        // Fetch leaderboard on game start
        if (window.Telegram.WebApp.CloudStorage) {
            window.Telegram.WebApp.CloudStorage.getItem('cryptoTycoonLeaderboard', (error, value) => {
                if (error) {
                    console.error('Error fetching leaderboard:', error);
                } else if (value) {
                    globalLeaderboard = JSON.parse(value);
                    updateLeaderboardDisplay();
                }
            });
        }
    }
}

// Start the game when the page loads
window.addEventListener('load', init);
