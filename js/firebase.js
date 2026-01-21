/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: TEAM NAME SUPPORT");

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
        const claimedIndices = Object.keys(claims).map(Number);
        
        // Update the Host UI
        updateHostUIWithConnectedPlayers(claimedIndices);
    });
}

function updateHostUIWithConnectedPlayers(indices) {
    const count = indices.length;
    state.viewerCount = count;
    
    // Update count display in header (if game started)
    const headerCountEl = document.getElementById('header-viewer-count');
    if (headerCountEl) headerCountEl.innerText = count;

    // Update list on Setup Screen (if waiting)
    const viewerListEl = document.getElementById('viewer-list-display');
    if (viewerListEl) {
        if (count === 0) {
            viewerListEl.innerHTML = '<span style="color:#999; font-style:italic">Waiting for players...</span>';
        } else {
            let names = [];
            indices.forEach(idx => {
               let name = resolveNameFromIndex(idx);
               if(name) names.push(name);
            });
            viewerListEl.innerHTML = `<strong>Connected:</strong> ${names.join(', ')}`;
        }
    }
}

// Helper to find name from index
function resolveNameFromIndex(idx) {
    // 1. If game is running, use game object (Most reliable)
    if (state.currentGame && state.currentGame.players && state.currentGame.players[idx]) {
        return state.currentGame.players[idx].name;
    }
    
    // 2. If on setup screen, we must read from the DOM inputs.
    // Check for "team-label" to know if we are in Team Mode
    const isTeamMode = document.querySelector('.team-label') !== null;
    
    if (isTeamMode) {
        // Teams: ID format is n-{TeamNum}-{a/b}
        // idx 0 -> Team 1 Member A (n-1-a)
        // idx 1 -> Team 1 Member B (n-1-b)
        // idx 2 -> Team 2 Member A (n-2-a)
        let teamNum = Math.floor(idx / 2) + 1;
        let suffix = (idx % 2 === 0) ? 'a' : 'b';
        let inputId = `n-${teamNum}-${suffix}`;
        
        let input = document.getElementById(inputId);
        if (input) return input.value;
        
    } else {
        // Solo: ID is "n-1", "n-2" (where 1 is index+1)
        const inputId = `n-${idx + 1}`;
        const input = document.getElementById(inputId);
        if (input) return input.value;
    }
    
    // Fallback if inputs aren't found
    return `Player ${idx+1}`;
}

/**
 * Join an existing game as a viewer
 * Returns the players list to help with identity selection
 */
async function joinGame(gameCode) {
    return new Promise((resolve, reject) => {
        const gameRef = ref(database, 'games/' + gameCode);
        
        // Check if game exists
        get(gameRef).then((snapshot) => {
            if (!snapshot.exists()) {
                reject(new Error('Game not found'));
                return;
            }
            
            const data = snapshot.val();
            
            // Robustly find the players array
            let players = [];
            if (data.gameState && data.gameState.classData && Array.isArray(data.gameState.classData.players)) {
                players = data.gameState.classData.players;
            } else {
                console.warn("Player data missing or malformed:", data);
            }

            // Register as viewer (initially anonymous)
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
            return state.viewerId; // Claim it
        } else {
            return; // Abort
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
 * Listen for changes to claimed slots to update UI
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
        // Remove our claim if we leave
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
}

window.FirebaseAPI = {
    generateGameCode,
    hostGame,
    joinGame,
    claimPlayerSlot,
    listenToClaims,
    syncToFirebase,
    cleanupFirebase
};