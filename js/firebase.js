/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: FINAL NAME DISPLAY FIX v5");

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
    
    // Listen for claims to see WHO has joined
    const claimsRef = ref(database, 'games/' + gameCode + '/claims');
    onValue(claimsRef, (snapshot) => {
        const claims = snapshot.val() || {};
        updateHostUIWithConnectedPlayers(claims);
    });
}

function updateHostUIWithConnectedPlayers(claims) {
    // Store claims in state so we can access them during render
    state.connectedViewers = claims;
    
    const claimedIndices = Object.keys(claims).map(Number);
    const count = claimedIndices.length;
    state.viewerCount = count;
    
    console.log('📊 Connected viewers:', claims);
    console.log('📊 Player indices:', claimedIndices);
    
    // Update count in game header
    const headerCountEl = document.getElementById('header-viewer-count');
    if (headerCountEl) {
        headerCountEl.innerText = count;
    }

    // If on name entry screen (before game starts)
    const viewerListEl = document.getElementById('viewer-list-display');
    if (viewerListEl) {
        if (count === 0) {
            viewerListEl.innerHTML = '<span style="color:#999; font-style:italic">Waiting for players...</span>';
        } else {
            // Game hasn't started yet, can't show names
            viewerListEl.innerHTML = `<strong>${count} viewer(s) connected</strong><br><span style="font-size:0.85em; color:#666;">(Names will appear after you start the game)</span>`;
        }
    }
    
    // If game is active, trigger re-render to update player rows
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

/**
 * Join an existing game as a viewer
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
            
            // Get players list
            let players = [];
            if (data.gameState && data.gameState.classData && Array.isArray(data.gameState.classData.players)) {
                players = data.gameState.classData.players;
            } else {
                console.warn("Player data missing - game hasn't started yet");
            }

            // Register as viewer
            const viewerId = 'viewer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            state.viewerId = viewerId;
            state.gameCode = gameCode;
            state.isHost = false;
            state.isViewer = true;
            state.firebaseRef = gameRef;
            
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
            return state.viewerId;
        } else {
            return; // Already taken
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
 * Listen for changes to claimed slots
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
    syncToFirebase,
    cleanupFirebase,
    isPlayerConnected,
    getConnectedViewerIndices
};