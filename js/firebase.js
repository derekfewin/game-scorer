/**
 * Firebase Integration
 * Handles real-time multiplayer sync
 */

console.log("🔥 FIREBASE MODULE LOADED: HOST CLAIM UPDATE v18");

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
    console.log(`⚡ hostGame called for code: ${gameCode}`);
    
    state.gameCode = gameCode;
    state.isHost = true;
    state.isViewer = false;
    state.firebaseRef = ref(database, 'games/' + gameCode);
    
    console.log('⚡ Attempting to create game node at:', 'games/' + gameCode);
    
    set(state.firebaseRef, {
        created: Date.now(),
        status: 'lobby',
        viewers: { 'host_placeholder': true }
    }).then(() => {
        console.log('✅ Game Lobby Initialized in Firebase!');
        
        // Show host claim button
        const claimContainer = document.getElementById('host-claim-container');
        if(claimContainer) claimContainer.style.display = 'block';
    }).catch((err) => {
        console.error('❌ LOBBY CREATION FAILED:', err);
    });
    
    // Listen for claims
    const claimsRef = ref(database, 'games/' + gameCode + '/claims');
    onValue(claimsRef, (snapshot) => {
        const claims = snapshot.val() || {};
        updateHostUIWithConnectedPlayers(claims);
    });
    
    // Listen for raw viewers (lobby phase)
    const viewersRef = ref(database, 'games/' + gameCode + '/viewers');
    onValue(viewersRef, (snapshot) => {
        const viewers = snapshot.val() || {};
        const keys = Object.keys(viewers).filter(k => k !== 'host_placeholder');
        const count = keys.length;
        
        console.log(`👀 Viewer count updated: ${count}`);
        
        if (!state.connectedViewers || Object.keys(state.connectedViewers).length === 0) {
            const setupCountEl = document.getElementById('viewer-count');
            if (setupCountEl) setupCountEl.innerText = count;
        }
    });
}

function updateHostUIWithConnectedPlayers(claims) {
    state.connectedViewers = claims;
    const count = Object.keys(claims).length;
    state.viewerCount = count;
    
    const headerCountEl = document.getElementById('header-viewer-count');
    if (headerCountEl) headerCountEl.innerText = count;

    const setupCountEl = document.getElementById('viewer-count');
    if (setupCountEl && count > 0) setupCountEl.innerText = count;
    
    if (state.currentGame && typeof renderGame === 'function') {
        renderGame();
    }
}

function getConnectedViewerIndices() {
    if (!state.connectedViewers) return [];
    return Object.keys(state.connectedViewers).map(Number);
}

function isPlayerConnected(playerIdx) {
    return state.connectedViewers && state.connectedViewers[playerIdx] !== undefined;
}

async function joinGame(gameCode) {
    return new Promise((resolve, reject) => {
        const gameRef = ref(database, 'games/' + gameCode);
        
        get(gameRef).then((snapshot) => {
            if (!snapshot.exists()) {
                console.warn(`Game ${gameCode} does not exist.`);
                reject(new Error('Game not found'));
                return;
            }
            
            const data = snapshot.val();
            
            const viewerId = 'viewer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
            state.viewerId = viewerId;
            state.gameCode = gameCode;
            state.isHost = false;
            state.isViewer = true;
            state.firebaseRef = gameRef;
            
            const viewerRef = ref(database, 'games/' + gameCode + '/viewers/' + viewerId);
            set(viewerRef, { joined: Date.now() });
            onDisconnect(viewerRef).remove();
            
            console.log('✅ Viewer registered:', viewerId);
            
            if (data.gameState && data.gameState.classData && Array.isArray(data.gameState.classData.players)) {
                console.log('🎮 Game already started');
                resolve(data.gameState.classData.players);
            } else {
                console.log('⏳ Game exists but not started -> LOBBY');
                resolve('LOBBY');
            }
        }).catch(reject);
    });
}

function listenForGameStart(gameCode, onGameStart) {
    const gameStateRef = ref(database, 'games/' + gameCode + '/gameState');
    
    const unsubscribe = onValue(gameStateRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data && data.classData && Array.isArray(data.classData.players)) {
            console.log('🎮 Game started! Players detected:', data.classData.players.length);
            onGameStart(data.classData.players);
        }
    });
    
    return unsubscribe;
}

async function claimPlayerSlot(playerIdx) {
    if (!state.gameCode) return false;
    
    // For host, use a special ID that persists
    const claimId = state.isHost ? 'host_claim' : state.viewerId;
    
    if (!claimId) {
        console.error('No claim ID available');
        return false;
    }
    
    const claimRef = ref(database, `games/${state.gameCode}/claims/${playerIdx}`);
    
    const result = await runTransaction(claimRef, (currentClaim) => {
        if (currentClaim === null) {
            return claimId;
        } else if (currentClaim === claimId) {
            // Already claimed by us, allow it
            return claimId;
        } else {
            // Claimed by someone else
            return;
        }
    });

    if (result.committed) {
        state.viewingAsPlayerIdx = playerIdx;
        
        // Only set onDisconnect for non-host claims (host stays in game)
        if (!state.isHost) {
            onDisconnect(claimRef).remove();
        }
        
        listenToGameUpdates(state.gameCode);
        return true;
    } else {
        return false;
    }
}

function releasePlayerClaim(playerIdx) {
    if (!state.gameCode) return;
    
    const claimRef = ref(database, `games/${state.gameCode}/claims/${playerIdx}`);
    remove(claimRef);
    
    if (state.viewingAsPlayerIdx === playerIdx) {
        state.viewingAsPlayerIdx = null;
    }
}

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
    
    console.log('🧹 cleanupFirebase called');
    
    if (state.isHost) {
        console.log('🧹 Removing entire game (host)');
        remove(state.firebaseRef);
    } else if (state.viewingAsPlayerIdx !== null) {
        console.log('🧹 Removing viewer claim for player', state.viewingAsPlayerIdx);
        remove(ref(database, `games/${state.gameCode}/claims/${state.viewingAsPlayerIdx}`));
    }
    
    if (state.viewerId && state.gameCode) {
        console.log('🧹 Removing viewer registration');
        remove(ref(database, `games/${state.gameCode}/viewers/${state.viewerId}`));
    }

    state.firebaseRef = null;
    state.gameCode = null;
    state.isHost = false;
    state.isViewer = false;
    state.viewingAsPlayerIdx = null;
    state.viewerId = null;
    state.connectedViewers = null;
    
    console.log('✅ Firebase cleanup complete');
}

function resolveNameFromIndex(idx) {
    if (state.currentGame && state.currentGame.players && state.currentGame.players[idx]) {
        return state.currentGame.players[idx].name;
    }
    const inputs = document.querySelectorAll('.name-selector');
    if(inputs.length > idx) {
        let val = inputs[idx].value;
        if(val === 'CUSTOM') {
             let customId = inputs[idx].id.replace('n-', 'c-');
             let customInput = document.getElementById(customId);
             if(customInput) return customInput.value;
        }
        return val;
    }
    return `Player ${idx+1}`;
}

window.FirebaseAPI = {
    generateGameCode,
    hostGame,
    joinGame,
    listenForGameStart,
    claimPlayerSlot,
    releasePlayerClaim,
    listenToClaims,
    listenToGameUpdates,
    syncToFirebase,
    cleanupFirebase,
    isPlayerConnected
};