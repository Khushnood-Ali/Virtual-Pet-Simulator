// Virtual Pet Simulator - Main Game Logic
class VirtualPet {
    constructor() {
        // Pet attributes
        this.hunger = 50;
        this.happiness = 50;
        this.energy = 50;
        this.age = 0;
        this.daysSurvived = 0;
        
        // Game state
        this.isAlive = true;
        this.isSleeping = false;
        this.lastActionTime = 0;
        this.gameStartTime = Date.now();
        this.feedCount = 0;
        this.playCount = 0;
        this.sleepCount = 0;
        
        // Game settings from provided data
        this.settings = {
            hungerDecayRate: 2,
            happinessDecayRate: 1.5,
            energyDecayRate: 1,
            updateInterval: 8000,
            sleepDuration: 15000,
            actionCooldown: 2000
        };
        
        // Pet states from provided data
        this.states = {
            happy: {emoji: "😊", message: "I'm feeling great!", bgColor: "#FFE066"},
            sad: {emoji: "😢", message: "I need some care...", bgColor: "#FFB6C1"},
            tired: {emoji: "😴", message: "I'm so sleepy...", bgColor: "#E6E6FA"},
            sleeping: {emoji: "😴", message: "Zzz... Sleeping peacefully", bgColor: "#B0C4DE"},
            sick: {emoji: "🤒", message: "I don't feel well...", bgColor: "#FFA07A"},
            excited: {emoji: "🤩", message: "Let's play together!", bgColor: "#98FB98"}
        };
        
        // Interactions from provided data
        this.interactions = {
            feed: {hungerChange: -25, happinessChange: 5, energyChange: 0, message: "Yummy! Thanks for feeding me!"},
            play: {hungerChange: 5, happinessChange: 25, energyChange: -15, message: "That was so much fun!"},
            sleep: {hungerChange: 0, happinessChange: 0, energyChange: 35, message: "I feel refreshed after that nap!"}
        };
        
        // Achievements from provided data
        this.achievements = [
            {id: "first_day", name: "First Day", description: "Keep your pet alive for 1 day", unlocked: false, icon: "🎉"},
            {id: "happy_pet", name: "Happy Pet", description: "Keep happiness above 75% for 10 minutes", unlocked: false, icon: "😄"},
            {id: "well_fed", name: "Well Fed", description: "Feed your pet 10 times", unlocked: false, icon: "🍖"}
        ];
        
        // DOM elements
        this.elements = {
            petEmoji: document.getElementById('petEmoji'),
            petMessage: document.getElementById('petMessage'),
            petDisplay: document.getElementById('petDisplay'),
            hungerValue: document.getElementById('hungerValue'),
            happinessValue: document.getElementById('happinessValue'),
            energyValue: document.getElementById('energyValue'),
            hungerBar: document.getElementById('hungerBar'),
            happinessBar: document.getElementById('happinessBar'),
            energyBar: document.getElementById('energyBar'),
            feedBtn: document.getElementById('feedBtn'),
            playBtn: document.getElementById('playBtn'),
            sleepBtn: document.getElementById('sleepBtn'),
            resetBtn: document.getElementById('resetBtn'),
            saveBtn: document.getElementById('saveBtn'),
            petAge: document.getElementById('petAge'),
            gameTime: document.getElementById('gameTime'),
            notification: document.getElementById('notification'),
            notificationText: document.getElementById('notificationText'),
            cooldownIndicator: document.getElementById('cooldownIndicator'),
            cooldownBar: document.getElementById('cooldownBar'),
            achievementsList: document.getElementById('achievementsList')
        };
        
        // Initialize game
        this.init();
    }
    
    init() {
        // Load saved game if exists
        this.loadGame();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start game loops
        this.startGameLoop();
        this.startDayNightCycle();
        
        // Initial render
        this.updateDisplay();
        this.renderAchievements();
        
        console.log('Virtual Pet Simulator initialized!');
    }
    
    setupEventListeners() {
        // Action buttons
        this.elements.feedBtn.addEventListener('click', () => this.performAction('feed'));
        this.elements.playBtn.addEventListener('click', () => this.performAction('play'));
        this.elements.sleepBtn.addEventListener('click', () => this.performAction('sleep'));
        
        // Game controls
        this.elements.resetBtn.addEventListener('click', () => this.resetGame());
        this.elements.saveBtn.addEventListener('click', () => this.saveGame());
        
        // Auto-save before page unload
        window.addEventListener('beforeunload', () => this.saveGame());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === '1' || e.key === 'f') this.performAction('feed');
            if (e.key === '2' || e.key === 'p') this.performAction('play');
            if (e.key === '3' || e.key === 's') this.performAction('sleep');
        });
    }
    
    startGameLoop() {
        // Main game update loop
        setInterval(() => {
            if (this.isAlive && !this.isSleeping) {
                this.updateAttributes();
                this.checkAchievements();
                this.updateDisplay();
            }
        }, this.settings.updateInterval);
        
        // Age update loop (every minute)
        setInterval(() => {
            this.age += 1;
            this.updateDisplay();
        }, 60000);
    }
    
    startDayNightCycle() {
        // 24-hour cycle = 24 minutes (1 minute = 1 hour)
        setInterval(() => {
            const currentTime = Date.now();
            const elapsedMinutes = Math.floor((currentTime - this.gameStartTime) / 60000);
            const hour = elapsedMinutes % 24;
            
            if (hour >= 6 && hour < 18) {
                document.body.classList.remove('night');
                this.elements.gameTime.textContent = 'Day';
            } else {
                document.body.classList.add('night');
                this.elements.gameTime.textContent = 'Night';
            }
        }, 60000);
    }
    
    updateAttributes() {
        // Natural decay over time
        this.hunger = Math.min(100, this.hunger + this.settings.hungerDecayRate);
        this.happiness = Math.max(0, this.happiness - this.settings.happinessDecayRate);
        this.energy = Math.max(0, this.energy - this.settings.energyDecayRate);
        
        // Check if pet is still alive
        if (this.hunger >= 100 || this.happiness <= 0 || this.energy <= 0) {
            this.isAlive = false;
            this.showNotification("Your pet needs immediate care! 😰", 'error');
        }
    }
    
    performAction(action) {
        const now = Date.now();
        
        // Check cooldown
        if (now - this.lastActionTime < this.settings.actionCooldown) {
            this.showNotification("Wait a moment before next action!", 'warning');
            return;
        }
        
        // Check if pet is sleeping
        if (this.isSleeping && action !== 'sleep') {
            this.showNotification("Shh... Your pet is sleeping!", 'info');
            return;
        }
        
        const interaction = this.interactions[action];
        if (!interaction) return;
        
        // Apply changes
        this.hunger = Math.max(0, Math.min(100, this.hunger + interaction.hungerChange));
        this.happiness = Math.max(0, Math.min(100, this.happiness + interaction.happinessChange));
        this.energy = Math.max(0, Math.min(100, this.energy + interaction.energyChange));
        
        // Track action counts
        if (action === 'feed') this.feedCount++;
        if (action === 'play') this.playCount++;
        if (action === 'sleep') this.sleepCount++;
        
        // Handle sleep action
        if (action === 'sleep') {
            this.isSleeping = true;
            this.disableActions();
            
            setTimeout(() => {
                this.isSleeping = false;
                this.enableActions();
                this.showNotification(interaction.message, 'success');
                this.updateDisplay();
            }, this.settings.sleepDuration);
        } else {
            this.showNotification(interaction.message, 'success');
        }
        
        // Update last action time and cooldown
        this.lastActionTime = now;
        this.showCooldown();
        
        // Trigger pet animation
        this.triggerPetAnimation(action);
        
        // Update display
        this.updateDisplay();
        this.checkAchievements();
        
        // Check if pet is revived
        if (!this.isAlive && this.hunger < 100 && this.happiness > 0 && this.energy > 0) {
            this.isAlive = true;
            this.showNotification("Your pet is feeling better! 🎉", 'success');
        }
    }
    
    triggerPetAnimation(action) {
        const petEmoji = this.elements.petEmoji;
        
        // Remove existing animation classes
        petEmoji.classList.remove('bounce', 'spin', 'shake');
        
        // Add animation based on action
        switch (action) {
            case 'feed':
                petEmoji.classList.add('bounce');
                setTimeout(() => petEmoji.classList.remove('bounce'), 1000);
                break;
            case 'play':
                petEmoji.classList.add('spin');
                setTimeout(() => petEmoji.classList.remove('spin'), 1000);
                break;
            case 'sleep':
                // Sleep animation handled by CSS state change
                break;
        }
    }
    
    getCurrentState() {
        if (this.isSleeping) return 'sleeping';
        if (!this.isAlive || this.hunger >= 100 || this.happiness <= 10) return 'sick';
        if (this.energy <= 25) return 'tired';
        if (this.hunger >= 75 || this.happiness <= 25) return 'sad';
        if (this.happiness >= 75 && this.hunger <= 25) return 'happy';
        if (this.happiness >= 85) return 'excited';
        return 'happy'; // default state
    }
    
    updateDisplay() {
        const currentState = this.getCurrentState();
        const state = this.states[currentState];
        
        // Update pet appearance
        this.elements.petEmoji.textContent = state.emoji;
        this.elements.petMessage.textContent = state.message;
        
        // Update pet display class
        this.elements.petDisplay.className = `pet-display ${currentState}`;
        
        // Update attribute values
        this.elements.hungerValue.textContent = Math.round(this.hunger);
        this.elements.happinessValue.textContent = Math.round(this.happiness);
        this.elements.energyValue.textContent = Math.round(this.energy);
        
        // Update progress bars
        this.updateProgressBar(this.elements.hungerBar, this.hunger);
        this.updateProgressBar(this.elements.happinessBar, this.happiness);
        this.updateProgressBar(this.elements.energyBar, this.energy);
        
        // Update age display
        const minutes = Math.floor(this.age / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            this.elements.petAge.textContent = `${days} day${days !== 1 ? 's' : ''}`;
        } else if (hours > 0) {
            this.elements.petAge.textContent = `${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
        } else {
            this.elements.petAge.textContent = `${minutes % 60} min`;
        }
    }
    
    updateProgressBar(barElement, value) {
        const percentage = Math.max(0, Math.min(100, value));
        barElement.style.width = `${percentage}%`;
        
        // Update color based on value
        barElement.classList.remove('high', 'medium', 'low');
        if (percentage >= 75) {
            barElement.classList.add('high');
        } else if (percentage >= 25) {
            barElement.classList.add('medium');
        } else {
            barElement.classList.add('low');
        }
    }
    
    showCooldown() {
        const cooldownIndicator = this.elements.cooldownIndicator;
        const cooldownBar = this.elements.cooldownBar;
        
        cooldownIndicator.classList.add('active');
        cooldownBar.style.width = '100%';
        cooldownBar.style.transition = `width ${this.settings.actionCooldown}ms linear`;
        
        setTimeout(() => {
            cooldownBar.style.width = '0%';
        }, 50);
        
        setTimeout(() => {
            cooldownIndicator.classList.remove('active');
        }, this.settings.actionCooldown);
    }
    
    disableActions() {
        this.elements.feedBtn.disabled = true;
        this.elements.playBtn.disabled = true;
        this.elements.sleepBtn.disabled = true;
    }
    
    enableActions() {
        this.elements.feedBtn.disabled = false;
        this.elements.playBtn.disabled = false;
        this.elements.sleepBtn.disabled = false;
    }
    
    checkAchievements() {
        // First Day achievement
        const hoursAlive = (Date.now() - this.gameStartTime) / (1000 * 60 * 60);
        if (hoursAlive >= 24 && !this.achievements[0].unlocked) {
            this.unlockAchievement('first_day');
        }
        
        // Happy Pet achievement (happiness > 75% for 10 minutes)
        if (this.happiness >= 75 && !this.achievements[1].unlocked) {
            if (!this.happyStartTime) {
                this.happyStartTime = Date.now();
            } else if (Date.now() - this.happyStartTime >= 600000) { // 10 minutes
                this.unlockAchievement('happy_pet');
            }
        } else {
            this.happyStartTime = null;
        }
        
        // Well Fed achievement
        if (this.feedCount >= 10 && !this.achievements[2].unlocked) {
            this.unlockAchievement('well_fed');
        }
    }
    
    unlockAchievement(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            this.showNotification(`Achievement Unlocked: ${achievement.name}! 🏆`, 'success');
            this.renderAchievements();
        }
    }
    
    renderAchievements() {
        const list = this.elements.achievementsList;
        list.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                </div>
            `;
            list.appendChild(achievementEl);
        });
    }
    
    showNotification(message, type = 'info') {
        const notification = this.elements.notification;
        const notificationText = this.elements.notificationText;
        
        notificationText.textContent = message;
        notification.classList.remove('show');
        
        // Update notification style based on type
        notification.className = 'notification';
        if (type === 'error') notification.style.background = 'var(--color-error)';
        else if (type === 'warning') notification.style.background = 'var(--color-warning)';
        else if (type === 'success') notification.style.background = 'var(--color-success)';
        else notification.style.background = 'var(--color-info)';
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide notification after 3 seconds
        setTimeout(() => notification.classList.remove('show'), 3000);
    }
    
    saveGame() {
        const gameData = {
            hunger: this.hunger,
            happiness: this.happiness,
            energy: this.energy,
            age: this.age,
            daysSurvived: this.daysSurvived,
            isAlive: this.isAlive,
            gameStartTime: this.gameStartTime,
            feedCount: this.feedCount,
            playCount: this.playCount,
            sleepCount: this.sleepCount,
            achievements: this.achievements,
            lastSaveTime: Date.now()
        };
        
        try {
            localStorage.setItem('virtualPetSave', JSON.stringify(gameData));
            this.showNotification('Game saved successfully! 💾', 'success');
        } catch (error) {
            console.error('Failed to save game:', error);
            this.showNotification('Failed to save game!', 'error');
        }
    }
    
    loadGame() {
        try {
            const savedData = localStorage.getItem('virtualPetSave');
            if (savedData) {
                const gameData = JSON.parse(savedData);
                
                // Load basic attributes
                this.hunger = gameData.hunger || 50;
                this.happiness = gameData.happiness || 50;
                this.energy = gameData.energy || 50;
                this.age = gameData.age || 0;
                this.daysSurvived = gameData.daysSurvived || 0;
                this.isAlive = gameData.isAlive !== undefined ? gameData.isAlive : true;
                this.gameStartTime = gameData.gameStartTime || Date.now();
                this.feedCount = gameData.feedCount || 0;
                this.playCount = gameData.playCount || 0;
                this.sleepCount = gameData.sleepCount || 0;
                
                // Load achievements
                if (gameData.achievements) {
                    gameData.achievements.forEach((savedAchievement, index) => {
                        if (this.achievements[index]) {
                            this.achievements[index].unlocked = savedAchievement.unlocked;
                        }
                    });
                }
                
                // Calculate time passed since last save
                const timePassed = Date.now() - (gameData.lastSaveTime || Date.now());
                const minutesPassed = Math.floor(timePassed / 60000);
                
                // Apply decay for time away
                if (minutesPassed > 0) {
                    const decayFactor = Math.min(minutesPassed / 60, 2); // Max 2 hours worth of decay
                    this.hunger = Math.min(100, this.hunger + (this.settings.hungerDecayRate * decayFactor * 10));
                    this.happiness = Math.max(0, this.happiness - (this.settings.happinessDecayRate * decayFactor * 10));
                    this.energy = Math.max(0, this.energy - (this.settings.energyDecayRate * decayFactor * 10));
                    
                    if (minutesPassed > 30) {
                        this.showNotification(`Welcome back! Your pet missed you for ${Math.floor(minutesPassed / 60)} hours!`, 'info');
                    }
                }
                
                console.log('Game loaded successfully');
            }
        } catch (error) {
            console.error('Failed to load game:', error);
            this.showNotification('Failed to load saved game!', 'warning');
        }
    }
    
    resetGame() {
        if (confirm('Are you sure you want to reset your pet? This will delete all progress!')) {
            // Clear saved data
            localStorage.removeItem('virtualPetSave');
            
            // Reset all attributes
            this.hunger = 50;
            this.happiness = 50;
            this.energy = 50;
            this.age = 0;
            this.daysSurvived = 0;
            this.isAlive = true;
            this.isSleeping = false;
            this.gameStartTime = Date.now();
            this.feedCount = 0;
            this.playCount = 0;
            this.sleepCount = 0;
            this.happyStartTime = null;
            
            // Reset achievements
            this.achievements.forEach(achievement => {
                achievement.unlocked = false;
            });
            
            // Update display
            this.updateDisplay();
            this.renderAchievements();
            this.enableActions();
            
            // Remove night mode
            document.body.classList.remove('night');
            this.elements.gameTime.textContent = 'Day';
            
            this.showNotification('Game reset! Your new pet is ready! 🐣', 'success');
        }
    }
}

// Initialize the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.virtualPet = new VirtualPet();
});

// Add CSS animation classes dynamically
const style = document.createElement('style');
style.textContent = `
    .pet-emoji.bounce {
        animation: petBounce 0.5s ease-in-out 2 !important;
    }
    
    .pet-emoji.spin {
        animation: petSpin 1s ease-in-out 1 !important;
    }
    
    .pet-emoji.shake {
        animation: petShake 0.5s ease-in-out 3 !important;
    }
`;
document.head.appendChild(style);