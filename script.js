// Game state
let gameState = {
    crypto: 0,
    clickPower: 1,
    upgrades: {
        gpu: { level: 0, cost: 10, power: 1 },
        asic: { level: 0, cost: 100, power: 10 },
        quantum: { level: 0, cost: 1000, power: 100 }
    },
    lastUpdate: Date.now()
};

// Load game state from localStorage
function loadGame() {
    const savedGame = localStorage.getItem('cryptoTycoonSave');
    if (savedGame) {
        gameState = JSON.parse(savedGame);
    }
}

// Save game state to localStorage
function saveGame() {
    localStorage.setItem('cryptoTycoonSave', JSON.stringify(gameState));
}

// Update game display
function updateDisplay() {
    document.getElementById('cryptoDisplay').textContent = `${gameState.crypto.toFixed(2)} BTC`;
    
    const upgradesList = document.getElementById('upgradesList');
    upgradesList.innerHTML = '';
    for (const [key, upgrade] of Object.entries(gameState.upgrades)) {
        const li = document.createElement('li');
        li.innerHTML = `
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onclick="buyUpgrade('${key}')">
                Buy ${key.toUpperCase()} (Level ${upgrade.level})
                Cost: ${upgrade.cost.toFixed(2)} BTC
            </button>
        `;
        upgradesList.appendChild(li);
    }
    
    const statsList = document.getElementById('statsList');
    statsList.innerHTML = `
        <li>Click Power: ${gameState.clickPower.toFixed(2)}</li>
        <li>GPUs: ${gameState.upgrades.gpu.level}</li>
        <li>ASICs: ${gameState.upgrades.asic.level}</li>
        <li>Quantum Computers: ${gameState.upgrades.quantum.level}</li>
    `;
}

// Handle crypto clicking
function clickCrypto() {
    gameState.crypto += gameState.clickPower;
    updateDisplay();
}

// Buy upgrade
function buyUpgrade(upgradeKey) {
    const upgrade = gameState.upgrades[upgradeKey];
    if (gameState.crypto >= upgrade.cost) {
        gameState.crypto -= upgrade.cost;
        upgrade.level++;
        upgrade.cost *= 1.5;
        gameState.clickPower += upgrade.power;
        updateDisplay();
        saveGame();
    }
}

// Passive income
function passiveIncome() {
    const now = Date.now();
    const timeDiff = (now - gameState.lastUpdate) / 1000; // in seconds
    gameState.crypto += timeDiff * (
        gameState.upgrades.gpu.level * gameState.upgrades.gpu.power +
        gameState.upgrades.asic.level * gameState.upgrades.asic.power +
        gameState.upgrades.quantum.level * gameState.upgrades.quantum.power
    ) / 10; // Divide by 10 to make passive income slower than active clicking
    gameState.lastUpdate = now;
    updateDisplay();
    saveGame();
}

// Initialize game
function init() {
    loadGame();
    updateDisplay();
    
    // Set up event listeners
    document.getElementById('cryptoClicker').addEventListener('click', clickCrypto);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Set up passive income interval
    setInterval(passiveIncome, 1000);
}

// Toggle dark/light mode
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

// Start the game when the page loads
window.addEventListener('load', init);
