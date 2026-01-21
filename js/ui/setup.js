/**
 * Setup Screen
 * Initial game configuration UI
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
    
    // Enforce max players
    if(conf.maxPlayers && count > conf.maxPlayers) {
        count = conf.maxPlayers;
        document.getElementById('player-count').value = count;
    }
    
    // Team option
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

    // Randomize option
    document.getElementById('random-option').style.display = 
        conf.hasRandomize ? 'block' : 'none';
    
    // Target score option
    const targetDiv = document.getElementById('target-option');
    if (conf.type === 'target_score' || key === 'hearts') {
        targetDiv.style.display = 'block';
        document.getElementById('target-score').value = conf.target;
    } else {
        targetDiv.style.display = 'none';
    }
}

// Multiplayer functions
function showJoinPrompt() {
    document.getElementById('join-modal').style.display = 'flex';
    document.getElementById('game-code-input').value = '';
    document.getElementById('game-code-input').focus();
}

function closeJoinModal() {
    document.getElementById('join-modal').style.display = 'none';
}

/**
 * JOIN FLOW UPDATE:
 * 1. Verify code
 * 2. Connect to firebase
 * 3. Fetch players list
 * 4. Show "Who Are You?" selection
 */
async function attemptJoinGame() {
    const code = document.getElementById('game-code-input').value.toUpperCase().trim();
    
    if (code.length !== 6) {
        showAlert('Please enter a 6-digit code');
        return;
    }
    
    if (!window.FirebaseAPI) {
        showAlert('Firebase is still loading. Please wait.');
        return;
    }
    
    const joinBtn = document.querySelector('#join-modal .confirm');
    joinBtn.innerText = "Connecting...";
    joinBtn.disabled = true;
    
    try {
        // Step 1: Connect and get players list
        const players = await window.FirebaseAPI.joinGame(code);
        
        if (!players || players.length === 0) {
            console.error("No players found. Game State:", state);
            showAlert("Game found, but no players are listed yet. Has the host started the game?");
            joinBtn.innerText = "Join";
            joinBtn.disabled = false;
            return;
        }

        // Step 2: Show Identity Selection
        showIdentitySelection(players);
        
    } catch (error) {
        console.error('Join error:', error);
        showAlert('Game not found. Check the code.');
        joinBtn.innerText = "Join";
        joinBtn.disabled = false;
    }
}

// Global variable to hold unsubscribe function
let claimUnsub = null;

function showIdentitySelection(players) {
    const modalBox = document.querySelector('#join-modal .modal-box');
    
    // Rebuild Modal Content
    modalBox.innerHTML = `
        <h3 style="margin-top:0">Who are you?</h3>
        <p style="color:#666; font-size:0.9em; margin-bottom:15px;">Select your name to join.</p>
        <div id="player-select-list" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; max-height:300px; overflow-y:auto; margin-bottom:15px;">
            <!-- Buttons go here -->
        </div>
        <button class="modal-btn cancel" onclick="cancelIdentitySelection()">Cancel</button>
    `;
    
    const list = document.getElementById('player-select-list');
    
    // Generate Buttons
    players.forEach((p, i) => {
        let btn = document.createElement('button');
        btn.className = 'btn-outline';
        btn.style.width = '100%';
        btn.style.textAlign = 'left';
        btn.style.padding = '10px';
        btn.style.margin = '0';
        btn.innerText = p.name;
        btn.id = `claim-btn-${i}`;
        
        btn.onclick = () => selectIdentity(i, p.name);
        
        list.appendChild(btn);
    });
    
    // Listen for taken spots in real-time
    claimUnsub = window.FirebaseAPI.listenToClaims((claims) => {
        players.forEach((p, i) => {
            const btn = document.getElementById(`claim-btn-${i}`);
            if(btn) {
                if (claims[i]) {
                    // Spot is taken
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.textDecoration = 'line-through';
                    btn.innerText = p.name + " (Taken)";
                    btn.style.borderColor = '#ccc';
                    btn.style.background = '#f9f9f9';
                } else {
                    // Spot is free
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

async function selectIdentity(idx, name) {
    const btn = document.getElementById(`claim-btn-${idx}`);
    const originalText = btn.innerText;
    btn.innerText = "Joining...";
    
    const success = await window.FirebaseAPI.claimPlayerSlot(idx);
    
    if (success) {
        // Success! Enter game.
        if(claimUnsub) claimUnsub(); // Stop listening to claims
        closeJoinModal();
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
    } else {
        showAlert("Sorry, that spot was just taken!");
        btn.innerText = originalText;
    }
}

function cancelIdentitySelection() {
    if(claimUnsub) claimUnsub();
    window.FirebaseAPI.cleanupFirebase();
    
    // Reset modal to original state
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