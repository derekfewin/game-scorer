/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: CLEAN FLOW v7");

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
        const count = Object.keys(claims).length;
        
        state.viewerCount = count;
        state.connectedViewers = claims; // Store for "LIVE" badges
        
        // Update setup screen count
        const viewerCountEl = document.getElementById('viewer-count');
        if (viewerCountEl) viewerCountEl.innerText = count;
        
        // Update game header count
        const headerCountEl = document.getElementById('header-viewer-count');
        if (headerCountEl) headerCountEl.innerText = count;
        
        // Refresh game view if active (to update LIVE badges)
        if (state.currentGame && typeof renderGame === 'function') {
            renderGame();
        }
    });
}

/**
 * Join an existing game as a viewer
 * Resolves with player list ONLY if game has started.
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
            
            // Check if players exist (meaning game started)
            let players = [];
            if (data.gameState && data.gameState.classData && Array.isArray(data.gameState.classData.players)) {
                players = data.gameState.classData.players;
            } else {
                // Game exists but hasn't started. 
                // In this flow, we reject/warn because we can't pick identity yet.
                console.warn("Game found but no players yet.");
            }

            // Register as viewer
            const viewerId = 'viewer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            state.viewerId = viewerId;
            state.gameCode = gameCode;
            state.isHost = false;
            state.isViewer = true;
            state.firebaseRef = gameRef;
            
            // Add self to viewers list (for basic connectivity check)
            const viewerRef = ref(database, 'games/' + gameCode + '/viewers/' + viewerId);
            set(viewerRef, { joined: Date.now() });
            onDisconnect(viewerRef).remove();
            
            resolve(players);
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
    
    // Standard data sync
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

// Check if a specific player index has a viewer connected (for UI badges)
function isPlayerConnected(playerIdx) {
    return state.connectedViewers && state.connectedViewers[playerIdx] !== undefined;
}

window.FirebaseAPI = {
    generateGameCode,
    hostGame,
    joinGame,
    claimPlayerSlot,
    listenToClaims,
    syncToFirebase,
    cleanupFirebase,
    isPlayerConnected
};