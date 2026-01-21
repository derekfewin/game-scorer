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

async function attemptJoinGame() {
    const code = document.getElementById('game-code-input').value.toUpperCase().trim();
    
    if (code.length !== 6) {
        showAlert('Please enter a 6-digit code');
        return;
    }
    
    // Import Firebase functions dynamically
    const { joinGame } = await import('./firebase.js');
    
    try {
        await joinGame(code);
        
        closeJoinModal();
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        // Game will be rendered by Firebase listener
    } catch (error) {
        showAlert('Game not found. Check the code and try again.');
    }
}

function showNamesAsHost() {
    // Set up hosting mode then show names
    import('./firebase.js').then(module => {
        const code = module.generateGameCode();
        module.hostGame(code);
        
        // Show code display
        document.getElementById('game-code-text').innerText = code;
        document.getElementById('game-code-display').style.display = 'block';
        
        showNames();
    });
}

function cancelMultiplayer() {
    // Clean up Firebase if needed
    if (state.isHost || state.isViewer) {
        import('./firebase.js').then(module => {
            module.cleanupFirebase();
        });
    }
    
    document.getElementById('game-code-display').style.display = 'none';
    document.getElementById('name-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
}

function abortGame() {
    showConfirm("Exit game? No stats will be saved.", () => {
        // Clean up Firebase
        if (state.isHost || state.isViewer) {
            import('./firebase.js').then(module => {
                module.cleanupFirebase();
            });
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
