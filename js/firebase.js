/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: FIXED NAME DISPLAY v4");

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
    // Claims is an object like: { "0": "viewer_123", "2": "viewer_456" }
    const claimedIndices = Object.keys(claims).map(Number);
    const count = claimedIndices.length;
    state.viewerCount = count;
    
    // Update count display in game header (if game started)
    const headerCountEl = document.getElementById('header-viewer-count');
    if (headerCountEl) headerCountEl.innerText = count;

    // Update list on Setup/Name Screen (if waiting)
    const viewerListEl = document.getElementById('viewer-list-display');
    if (viewerListEl) {
        if (count === 0) {
            viewerListEl.innerHTML = '<span style="color:#999; font-style:italic">Waiting for players...</span>';
        } else {
            let names = [];
            claimedIndices.forEach(idx => {
                let name = getPlayerNameFromIndex(idx);
                if (name) names.push(name);
            });
            
            if (names.length > 0) {
                viewerListEl.innerHTML = `<strong>Connected:</strong> ${names.join(', ')}`;
            } else {
                viewerListEl.innerHTML = `<strong>${count} viewer(s) connected</strong> (names loading...)`;
            }
        }
    }
}

/**
 * Get player name from index by checking available sources
 */
function getPlayerNameFromIndex(idx) {
    // Priority 1: If game is running, use game object
    if (state.currentGame && state.currentGame.players && state.currentGame.players[idx]) {
        return state.currentGame.players[idx].name;
    }
    
    // Priority 2: Check DOM inputs (name entry screen)
    // Detect if we're in team mode
    const teamLabels = document.querySelectorAll('.team-label');
    const isTeamMode = teamLabels.length > 0;
    
    if (isTeamMode) {
        // Team mode: idx 0 = Team 1-a, idx 1 = Team 1-b, idx 2 = Team 2-a, etc.
        let teamNum = Math.floor(idx / 2) + 1;
        let suffix = (idx % 2 === 0) ? 'a' : 'b';
        let selectId = `n-${teamNum}-${suffix}`;
        let customId = `c-${teamNum}-${suffix}`;
        
        let select = document.getElementById(selectId);
        if (select) {
            if (select.value === 'CUSTOM') {
                let customInput = document.getElementById(customId);
                if (customInput && customInput.value) return customInput.value;
            } else if (select.value) {
                return select.value;
            }
        }
    } else {
        // Solo mode: idx 0 = n-1, idx 1 = n-2, etc.
        let selectId = `n-${idx + 1}`;
        let customId = `c-${idx + 1}`;
        
        let select = document.getElementById(selectId);
        if (select) {
            if (select.value === 'CUSTOM') {
                let customInput = document.getElementById(customId);
                if (customInput && customInput.value) return customInput.value;
            } else if (select.value) {
                return select.value;
            }
        }
    }
    
    // Fallback
    return `Player ${idx + 1}`;
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
            return; // Abort - already taken
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