/**
 * Settings Module
 * Manages app configuration and preferences
 */

// Default settings
const DEFAULT_SETTINGS = {
    // Firebase Config
    useCustomFirebase: false,
    firebaseApiKey: '',
    firebaseDatabaseURL: '',
    firebaseProjectId: '',
    firebaseStorageBucket: '',
    firebaseMessagingSenderId: '',
    firebaseAppId: '',
    
    // Theme
    darkMode: false,
    accentColor: '#27ae60',
    
    // Game Defaults
    defaultPlayerCount: 4,
    defaultGame: 'shanghai',
    rememberLastSettings: true,
    
    // Display
    fontSize: 'medium', // small, medium, large
    compactMode: false,
    showDealerNotes: true,
    
    // Multiplayer
    rememberGameCode: true,
    lastGameCode: '',
    defaultHostName: '',
    
    // Sound & Notifications
    soundEffects: false,
    vibration: true,
    notifyOnTurn: false,
    
    // Advanced
    debugMode: false
};

// Load settings from localStorage
function loadSettings() {
    const saved = localStorage.getItem('gameScorer_settings');
    if (saved) {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        } catch (e) {
            console.error('Failed to load settings:', e);
            return { ...DEFAULT_SETTINGS };
        }
    }
    return { ...DEFAULT_SETTINGS };
}

// Save settings to localStorage
function saveSettings(settings) {
    localStorage.setItem('gameScorer_settings', JSON.stringify(settings));
    applySettings(settings);
}

// Apply settings to the app
function applySettings(settings) {
    // Apply dark mode
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Apply accent color (but don't override game-specific colors during gameplay)
    if (!state || !state.currentGame) {
        document.documentElement.style.setProperty('--accent', settings.accentColor);
        document.documentElement.style.setProperty('--primary', settings.accentColor);
    }
    
    // Apply font size
    document.body.classList.remove('font-small', 'font-medium', 'font-large');
    document.body.classList.add(`font-${settings.fontSize}`);
    
    // Apply compact mode
    if (settings.compactMode) {
        document.body.classList.add('compact-mode');
    } else {
        document.body.classList.remove('compact-mode');
    }
    
    // Set default player count and game
    const playerCountEl = document.getElementById('player-count');
    const gameSelectEl = document.getElementById('game-select');
    
    if (playerCountEl && gameSelectEl) {
        // Always apply defaults unless user explicitly wants to remember last game
        if (!settings.rememberLastSettings) {
            playerCountEl.value = settings.defaultPlayerCount;
            gameSelectEl.value = settings.defaultGame;
            
            // Only call these if they're defined
            if (typeof updatePlayerCountButtons === 'function') {
                updatePlayerCountButtons();
            }
            if (typeof updateSetupUI === 'function') {
                updateSetupUI();
            }
        }
    }
    
    // Debug mode
    if (settings.debugMode) {
        console.log('🔧 Debug Mode Enabled');
        console.log('Current Settings:', settings);
    }
}


// Show settings screen
function showSettings() {
    const settings = loadSettings();
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('settings-screen').style.display = 'block';
    
    // Populate form
    document.getElementById('setting-use-custom-firebase').checked = settings.useCustomFirebase;
    document.getElementById('setting-firebase-api-key').value = settings.firebaseApiKey;
    document.getElementById('setting-firebase-db-url').value = settings.firebaseDatabaseURL;
    document.getElementById('setting-firebase-project-id').value = settings.firebaseProjectId;
    document.getElementById('setting-firebase-storage').value = settings.firebaseStorageBucket;
    document.getElementById('setting-firebase-sender-id').value = settings.firebaseMessagingSenderId;
    document.getElementById('setting-firebase-app-id').value = settings.firebaseAppId;
    
    document.getElementById('setting-dark-mode').checked = settings.darkMode;
    document.getElementById('setting-accent-color').value = settings.accentColor;
    
    document.getElementById('setting-default-players').value = settings.defaultPlayerCount;
    document.getElementById('setting-default-game').value = settings.defaultGame;
    document.getElementById('setting-remember-last').checked = settings.rememberLastSettings;
    
    document.getElementById('setting-font-size').value = settings.fontSize;
    document.getElementById('setting-compact-mode').checked = settings.compactMode;
    document.getElementById('setting-show-dealer-notes').checked = settings.showDealerNotes;
    
    document.getElementById('setting-remember-code').checked = settings.rememberGameCode;
    document.getElementById('setting-default-host-name').value = settings.defaultHostName;
    
    document.getElementById('setting-sound-effects').checked = settings.soundEffects;
    document.getElementById('setting-vibration').checked = settings.vibration;
    document.getElementById('setting-notify-turn').checked = settings.notifyOnTurn;
    
    document.getElementById('setting-debug-mode').checked = settings.debugMode;
    
    toggleFirebaseFields();
}

// Close settings screen
function closeSettings() {
    document.getElementById('settings-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

// Save settings from form
function saveSettingsFromForm() {
    const settings = {
        useCustomFirebase: document.getElementById('setting-use-custom-firebase').checked,
        firebaseApiKey: document.getElementById('setting-firebase-api-key').value,
        firebaseDatabaseURL: document.getElementById('setting-firebase-db-url').value,
        firebaseProjectId: document.getElementById('setting-firebase-project-id').value,
        firebaseStorageBucket: document.getElementById('setting-firebase-storage').value,
        firebaseMessagingSenderId: document.getElementById('setting-firebase-sender-id').value,
        firebaseAppId: document.getElementById('setting-firebase-app-id').value,
        
        darkMode: document.getElementById('setting-dark-mode').checked,
        accentColor: document.getElementById('setting-accent-color').value,
        
        defaultPlayerCount: parseInt(document.getElementById('setting-default-players').value),
        defaultGame: document.getElementById('setting-default-game').value,
        rememberLastSettings: document.getElementById('setting-remember-last').checked,
        
        fontSize: document.getElementById('setting-font-size').value,
        compactMode: document.getElementById('setting-compact-mode').checked,
        showDealerNotes: document.getElementById('setting-show-dealer-notes').checked,
        
        rememberGameCode: document.getElementById('setting-remember-code').checked,
        lastGameCode: loadSettings().lastGameCode, // Preserve
        defaultHostName: document.getElementById('setting-default-host-name').value,
        
        soundEffects: document.getElementById('setting-sound-effects').checked,
        vibration: document.getElementById('setting-vibration').checked,
        notifyOnTurn: document.getElementById('setting-notify-turn').checked,
        
        debugMode: document.getElementById('setting-debug-mode').checked
    };
    
    saveSettings(settings);
    
    // Show confirmation
    if (typeof showAlert === 'function') {
        showAlert('Settings saved successfully!');
    } else {
        alert('Settings saved successfully!');
    }
    
    closeSettings();
}

// Reset to defaults
function resetSettingsToDefault() {
    const confirmMsg = 'Reset all settings to defaults?';
    
    const doReset = () => {
        saveSettings(DEFAULT_SETTINGS);
        showSettings(); // Reload form
        if (typeof showAlert === 'function') {
            showAlert('Settings reset to defaults!');
        } else {
            alert('Settings reset to defaults!');
        }
    };
    
    if (typeof showConfirm === 'function') {
        showConfirm(confirmMsg, doReset);
    } else {
        if (confirm(confirmMsg)) doReset();
    }
}

// Toggle Firebase fields visibility
function toggleFirebaseFields() {
    const useCustom = document.getElementById('setting-use-custom-firebase').checked;
    const fields = document.getElementById('firebase-custom-fields');
    fields.style.display = useCustom ? 'block' : 'none';
}

// Export all settings
function exportSettings() {
    const settings = loadSettings();
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `game_scorer_settings_${new Date().toISOString().slice(0,10)}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
}

// Import settings
function triggerSettingsImport() {
    document.getElementById('settings-import-file').click();
}

function importSettings(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const settings = JSON.parse(content);
            
            const doImport = () => {
                saveSettings({ ...DEFAULT_SETTINGS, ...settings });
                showSettings(); // Reload form
                if (typeof showAlert === 'function') {
                    showAlert("Settings imported successfully!");
                } else {
                    alert("Settings imported successfully!");
                }
            };
            
            const confirmMsg = "This will overwrite your current settings. Continue?";
            if (typeof showConfirm === 'function') {
                showConfirm(confirmMsg, doImport);
            } else {
                if (confirm(confirmMsg)) doImport();
            }
        } catch (err) {
            const msg = "Error loading settings file: " + err.message;
            if (typeof showAlert === 'function') {
                showAlert(msg);
            } else {
                alert(msg);
            }
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// Initialize settings on app load
function initializeSettings() {
    const settings = loadSettings();
    applySettings(settings);
    
    if (settings.debugMode) {
        console.log('⚙️ Settings initialized');
    }
}

// Play sound effect
function playSound(type) {
    const settings = loadSettings();
    if (!settings.soundEffects) return;
    
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'click') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.05);
    } else if (type === 'submit') {
        oscillator.frequency.value = 1200;
        gainNode.gain.value = 0.15;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } else if (type === 'error') {
        oscillator.frequency.value = 400;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    }
}

// Vibrate device
function vibrateDevice(pattern = [50]) {
    const settings = loadSettings();
    if (!settings.vibration) return;
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}