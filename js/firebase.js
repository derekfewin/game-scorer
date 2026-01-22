/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: LOBBY FIX v9");

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, remove, onDisconnect, runTransaction } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

function generateGameCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function hostGame(gameCode) {
    state.gameCode = gameCode;
    state.isHost = true;
    state.isViewer = false;
    state.firebaseRef = ref(database, 'games/' + gameCode);
    
    // Listen for claims to see count of joined people
    // We only care about the count here. Names are handled by the game logic once started.
    const claimsRef = ref(database, 'games/' + gameCode + '/claims');
    onValue(claimsRef, (snapshot) => {
        const claims = snapshot.val() || {};
        updateHostUIWithConnectedPlayers(claims);
    });
    
    // Also listen for raw viewers count (for lobby before claims)
    const viewersRef = ref(database, 'games/' + gameCode + '/viewers');
    onValue(viewersRef, (snapshot) => {
        const viewers = snapshot.val() || {};
        const count = Object.keys(viewers).length;
        // If we have claims, use that count, otherwise use raw viewer count
        if (!state.connectedViewers || Object.keys(state.connectedViewers).length === 0) {
             const setupCountEl = document.getElementById('viewer-count');
             if (setupCountEl) setupCountEl.innerText = count;
        }
    });
}

function updateHostUIWithConnectedPlayers(claims) {
    // Store claims in state so we can access them during render (for badges)
    state.connectedViewers = claims;
    
    const count = Object.keys(claims).length;
    state.viewerCount = count;
    
    // Update count in game header (active game)
    const headerCountEl = document.getElementById('header-viewer-count');
    if (headerCountEl) {
        headerCountEl.innerText = count;
    }

    // Update count on setup screen (lobby) - Fallback is handled by viewers listener above
    const setupCountEl = document.getElementById('viewer-count');
    if (setupCountEl && count > 0) {
        setupCountEl.innerText = count;
    }
    
    // If game is active, trigger re-render to update "Live" badges
    if (state.currentGame && typeof renderGame === 'function') {
        renderGame();
    }
}

/**
 * Get list of connected viewer indices
 */
function getConnectedViewerIndices() {
    if (!state.connectedViewers) return [];
    return Object.keys(state.connectedViewers).map(Number);
}

/**
 * Check if a specific player index has a viewer connected
 */
function isPlayerConnected(playerIdx) {
    return state.connectedViewers && state.connectedViewers[playerIdx] !== undefined;
}

// Helper to find name from index (Used internally if needed, or by game.js)
function resolveNameFromIndex(idx) {
    if (state.currentGame && state.currentGame.players && state.currentGame.players[idx]) {
        return state.currentGame.players[idx].name;
    }
    return `Player ${idx+1}`;
}

/**
 * Join an existing game as a viewer
 * Resolves with player list if started, or 'LOBBY' if waiting.
 */
async function joinGame(gameCode) {
    return new Promise((resolve, reject) => {
        const gameRef = ref(database, 'games/' + gameCode);
        
        get(gameRef).then((snapshot) => {
            if (!snapshot.exists()) {
                reject(new Error('Game not found'));
                return;
            }
            
            const data = snapshot.val();
            
            // Register as viewer IMMEDIATELY so host sees count
            const viewerId = 'viewer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            state.viewerId = viewerId;
            state.gameCode = gameCode;
            state.isHost = false;
            state.isViewer = true;
            state.firebaseRef = gameRef;
            
            const viewerRef = ref(database, 'games/' + gameCode + '/viewers/' + viewerId);
            set(viewerRef, { joined: Date.now() });
            onDisconnect(viewerRef).remove();
            
            // Check if game has started (players array exists)
            if (data.gameState && data.gameState.classData && Array.isArray(data.gameState.classData.players)) {
                resolve(data.gameState.classData.players); // Game started
            } else {
                resolve('LOBBY'); // Valid game, but waiting for host
            }
        }).catch(reject);
    });
}

/**
 * Attempt to claim a player slot
 */
async function claimPlayerSlot(playerIdx) {
    if (!state.gameCode || !state.viewerId) return false;
    
    const claimRef = ref(database, `games/${state.gameCode}/claims/${playerIdx}`);
    
    const result = await runTransaction(claimRef, (currentClaim) => {
        if (currentClaim === null) {
            return state.viewerId; // Claim it
        } else {
            return; // Abort if taken
        }
    });

    if (result.committed) {
        state.viewingAsPlayerIdx = playerIdx;
        onDisconnect(claimRef).remove();
        listenToGameUpdates(state.gameCode);
        return true;
    } else {
        return false;
    }
}

/**
 * Listen for changes to claimed slots (used by joining viewers to see taken spots)
 */
function listenToClaims(callback) {
    const claimsRef = ref(database, `games/${state.gameCode}/claims`);
    return onValue(claimsRef, (snapshot) => {
        const claims = snapshot.val() || {};
        callback(claims);
    });
}

function syncToFirebase() {
    if (!state.isHost || !state.firebaseRef || !state.currentGame) return;
    
    const rawData = {
        gameKey: state.gameKey,
        classData: {
            players: state.currentGame.players,
            history: state.currentGame.history || [],
            round: state.currentGame.round || 0,
            dealCount: state.currentGame.dealCount || 0,
            isGameOver: state.currentGame.isGameOver || false,
            randomMap: state.currentGame.randomMap || null,
            phase: state.currentGame.phase || null,
            handSize: state.currentGame.handSize || null,
            currentTrump: state.currentGame.currentTrump || null,
            manualStarter: state.currentGame.manualStarter || null,
            settings: state.currentGame.settings || {}
        }
    };

    let dataToSync;
    try {
        dataToSync = JSON.parse(JSON.stringify(rawData, (k, v) => (v === undefined ? null : v)));
    } catch (e) {
        console.error("Error sanitizing:", e);
        return;
    }
    
    set(ref(database, 'games/' + state.gameCode + '/gameState'), dataToSync);
}

function listenToGameUpdates(gameCode) {
    const gameStateRef = ref(database, 'games/' + gameCode + '/gameState');
    
    onValue(gameStateRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // If we are still in the setup/lobby screen, this might trigger the game start transition
        if (!state.currentGame && data.classData && data.classData.players) {
             // Game just started! We should transition UI if we are in waiting mode.
             // We can fire a custom event or check this in the setup UI polling.
             // For now, we restore state.
        }
        
        restoreGameFromFirebase(data);
        if (typeof renderGame === 'function') renderGame();
    });
}

function restoreGameFromFirebase(parsed) {
    state.gameKey = parsed.gameKey;
    const conf = GAMES[state.gameKey];
    const cd = parsed.classData;
    const savedSettings = cd.settings || {};
    
    const GameClass = getGameClass(state.gameKey);
    state.currentGame = new GameClass(conf, cd.players, savedSettings);
    Object.assign(state.currentGame, cd);
    
    document.body.className = `game-${state.gameKey}`;
    document.documentElement.style.setProperty('--primary', conf.color);
}

function cleanupFirebase() {
    if (!state.firebaseRef) return;
    
    if (state.isHost) {
        remove(state.firebaseRef);
    } else if (state.viewingAsPlayerIdx !== null) {
        remove(ref(database, `games/${state.gameCode}/claims/${state.viewingAsPlayerIdx}`));
    }
    
    if (state.viewerId && state.gameCode) {
        remove(ref(database, `games/${state.gameCode}/viewers/${state.viewerId}`));
    }

    state.firebaseRef = null;
    state.gameCode = null;
    state.isHost = false;
    state.isViewer = false;
    state.viewingAsPlayerIdx = null;
    state.viewerId = null;
    state.connectedViewers = null;
}

window.FirebaseAPI = {
    generateGameCode,
    hostGame,
    joinGame,
    claimPlayerSlot,
    listenToClaims,
    listenToGameUpdates,
    syncToFirebase,
    cleanupFirebase,
    isPlayerConnected
};