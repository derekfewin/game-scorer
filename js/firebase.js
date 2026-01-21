/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

// DEBUG LOG: helps confirm if the browser has the latest update
console.log("🔥 FIREBASE MODULE LOADED: SANITIZED VERSION + VIEWER COUNT");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIJLFgLAmY3xmjWuAn0k6agkPqpwaerfY",
    authDomain: "game-scorer-69dfe.firebaseapp.com",
    databaseURL: "https://game-scorer-69dfe-default-rtdb.firebaseio.com",
    projectId: "game-scorer-69dfe",
    storageBucket: "game-scorer-69dfe.firebasestorage.app",
    messagingSenderId: "732132954950",
    appId: "1:732132954950:web:cf3d6ef15975d71ec8cb47",
    measurementId: "G-LTP3GP2S2N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

/**
 * Generate a random 6-character game code
 */
function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Host a new multiplayer game
 */
function hostGame(gameCode) {
    state.gameCode = gameCode;
    state.isHost = true;
    state.isViewer = false;
    state.firebaseRef = ref(database, 'games/' + gameCode);
    
    // Listen for viewer count
    const viewersRef = ref(database, 'games/' + gameCode + '/viewers');
    onValue(viewersRef, (snapshot) => {
        const viewers = snapshot.val() || {};
        const count = Object.keys(viewers).length;
        
        // Store in global state so game.js can use it during renders
        state.viewerCount = count;
        
        // Update Setup Screen element (if visible)
        const countEl = document.getElementById('viewer-count');
        if (countEl) countEl.innerText = count;
        
        // Update Game Screen element (live update in header)
        const headerCountEl = document.getElementById('header-viewer-count');
        if (headerCountEl) headerCountEl.innerText = count;
    });
}

/**
 * Join an existing game as a viewer
 */
async function joinGame(gameCode) {
    return new Promise((resolve, reject) => {
        state.gameCode = gameCode;
        state.isHost = false;
        state.isViewer = true;
        state.firebaseRef = ref(database, 'games/' + gameCode);
        
        // Check if game exists
        onValue(state.firebaseRef, (snapshot) => {
            if (!snapshot.exists()) {
                reject(new Error('Game not found'));
                return;
            }
            
            // Register as viewer
            const viewerId = 'viewer_' + Date.now();
            const viewerRef = ref(database, 'games/' + gameCode + '/viewers/' + viewerId);
            
            set(viewerRef, {
                joined: Date.now()
            });
            
            // Remove self on disconnect
            onDisconnect(viewerRef).remove();
            
            // Listen for game updates
            listenToGameUpdates(gameCode);
            
            resolve();
        }, { onlyOnce: true });
    });
}

/**
 * Sync current game state to Firebase (host only)
 */
function syncToFirebase() {
    if (!state.isHost || !state.firebaseRef || !state.currentGame) return;
    
    // Explicitly handle undefined values by defaulting to null
    // This object construction ensures we don't accidentally pass an undefined property
    const rawData = {
        gameKey: state.gameKey,
        classData: {
            players: state.currentGame.players,
            history: state.currentGame.history || [],
            round: state.currentGame.round || 0,
            dealCount: state.currentGame.dealCount || 0,
            isGameOver: state.currentGame.isGameOver || false,
            
            // CRITICAL FIX: The || null prevents "undefined" errors for games that don't use these fields
            randomMap: state.currentGame.randomMap || null,
            phase: state.currentGame.phase || null,
            handSize: state.currentGame.handSize || null,
            currentTrump: state.currentGame.currentTrump || null,
            manualStarter: state.currentGame.manualStarter || null,
            settings: state.currentGame.settings || {}
        }
    };

    // Double safety: deep clean the object to ensure valid JSON (converts any lingering undefined to null)
    let dataToSync;
    try {
        dataToSync = JSON.parse(JSON.stringify(rawData, (k, v) => (v === undefined ? null : v)));
    } catch (e) {
        console.error("Error sanitizing game data:", e);
        return;
    }
    
    const gameStateRef = ref(database, 'games/' + state.gameCode + '/gameState');
    set(gameStateRef, dataToSync).catch(err => {
        console.error("Firebase sync failed:", err);
    });
}

/**
 * Listen for game state updates (viewers only)
 */
function listenToGameUpdates(gameCode) {
    const gameStateRef = ref(database, 'games/' + gameCode + '/gameState');
    
    onValue(gameStateRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // Restore game from Firebase data
        restoreGameFromFirebase(data);
        
        // Re-render game screen
        if (typeof renderGame === 'function') {
            renderGame();
        }
    });
}

/**
 * Restore game state from Firebase data
 */
function restoreGameFromFirebase(parsed) {
    state.gameKey = parsed.gameKey;
    const conf = GAMES[state.gameKey];
    const cd = parsed.classData;
    const savedSettings = cd.settings || {};
    
    // Create appropriate game instance
    const GameClass = getGameClass(state.gameKey);
    state.currentGame = new GameClass(conf, cd.players, savedSettings);
    
    // Restore all properties
    Object.assign(state.currentGame, cd);
    
    // Setup UI theme
    document.body.className = `game-${state.gameKey}`;
    document.documentElement.style.setProperty('--primary', conf.color);
}

/**
 * Clean up Firebase connection
 */
function cleanupFirebase() {
    if (!state.firebaseRef) return;
    
    if (state.isHost) {
        // Host: delete entire game
        remove(state.firebaseRef);
    }
    
    state.firebaseRef = null;
    state.gameCode = null;
    state.isHost = false;
    state.isViewer = false;
}

// Make functions globally available
window.FirebaseAPI = {
    generateGameCode,
    hostGame,
    joinGame,
    syncToFirebase,
    cleanupFirebase
};
