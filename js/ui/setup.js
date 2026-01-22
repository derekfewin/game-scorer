/**
 * Setup Screen
 * Initial game configuration UI
 * DEBUG VERSION with extensive logging
 */

function initApp() {
    resetTheme();
    
    const sel = document.getElementById('game-select');
    for (let key in GAMES) {
        let opt = document.createElement('option');
        opt.value = key;
        opt.innerText = GAMES[key].name;
        sel.appendChild(opt);
    }
    
    checkRestore();
    updateSetupUI();
}

function updateSetupUI() {
    const key = document.getElementById('game-select').value;
    let count = parseInt(document.getElementById('player-count').value) || 0;
    const conf = GAMES[key];
    
    if(conf.maxPlayers && count > conf.maxPlayers) {
        count = conf.maxPlayers;
        document.getElementById('player-count').value = count;
    }
    
    const teamDiv = document.getElementById('team-option');
    const teamLabel = teamDiv.querySelector('label');
    const teamCheck = document.getElementById('use-teams');

    if (conf.hasTeams) {
        teamDiv.style.display = 'block';
        if (count % 2 !== 0) {
            teamCheck.disabled = true;
            teamCheck.checked = false;
            teamLabel.style.color = '#bbb';
            teamLabel.childNodes[1].textContent = " Teams Unavailable (Need Even #)";
        } else {
            teamCheck.disabled = false;
            teamLabel.style.color = 'var(--primary)';
            teamLabel.childNodes[1].textContent = " Play in Teams?";
        }
    } else {
        teamDiv.style.display = 'none';
        teamCheck.checked = false;
    }

    document.getElementById('random-option').style.display = 
        conf.hasRandomize ? 'block' : 'none';
    
    const targetDiv = document.getElementById('target-option');
    if (conf.type === 'target_score' || key === 'hearts') {
        targetDiv.style.display = 'block';
        document.getElementById('target-score').value = conf.target;
    } else {
        targetDiv.style.display = 'none';
    }
}

function showJoinPrompt() {
    document.getElementById('join-modal').style.display = 'flex';
    document.getElementById('game-code-input').value = '';
    document.getElementById('game-code-input').focus();
}

function closeJoinModal() {
    document.getElementById('join-modal').style.display = 'none';
}

// Global variables for lobby management
let lobbyUnsubscribe = null;
let claimUnsub = null;

/**
 * JOIN FLOW with DEBUG logging
 */
async function attemptJoinGame() {
    console.log('🔍 attemptJoinGame() called');
    
    const code = document.getElementById('game-code-input').value.toUpperCase().trim();
    console.log('🔍 Code entered:', code);
    
    if (code.length !== 6) {
        console.log('❌ Code validation failed');
        showAlert('Please enter a 6-digit code');
        return;
    }
    
    if (!window.FirebaseAPI) {
        console.log('❌ FirebaseAPI not loaded');
        showAlert('Firebase is still loading. Please wait.');
        return;
    }
    
    console.log('✅ FirebaseAPI available:', Object.keys(window.FirebaseAPI));
    
    const joinBtn = document.querySelector('#join-modal .confirm');
    const originalText = joinBtn.innerText;
    joinBtn.innerText = "Connecting...";
    joinBtn.disabled = true;
    
    console.log('🔄 Calling FirebaseAPI.joinGame...');
    
    try {
        const result = await window.FirebaseAPI.joinGame(code);
        console.log('✅ joinGame() resolved with:', result);
        
        if (result === 'LOBBY') {
            console.log('⏳ Result is LOBBY - showing waiting screen');
            showLobbyWaiting();
            
            console.log('👂 Setting up listenForGameStart...');
            lobbyUnsubscribe = window.FirebaseAPI.listenForGameStart(code, (players) => {
                console.log('🎮 GAME STARTED CALLBACK! Players:', players);
                if (lobbyUnsubscribe) {
                    console.log('🧹 Cleaning up lobby listener');
                    lobbyUnsubscribe();
                }
                showIdentitySelection(players);
            });
            console.log('✅ Lobby listener set up, unsubscribe function:', typeof lobbyUnsubscribe);
        } else if (Array.isArray(result)) {
            console.log('🎮 Game already started with', result.length, 'players');
            showIdentitySelection(result);
        } else {
            console.log('⚠️ Unexpected result type:', typeof result, result);
            throw new Error('Unexpected join result');
        }
        
    } catch (error) {
        console.error('❌ JOIN ERROR:', error);
        console.error('Error stack:', error.stack);
        showAlert('Game not found. Check the code and try again.');
        joinBtn.innerText = originalText;
        joinBtn.disabled = false;
    }
}

/**
 * Show lobby waiting screen
 */
function showLobbyWaiting() {
    console.log('🏠 showLobbyWaiting() called');
    
    const modalBox = document.querySelector('#join-modal .modal-box');
    if (!modalBox) {
        console.error('❌ Modal box not found!');
        return;
    }
    
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Connected!</h3>
        <div style="text-align:center; padding:30px 20px;">
            <div id="lobby-spinner" style="font-size:60px; margin-bottom:15px;">⏳</div>
            <p style="color:#2c3e50; font-weight:bold; font-size:1.1em; margin-bottom:10px;">
                Waiting for host to start the game...
            </p>
            <p style="color:#666; font-size:0.9em; line-height:1.5;">
                You'll be able to select your player name once the host clicks "Start Game"
            </p>
        </div>
        <button class="modal-btn cancel" onclick="cancelLobbyWait()">Cancel</button>
    `;
    
    // Add pulsing animation with CSS
    const style = document.createElement('style');
    style.id = 'lobby-pulse-style';
    style.innerHTML = `
        @keyframes lobbyPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.7; }
        }
        #lobby-spinner {
            animation: lobbyPulse 1.5s ease-in-out infinite;
        }
    `;
    
    // Remove old style if exists
    const oldStyle = document.getElementById('lobby-pulse-style');
    if (oldStyle) oldStyle.remove();
    
    document.head.appendChild(style);
    
    console.log('✅ Lobby waiting screen rendered');
}

/**
 * Cancel lobby wait
 */
function cancelLobbyWait() {
    console.log('🛑 cancelLobbyWait() called');
    
    if (lobbyUnsubscribe) {
        console.log('🧹 Unsubscribing from lobby listener');
        lobbyUnsubscribe();
        lobbyUnsubscribe = null;
    }
    
    console.log('🧹 Cleaning up Firebase');
    window.FirebaseAPI.cleanupFirebase();
    
    // Reset modal
    const modalBox = document.querySelector('#join-modal .modal-box');
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Join Game</h3>
        <input type="text" id="game-code-input" placeholder="Enter 6-digit code" 
               maxlength="6" style="text-align:center; font-size:24px; letter-spacing:5px; text-transform:uppercase;">
        <div class="modal-btn-row" style="margin-top:20px">
            <button class="modal-btn cancel" onclick="closeJoinModal()">Cancel</button>
            <button class="modal-btn confirm" onclick="attemptJoinGame()">Join</button>
        </div>
    `;
    closeJoinModal();
}

/**
 * Show identity selection screen
 */
function showIdentitySelection(players) {
    console.log('👤 showIdentitySelection() called with', players.length, 'players');
    
    const modalBox = document.querySelector('#join-modal .modal-box');
    
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Who are you?</h3>
        <p style="color:#666; font-size:0.9em; margin-bottom:15px;">Select your name to join the game.</p>
        <div id="player-select-list" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:300px; overflow-y:auto; margin-bottom:15px;">
            <!-- Buttons generated below -->
        </div>
        <button class="modal-btn cancel" onclick="cancelIdentitySelection()">Cancel</button>
    `;
    
    const list = document.getElementById('player-select-list');
    
    players.forEach((p, i) => {
        console.log(`  Creating button for player ${i}:`, p.name);
        
        let btn = document.createElement('button');
        btn.className = 'btn-outline';
        btn.style.width = '100%';
        btn.style.textAlign = 'center';
        btn.style.padding = '15px 10px';
        btn.style.margin = '0';
        btn.style.fontSize = '1.1em';
        btn.innerText = p.name;
        btn.id = `claim-btn-${i}`;
        
        btn.onclick = () => selectIdentity(i, p.name);
        
        list.appendChild(btn);
    });
    
    console.log('👂 Setting up claim listener...');
    claimUnsub = window.FirebaseAPI.listenToClaims((claims) => {
        console.log('📢 Claims updated:', claims);
        players.forEach((p, i) => {
            const btn = document.getElementById(`claim-btn-${i}`);
            if(btn) {
                if (claims[i]) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.textDecoration = 'line-through';
                    btn.innerText = p.name + " (Taken)";
                    btn.style.borderColor = '#ccc';
                    btn.style.background = '#f9f9f9';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.textDecoration = 'none';
                    btn.innerText = p.name;
                    btn.style.borderColor = '#2980b9';
                    btn.style.background = 'white';
                }
            }
        });
    });
}

/**
 * Select identity and claim slot
 */
async function selectIdentity(idx, name) {
    console.log(`🎯 Attempting to claim slot ${idx} (${name})`);
    
    const btn = document.getElementById(`claim-btn-${idx}`);
    const originalText = btn.innerText;
    btn.innerText = "Joining...";
    btn.disabled = true;
    
    const success = await window.FirebaseAPI.claimPlayerSlot(idx);
    console.log('Claim result:', success ? '✅ Success' : '❌ Failed');
    
    if (success) {
        if(claimUnsub) {
            console.log('🧹 Cleaning up claim listener');
            claimUnsub();
        }
        closeJoinModal();
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        if (typeof renderGame === 'function') {
            console.log('🎨 Rendering game...');
            renderGame();
        }
    } else {
        showAlert("Sorry, that spot was just taken!");
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

/**
 * Cancel identity selection
 */
function cancelIdentitySelection() {
    console.log('🛑 cancelIdentitySelection() called');
    
    if(claimUnsub) {
        console.log('🧹 Cleaning up claim listener');
        claimUnsub();
    }
    
    console.log('🧹 Cleaning up Firebase');
    window.FirebaseAPI.cleanupFirebase();
    
    const modalBox = document.querySelector('#join-modal .modal-box');
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Join Game</h3>
        <input type="text" id="game-code-input" placeholder="Enter 6-digit code" 
               maxlength="6" style="text-align:center; font-size:24px; letter-spacing:5px; text-transform:uppercase;">
        <div class="modal-btn-row" style="margin-top:20px">
            <button class="modal-btn cancel" onclick="closeJoinModal()">Cancel</button>
            <button class="modal-btn confirm" onclick="attemptJoinGame()">Join</button>
        </div>
    `;
    closeJoinModal();
}

function showNamesAsHost() {
    if (!window.FirebaseAPI) {
        showAlert('Firebase is still loading. Please wait.');
        return;
    }
    const code = window.FirebaseAPI.generateGameCode();
    window.FirebaseAPI.hostGame(code);
    
    document.getElementById('game-code-text').innerText = code;
    document.getElementById('game-code-display').style.display = 'block';
    
    showNames();
}

function cancelMultiplayer() {
    if ((state.isHost || state.isViewer) && window.FirebaseAPI) {
        window.FirebaseAPI.cleanupFirebase();
    }
    
    document.getElementById('game-code-display').style.display = 'none';
    document.getElementById('name-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function abortGame() {
    showConfirm("Exit game? No stats will be saved.", () => {
        if ((state.isHost || state.isViewer) && window.FirebaseAPI) {
            window.FirebaseAPI.cleanupFirebase();
        }
        localStorage.removeItem('cardScorerSave');
        softResetApp();
    });
}

function finishGameNow() {
    showConfirm("Finish game and save to leaderboard?", () => {
        if(state.currentGame) state.currentGame.isGameOver = true;
        finalizeGame();
    });
}

function softResetApp() {
    state.currentGame = null;
    state.isHost = false;
    state.isViewer = false;
    state.gameCode = null;
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
    resetTheme();
    checkRestore();
}