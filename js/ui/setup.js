/**
 * Setup Screen
 * Initial game configuration UI
 * Updated with player count buttons, team/randomize toggles, and host self-assignment
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
    let count = parseInt(document.getElementById('player-count').value) || 4;
    const conf = GAMES[key];
    
    if(conf.maxPlayers && count > conf.maxPlayers) {
        count = conf.maxPlayers;
        document.getElementById('player-count').value = count;
    }
    
    // Enforce minimum 3 players for card games
    const cardGames = ['shanghai', 'oldhell', 'spades', 'hearts'];
    if (cardGames.includes(key) && count < 3) {
        count = 3;
        document.getElementById('player-count').value = count;
    }
    
    // Update player count buttons
    updatePlayerCountButtons();
    
    // Disable 2-player button for card games
    const btn2 = document.getElementById('pc-2');
    if (btn2) {
        if (cardGames.includes(key)) {
            btn2.disabled = true;
            btn2.style.opacity = '0.3';
            btn2.style.cursor = 'not-allowed';
        } else {
            btn2.disabled = false;
            btn2.style.opacity = '1';
            btn2.style.cursor = 'pointer';
        }
    }
    
    const teamDiv = document.getElementById('team-option');
    const teamBtn = document.getElementById('use-teams');
    const randomDiv = document.getElementById('random-option');
    const targetDiv = document.getElementById('target-option');
    
    // New combined rows
    const shanghaiRow = document.getElementById('shanghai-options-row');
    const teamTargetRow = document.getElementById('team-target-row');
    
    // Hide all options first
    teamDiv.style.display = 'none';
    randomDiv.style.display = 'none';
    targetDiv.style.display = 'none';
    shanghaiRow.style.display = 'none';
    teamTargetRow.style.display = 'none';
    
    // Shanghai: Show teams + randomize on same row
    if (key === 'shanghai') {
        shanghaiRow.style.display = 'flex';
        const teamBtnShanghai = document.getElementById('use-teams-shanghai');
        
        if (count % 2 !== 0) {
            teamBtnShanghai.disabled = true;
            teamBtnShanghai.classList.remove('active');
            teamBtnShanghai.innerText = "⚠️ Need Even #";
            teamBtnShanghai.style.opacity = '0.5';
        } else {
            teamBtnShanghai.disabled = false;
            teamBtnShanghai.style.opacity = '1';
            if (teamBtn.classList.contains('active')) {
                teamBtnShanghai.classList.add('active');
                teamBtnShanghai.innerText = "✓ Teams Enabled";
            } else {
                teamBtnShanghai.classList.remove('active');
                teamBtnShanghai.innerText = "Play in Teams?";
            }
        }
        
        const randomBtnShanghai = document.getElementById('randomize-goals-shanghai');
        const randomBtn = document.getElementById('randomize-goals');
        if (randomBtn.classList.contains('active')) {
            randomBtnShanghai.classList.add('active');
        } else {
            randomBtnShanghai.classList.remove('active');
        }
    }
    // Spades or Hearts: Show teams + target score on same row
    else if (key === 'spades' || key === 'hearts') {
        teamTargetRow.style.display = 'flex';
        const teamBtnRow = document.getElementById('use-teams-row');
        const targetInput = document.getElementById('target-score-row');
        
        targetInput.value = conf.target;
        document.getElementById('target-score').value = conf.target;
        
        if (count % 2 !== 0) {
            teamBtnRow.disabled = true;
            teamBtnRow.classList.remove('active');
            teamBtnRow.innerText = "⚠️ Need Even #";
            teamBtnRow.style.opacity = '0.5';
        } else {
            teamBtnRow.disabled = false;
            teamBtnRow.style.opacity = '1';
            if (teamBtn.classList.contains('active')) {
                teamBtnRow.classList.add('active');
                teamBtnRow.innerText = "✓ Teams Enabled";
            } else {
                teamBtnRow.classList.remove('active');
                teamBtnRow.innerText = "Play in Teams?";
            }
        }
    }
    // Other games: Use individual options
    else {
        if (conf.hasTeams) {
            teamDiv.style.display = 'block';
            if (count % 2 !== 0) {
                teamBtn.disabled = true;
                teamBtn.classList.remove('active');
                teamBtn.innerText = "⚠️ Teams Unavailable (Need Even #)";
                teamBtn.style.opacity = '0.5';
            } else {
                teamBtn.disabled = false;
                teamBtn.style.opacity = '1';
                updateTeamButtonText();
            }
        }
        
        if (conf.hasRandomize) {
            randomDiv.style.display = 'block';
        }
        
        if (conf.type === 'target_score') {
            targetDiv.style.display = 'block';
            document.getElementById('target-score').value = conf.target;
        }
    }
}

function setPlayerCount(num) {
    const key = document.getElementById('game-select').value;
    const cardGames = ['shanghai', 'oldhell', 'spades', 'hearts'];
    
    // Prevent setting 2 players for card games
    if (cardGames.includes(key) && num === 2) {
        return;
    }
    
    // Haptic feedback
    if (typeof vibrateDevice === 'function') vibrateDevice([20]);
    
    document.getElementById('player-count').value = num;
    updatePlayerCountButtons();
    updateSetupUI();
}

function updatePlayerCountButtons() {
    const count = parseInt(document.getElementById('player-count').value) || 4;
    for(let i = 2; i <= 8; i++) {
        const btn = document.getElementById(`pc-${i}`);
        if(btn) {
            if(i === count) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    }
}

function toggleTeams() {
    const btn = document.getElementById('use-teams');
    const btnShanghai = document.getElementById('use-teams-shanghai');
    const btnRow = document.getElementById('use-teams-row');
    
    // Check which button was actually clicked
    const activeBtn = event && event.target ? event.target : btn;
    
    if (activeBtn.disabled) return;
    
    // Haptic feedback
    if (typeof vibrateDevice === 'function') vibrateDevice([25]);
    
    // Toggle the active state
    const willBeActive = !btn.classList.contains('active');
    
    // Sync all buttons
    if (willBeActive) {
        btn.classList.add('active');
        btnShanghai.classList.add('active');
        btnRow.classList.add('active');
    } else {
        btn.classList.remove('active');
        btnShanghai.classList.remove('active');
        btnRow.classList.remove('active');
    }
    
    updateTeamButtonText();
}

function updateTeamButtonText() {
    const btn = document.getElementById('use-teams');
    const btnShanghai = document.getElementById('use-teams-shanghai');
    const btnRow = document.getElementById('use-teams-row');
    
    if(btn.classList.contains('active')) {
        btn.innerText = "✓ Playing in Teams";
        if (btnShanghai) btnShanghai.innerText = "✓ Teams Enabled";
        if (btnRow) btnRow.innerText = "✓ Teams Enabled";
    } else {
        btn.innerText = "Play in Teams?";
        if (btnShanghai) btnShanghai.innerText = "Play in Teams?";
        if (btnRow) btnRow.innerText = "Play in Teams?";
    }
}

function toggleRandomize() {
    const btn = document.getElementById('randomize-goals');
    const btnShanghai = document.getElementById('randomize-goals-shanghai');
    
    // Haptic feedback
    if (typeof vibrateDevice === 'function') vibrateDevice([25]);
    
    // Toggle both buttons
    btn.classList.toggle('active');
    btnShanghai.classList.toggle('active');
    
    if(btn.classList.contains('active')) {
        btn.innerText = "✓ Goals Randomized";
        btnShanghai.innerText = "✓ Randomized";
    } else {
        btn.innerText = "🔀 Randomize Goals?";
        btnShanghai.innerText = "🔀 Randomize Goals?";
    }
}

function isTeamsActive() {
    return document.getElementById('use-teams').classList.contains('active');
}

function isRandomizeActive() {
    return document.getElementById('randomize-goals').classList.contains('active');
}

function showJoinPrompt() {
    // Clean up any existing listeners before showing join modal
    if (claimUnsub) {
        console.log('🧹 Cleaning up claim listener before showing join prompt');
        claimUnsub();
        claimUnsub = null;
    }
    if (lobbyUnsubscribe) {
        console.log('🧹 Cleaning up lobby listener before showing join prompt');
        lobbyUnsubscribe();
        lobbyUnsubscribe = null;
    }
    
    // Reset the join modal to initial state
    const modalBox = document.querySelector('#join-modal .modal-box');
    if (modalBox) {
        modalBox.innerHTML = `
            <h3 style="margin-top:0">Join Game</h3>
            <input type="text" id="game-code-input" placeholder="Enter 6-digit code" 
                   maxlength="6" style="text-align:center; font-size:24px; letter-spacing:5px; text-transform:uppercase;">
            <div class="modal-btn-row" style="margin-top:20px">
                <button class="modal-btn cancel" onclick="closeJoinModal()">Cancel</button>
                <button class="modal-btn confirm" onclick="attemptJoinGame()">Join</button>
            </div>
        `;
    }
    
    document.getElementById('join-modal').style.display = 'flex';
    
    // Focus on input after modal is shown
    setTimeout(() => {
        const input = document.getElementById('game-code-input');
        if (input) input.focus();
    }, 100);
}

function closeJoinModal() {
    document.getElementById('join-modal').style.display = 'none';
}

// Global variables for lobby management
let lobbyUnsubscribe = null;
let claimUnsub = null;
let hostPlayerIndex = null; // Track which slot the host claimed

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
 * Show identity selection screen (for regular viewers)
 */
function showIdentitySelection(players) {
    console.log('👤 showIdentitySelection() called with', players.length, 'players');
    
    // Clean up old claim listener first
    if (claimUnsub) {
        console.log('🧹 Cleaning up old claim listener');
        claimUnsub();
        claimUnsub = null;
    }
    
    const modalBox = document.querySelector('#join-modal .modal-box');
    
    if (!modalBox) {
        console.error('❌ Modal box not found!');
        return;
    }
    
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Who are you?</h3>
        <p style="color:#666; font-size:0.9em; margin-bottom:15px;">Select your name to join the game.</p>
        <div id="player-select-list" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:300px; overflow-y:auto; margin-bottom:15px;">
            <!-- Buttons generated below -->
        </div>
        <button class="modal-btn cancel" onclick="cancelIdentitySelection()">Cancel</button>
    `;
    
    const list = document.getElementById('player-select-list');
    
    if (!list) {
        console.error('❌ Player select list not found!');
        return;
    }
    
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
 * Show identity selection for HOST (inline in name screen)
 */
function showHostIdentitySelection() {
    // Prevent multiple selection screens
    if (document.getElementById('host-claim-ui')) {
        console.log('Host claim UI already showing');
        return;
    }
    
    console.log('🎯 Host wants to claim a player slot');
    
    const count = parseInt(document.getElementById('player-count').value);
    const useTeams = isTeamsActive();
    const players = [];
    
    // Build players array same way as startGame()
    for(let i = 1; i <= count; i++) {
        let name;
        if(useTeams) {
            let teamNum = Math.ceil(i / 2);
            let suffix = (i % 2 !== 0) ? 'a' : 'b';
            name = getNameVal(`${teamNum}-${suffix}`);
        } else {
            name = getNameVal(i);
        }
        players.push(name);
    }
    
    // Store players in a temporary variable for later reference
    window.tempHostPlayers = players;
    
    // Create inline selection UI
    const container = document.getElementById('name-inputs');
    const hostSelectDiv = document.createElement('div');
    hostSelectDiv.id = 'host-claim-ui';
    hostSelectDiv.style.cssText = 'background:#e8f4fd; padding:15px; border-radius:10px; margin-top:20px; border:2px solid #3498db;';
    
    let html = `
        <h3 style="margin-top:0; color:#2c3e50; font-size:1.1em;">🎮 Claim Your Spot</h3>
        <p style="color:#666; font-size:0.9em; margin-bottom:15px;">Which player are you?</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
    `;
    
    players.forEach((name, i) => {
        html += `<button class="btn-outline" style="margin:0;" onclick="hostClaimSlot(${i})">${name}</button>`;
    });
    
    html += `</div><button class="btn-outline" style="background:#f9f9f9; border-color:#999; color:#666; margin-top:0;" onclick="cancelHostClaim()">Cancel</button>`;
    
    hostSelectDiv.innerHTML = html;
    container.appendChild(hostSelectDiv);
}

/**
 * Host claims a player slot
 */
async function hostClaimSlot(idx) {
    console.log('🎯 Host claiming slot:', idx);
    
    if (!window.FirebaseAPI || !state.gameCode) {
        showAlert('Error: Game not initialized');
        return;
    }
    
    const success = await window.FirebaseAPI.claimPlayerSlot(idx);
    
    if (success) {
        hostPlayerIndex = idx;
        console.log('✅ Host successfully claimed slot:', idx);
        
        // Hide the "I'm Playing Too" button
        const claimContainer = document.getElementById('host-claim-container');
        if(claimContainer) claimContainer.style.display = 'none';
        
        // Get the actual player name from our temporary array
        const playerName = window.tempHostPlayers && window.tempHostPlayers[idx] 
            ? window.tempHostPlayers[idx] 
            : `Player ${idx+1}`;
        
        // Update UI to show host is claimed
        const claimUI = document.getElementById('host-claim-ui');
        if(claimUI) {
            claimUI.innerHTML = `
                <h3 style="margin-top:0; color:#27ae60; font-size:1.1em;">✓ You're Playing!</h3>
                <p style="color:#2c3e50; font-weight:bold;">You are: ${playerName}</p>
                <button class="btn-outline" style="background:#fff; border-color:#c0392b; color:#c0392b; margin-top:10px;" onclick="releaseHostClaim()">Release Spot</button>
            `;
        }
    } else {
        showAlert('That spot was just taken by a viewer!');
    }
}

/**
 * Host releases their claimed slot
 */
function releaseHostClaim() {
    if (!window.FirebaseAPI || !state.gameCode || hostPlayerIndex === null) return;
    
    // Release the claim in Firebase
    window.FirebaseAPI.releasePlayerClaim(hostPlayerIndex);
    hostPlayerIndex = null;
    
    // Remove the claim UI
    const claimUI = document.getElementById('host-claim-ui');
    if(claimUI) claimUI.remove();
    
    // Re-show the "I'm Playing Too" button
    const claimContainer = document.getElementById('host-claim-container');
    if(claimContainer) claimContainer.style.display = 'block';
}

/**
 * Cancel host claim UI
 */
function cancelHostClaim() {
    const claimUI = document.getElementById('host-claim-ui');
    if(claimUI) claimUI.remove();
    
    // Re-enable the "I'm Playing Too" button
    const claimContainer = document.getElementById('host-claim-container');
    if(claimContainer) claimContainer.style.display = 'block';
}

/**
 * Select identity and claim slot (for regular viewers)
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
    document.getElementById('host-claim-container').style.display = 'block';
    
    showNames();
}

function cancelMultiplayer() {
    if ((state.isHost || state.isViewer) && window.FirebaseAPI) {
        window.FirebaseAPI.cleanupFirebase();
    }
    
    // Clean up any claim listeners
    if (claimUnsub) {
        claimUnsub();
        claimUnsub = null;
    }
    if (lobbyUnsubscribe) {
        lobbyUnsubscribe();
        lobbyUnsubscribe = null;
    }
    
    hostPlayerIndex = null;
    document.getElementById('game-code-display').style.display = 'none';
    document.getElementById('name-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function abortGame() {
    const isViewerInGame = state.isViewer;
    
    showConfirm("Exit game? No stats will be saved.", () => {
        // Clean up listeners
        if (claimUnsub) {
            claimUnsub();
            claimUnsub = null;
        }
        if (lobbyUnsubscribe) {
            lobbyUnsubscribe();
            lobbyUnsubscribe = null;
        }
        
        // For viewers, only release their claim, don't cleanup everything
        if (isViewerInGame && state.viewingAsPlayerIdx !== null && window.FirebaseAPI) {
            console.log('🧹 Viewer exiting - releasing claim but staying registered');
            window.FirebaseAPI.releasePlayerClaim(state.viewingAsPlayerIdx);
            state.viewingAsPlayerIdx = null;
        } else if (state.isHost && window.FirebaseAPI) {
            // Host exits - cleanup everything
            console.log('🧹 Host exiting - cleaning up entire game');
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
    const wasViewer = state.isViewer;
    const gameCode = state.gameCode;
    
    state.currentGame = null;
    
    // If viewer, keep their connection alive
    if (!wasViewer) {
        state.isHost = false;
        state.isViewer = false;
        state.gameCode = null;
    }
    
    hostPlayerIndex = null;
    
    // Clean up listeners
    if (claimUnsub) {
        claimUnsub();
        claimUnsub = null;
    }
    if (lobbyUnsubscribe) {
        lobbyUnsubscribe();
        lobbyUnsubscribe = null;
    }
    
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
    resetTheme();
    checkRestore();
    
    // For viewers, show a message that they can rejoin
    if (wasViewer && gameCode) {
        console.log('💡 Viewer can rejoin with code:', gameCode);
    }
}