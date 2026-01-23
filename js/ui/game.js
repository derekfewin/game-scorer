/**
 * Game Screen
 * Main gameplay UI and input handling
 */

function renderGame() {
    if (!state.currentGame) return;
    
    const game = state.currentGame;
    const conf = GAMES[state.gameKey];
    
    document.getElementById('error-msg').style.display = 'none';
    
    let isGameOver = game.isGameOver;
    let roundLabel = `${conf.name}: Round ${game.round}`;
    let vCount = state.viewerCount || 0;
    
    // HEADER LOGIC
    let headerPrefix = "";
    
    if (state.isHost) {
        // Host sees Code and Count
        headerPrefix = `🎮 HOST: ${state.gameCode} (<span id="header-viewer-count">${vCount}</span> 👤)`;
    } else if (state.isViewer) {
        // Viewer sees their own identity
        let myName = "Spectator";
        if (state.viewingAsPlayerIdx !== null && game.players[state.viewingAsPlayerIdx]) {
            myName = game.players[state.viewingAsPlayerIdx].name;
        }
        headerPrefix = `👤 ${myName}`;
    }
    
    if (headerPrefix) {
        roundLabel = `${headerPrefix} • ${roundLabel}`;
    }
    
    // Old Hell Special Header
    if (state.gameKey === 'oldhell') {
        const baseLabel = `Old Hell: ${game.handSize} Cards (${game.phase === 'bid' ? 'Bidding' : 'Scoring'})`;
        roundLabel = headerPrefix ? `${headerPrefix} • ${baseLabel}` : baseLabel;
    }
    
    let hero = game.getHeroContent();
    
    // Game Over State
    if (isGameOver) {
        document.getElementById('input-area').innerHTML = '';
        document.getElementById('action-btn').style.display = 'none';
        document.getElementById('game-over-banner').style.display = 'block';
        
        let winnerText = "";

        if (game.settings.useTeams) {
            let teamCount = game.players.length / 2;
            let teamScores = [];
            
            for(let t = 0; t < teamCount; t++) {
                let p1 = game.players[t * 2];
                let p2 = game.players[t * 2 + 1];
                let s = (state.gameKey === 'spades') ? p1.total : (p1.total + p2.total);
                teamScores.push({ name: `Team ${t+1} (${p1.name} & ${p2.name})`, score: s });
            }
            
            let best = (conf.type === 'low_score') 
                ? Math.min(...teamScores.map(t => t.score)) 
                : Math.max(...teamScores.map(t => t.score));
            let winners = teamScores.filter(t => t.score === best).map(t => t.name);
            winnerText = "Winner: " + winners.join(', ');
        } else {
            const totals = game.players.map(p => p.total);
            let best = (conf.type === 'low_score') ? Math.min(...totals) : Math.max(...totals);
            let winners = game.players.filter(p => p.total === best).map(p => p.name);
            winnerText = "Winner: " + winners.join(', ');
        }
        
        document.getElementById('winner-display').innerText = winnerText;
        
        if (state.isViewer) {
            document.getElementById('undo-btn').style.display = 'none';
            document.getElementById('exit-controls').style.display = 'none';
        } else {
            document.getElementById('undo-btn').style.display = 'block';
            document.getElementById('exit-controls').style.display = 'flex';
            document.getElementById('abort-btn').style.display = 'none';
            document.getElementById('finish-btn').innerText = "Finalize & Save";
        }

        renderTable();
        return;
    }

    // Active Game State
    document.getElementById('game-over-banner').style.display = 'none';
    document.getElementById('action-btn').style.display = 'block';
    
    // Hide controls for viewers
    if (state.isViewer) {
        document.getElementById('action-btn').style.display = 'none';
        document.getElementById('undo-btn').style.display = 'none';
        document.getElementById('exit-controls').style.display = 'none';
    } else {
        document.getElementById('exit-controls').style.display = 'flex';
        document.getElementById('abort-btn').style.display = 'block';
        document.getElementById('finish-btn').innerText = "Finish & Save";
    }
    
    document.getElementById('round-label').innerHTML = roundLabel;
    document.getElementById('hero-content').innerHTML = hero;
    
    const area = document.getElementById('input-area');
    area.innerHTML = '';
    
    // Old Hell trump selector
    if (state.gameKey === 'oldhell' && game.phase === 'bid') {
        area.innerHTML = renderTrumpSelector();
    }

    // Render player inputs
    if (game.settings.useTeams) {
        let teamCount = game.players.length / 2;
        for(let t = 0; t < teamCount; t++) {
            let teamBox = document.createElement('div');
            teamBox.className = 'team-block';
            
            let headerHtml = `<div class="team-block-header">Team ${t+1}</div>`;
            if (state.gameKey === 'shanghai' && game.randomMap) {
                let p1Idx = t * 2;
                let goalTxt = game.randomMap[p1Idx][game.round - 1];
                
                // For viewers, show the goal directly if it's their team
                if (state.isViewer) {
                    let isMyTeam = (state.viewingAsPlayerIdx === p1Idx || state.viewingAsPlayerIdx === (p1Idx + 1));
                    if (isMyTeam) {
                        headerHtml += `<div class="team-goal-display">${goalTxt}</div>`;
                    } else {
                        headerHtml += `<div class="team-goal-display" style="color:#999;">Hidden</div>`;
                    }
                } else if (!state.isViewer) {
                    // Host or solo game uses peek button
                    headerHtml += `<button class="btn-peek" 
                        onmousedown="startPeek(this, '${goalTxt}')" 
                        onmouseup="endPeek(this)" 
                        ontouchstart="startPeek(this, '${goalTxt}')" 
                        ontouchend="endPeek(this)"
                        data-orig="👁️ Peek Team Goal">👁️ Peek Team Goal</button>`;
                }
            }
            teamBox.innerHTML = headerHtml;
            
            let p1Idx = t * 2;
            teamBox.appendChild(createPlayerRow(game.players[p1Idx], p1Idx));
            
            let p2Idx = t * 2 + 1;
            teamBox.appendChild(createPlayerRow(game.players[p2Idx], p2Idx));
            
            area.appendChild(teamBox);
        }
    } else {
        game.players.forEach((p, i) => {
            area.appendChild(createPlayerRow(p, i));
        });
    }
    
    document.getElementById('action-btn').innerText = 
        (game.phase === 'bid') ? "Lock Bids" : "Submit Scores";
    
    let hasHistory = game.history.length;
    document.getElementById('undo-btn').style.display = (hasHistory && !state.isViewer) ? 'block' : 'none';
    
    renderTable();
}

function createPlayerRow(p, i) {
    const game = state.currentGame;
    const conf = GAMES[state.gameKey];
    let dealerIdx = game.getDealerIdx();
    
    let row = document.createElement('div');
    row.className = 'input-row';
    
    let starBtn = "";
    if (conf.hasStars) {
        let active = (game.currentStars && game.currentStars[i]) ? "active" : "";
        starBtn = `<span class="star-toggle ${active}" onclick="toggleStar(${i})">★</span>`;
    }

    let info = `<div class="input-left-col">
        ${starBtn}
        <div class="input-text-group">
            <div>
                <span class="p-name">${p.name}`;
    
    if (conf.hasDealer && i === dealerIdx) {
        let label = "DEALER";
        if(state.gameKey === 'mexicantrain') label = "STARTER";
        info += `<span class="dealer-badge">${label}</span>`;
    }
    
    // ADD VIEWER INDICATOR (Host only)
    if (state.isHost && window.FirebaseAPI && window.FirebaseAPI.isPlayerConnected(i)) {
        info += `<span class="dealer-badge" style="background:#2980b9; margin-left:4px;">👁️ LIVE</span>`;
    }

    info += `</span></div>`;

    let sub = "";
    if (state.gameKey === 'shanghai' && game.randomMap && !game.settings.useTeams) {
        let goalTxt = game.randomMap[i][game.round-1];
        
        // Viewers see their own goal directly, everyone else uses peek
        if (state.isViewer && state.viewingAsPlayerIdx === i) {
            sub = `<span class="p-sub" style="color:#2980b9; font-weight:bold;">
                    Goal: ${goalTxt}
                  </span>`;
        } else if (state.isViewer) {
            // Other players' goals are hidden for viewers
            sub = `<span class="p-sub" style="color:#999;">
                    Goal: Hidden
                  </span>`;
        } else if (state.isHost) {
            // Host uses peek button
            sub = `<button class="btn-peek" 
                    onmousedown="startPeek(this, '${goalTxt}')" 
                    onmouseup="endPeek(this)" 
                    ontouchstart="startPeek(this, '${goalTxt}')" 
                    ontouchend="endPeek(this)"
                    data-orig="👁️ Hold to Peek">👁️ Hold to Peek</button>`;
        } else {
            // Solo game - show directly
            sub = `<span class="p-sub" style="color:#2980b9; font-weight:bold;">
                    Goal: ${goalTxt}
                  </span>`;
        }
    } else if (state.gameKey === 'spades' && game.phase === 'score') {
        let bidTxt = (p.isBlindNil) ? "Blind Nil" : (p.bid === 0 ? "Nil" : p.bid);
        let bagsTxt = (p.bags > 0) ? ` (Bags: ${p.bags})` : "";
        sub = `<span class="p-sub">Bid: ${bidTxt}${bagsTxt}</span>`;
    }
    
    if(sub) info += sub;
    info += `</div>`;
    
    if (conf.hasStarter) {
        let val = 13 - game.round;
        if(val < 0) val = 0;
        
        let manualStarter = game.manualStarter;
        let active = (manualStarter === i) ? 'active' : '';
        let svg = getDominoSvg(val, 15) + getDominoSvg(val, 15);
        info += `<div class="starter-btn ${active}" onclick="setStarter(${i})">${svg}</div>`;
    }

    info += `</div>`;
    
    let inputHtml = "";
    let tempInput = game.tempInput;

    if (state.gameKey === 'oldhell' && game.phase === 'score') {
        let isChecked = (tempInput && tempInput[i] === 'true');
        let btnClass = isChecked ? 'made' : 'failed';
        let btnText = isChecked ? 'Made It' : 'Missed';
        
        inputHtml = `<div style="display:flex; align-items:center;">
            <span class="oh-bid-disp">Bid: ${p.bid}</span>
            <button class="oh-toggle-btn ${btnClass}" onclick="toggleOhScore(${i})">${btnText}</button>
        </div>`;
    } else {
        let savedVal = (tempInput && tempInput[i] !== undefined) ? tempInput[i] : '';
        let readonlyAttr = state.isViewer ? 'readonly disabled style="background:#f0f0f0; color:#999;"' : '';
        inputHtml = `<input type="number" inputmode="numeric" pattern="[0-9]*" class="p-input" data-idx="${i}" 
            ${readonlyAttr} value="${savedVal}" placeholder="${game.phase === 'bid' ? 'Bid' : '0'}" onfocus="this.select()" oninput="clearError()">`;
    }
        
    let helpers = "";
    if (state.gameKey === 'qwirkle') {
        helpers = renderHelpers(i);
    }
    
    if (state.gameKey === 'spades' && game.phase === 'bid') {
        let isBN = game.tempBlindNil[i];
        let cls = isBN ? 'active' : '';
        helpers = `<button class="spades-bn-btn ${cls}" onclick="toggleBlindNil(${i})">Blind Nil</button>`;
    }
    
    if (state.gameKey === 'hearts') {
        helpers = `<button class="qw-btn qw-moon" onclick="applyMoon(${i})">🌙</button>`;
    }

    row.innerHTML = info + `<div class="input-container">${helpers}${inputHtml}</div>`;
    return row;
}

function renderHelpers(pIdx) {
    const conf = GAMES[state.gameKey];
    if (!conf.helpers) return '';
    
    let html = `<div class="qw-btn-group">`;
    conf.helpers.forEach(h => {
        let cls = 'qw-btn';
        if(h.id === 'q') cls += ' qw-q';
        if(h.id === 'qq') cls += ' qw-qq';
        if(h.id === 'end') cls += ' qw-end';
        
        let modSource = state.currentGame ? state.currentGame.modifiers : [];
        if (modSource && modSource[pIdx] && modSource[pIdx].includes(h.id)) {
            cls += ' active';
        }
        
        html += `<button class="${cls}" onclick="toggleHelper(${pIdx}, '${h.id}')">
            ${h.label}<span>${h.text || h.label}</span>
        </button>`;
    });
    html += `</div>`;
    return html;
}

function renderTrumpSelector() {
    let suits = ['S','H','C','D'];
    let html = `<div class="oh-trump-row">`;
    suits.forEach(s => {
        let currentT = state.currentGame.currentTrump;
        let cls = (currentT === s) ? 'selected' : '';
        let color = (s==='H'||s==='D') ? 'red' : 'black';
        html += `<button class="oh-trump-btn ${cls}" onclick="setTrump('${s}')" style="color:${color}">${getSuitIcon(s)}</button>`;
    });
    html += `</div>`;
    return html;
}

function startPeek(btn, txt) {
    if(!btn.getAttribute('data-orig')) btn.setAttribute('data-orig', btn.innerText);
    btn.innerText = txt;
    btn.style.background = '#fff';
    btn.style.color = '#2c3e50';
    btn.style.borderColor = '#2c3e50';
}

function endPeek(btn) {
    btn.innerText = btn.getAttribute('data-orig');
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
}

// Input handlers
function captureInputs() {
    const inputs = document.querySelectorAll('.p-input');
    if (state.currentGame) {
        state.currentGame.tempInput = [];
        inputs.forEach((inp, i) => {
            state.currentGame.tempInput[i] = inp.value;
        });
    }
}

function submitRound() {
    const inputs = document.querySelectorAll('.p-input');
    const err = document.getElementById('error-msg');
    
    if (!state.currentGame) return;

    let rawValues = [];
    
    if (state.gameKey === 'oldhell' && state.currentGame.phase === 'score') {
        for(let i = 0; i < state.currentGame.players.length; i++) {
            let val = (state.currentGame.tempInput && state.currentGame.tempInput[i]) 
                ? state.currentGame.tempInput[i] 
                : 'false';
            rawValues.push(val);
        }
    } else {
        inputs.forEach(inp => rawValues.push(inp.value));
    }
    
    let result = state.currentGame.submitRound(rawValues, state.currentGame.modifiers);
    
    if (!result.valid) {
        err.innerText = result.msg;
        err.style.display = 'block';
    } else {
        saveState();
        renderGame();
    }
}

function undoRound() {
    if (state.currentGame) {
        showConfirm("Undo last step?", () => {
            state.currentGame.undo();
            saveState();
            renderGame();
        });
    }
}

function toggleStar(idx) {
    if(state.gameKey !== 'oldhell') captureInputs();
    if (state.currentGame) {
        state.currentGame.currentStars[idx] = !state.currentGame.currentStars[idx];
    }
    renderGame();
}

function toggleHelper(pIdx, modId) {
    captureInputs();
    
    let modSource = state.currentGame.modifiers;
    if (!modSource[pIdx]) modSource[pIdx] = [];
    let list = modSource[pIdx];
    
    if (list.includes(modId)) {
        list = list.filter(m => m !== modId);
    } else {
        const def = GAMES[state.gameKey].helpers.find(h => h.id === modId);
        
        if (modId === 'q' && list.includes('qq')) list = list.filter(m => m !== 'qq');
        if (modId === 'qq' && list.includes('q')) list = list.filter(m => m !== 'q');
        
        list.push(modId);
    }
    state.currentGame.modifiers[pIdx] = list;
    renderGame();
}

function setStarter(idx) {
    captureInputs();
    if(state.currentGame && state.currentGame.setStarter) {
        state.currentGame.setStarter(idx);
    }
    renderGame();
}

function setTrump(t) {
    captureInputs();
    if (state.currentGame) {
        state.currentGame.setTrump(t);
    }
    renderGame();
}

function toggleOhScore(idx) {
    if(!state.currentGame) return;
    if(!state.currentGame.tempInput) state.currentGame.tempInput = [];
    let current = state.currentGame.tempInput[idx] === 'true';
    state.currentGame.tempInput[idx] = (!current).toString();
    renderGame();
}

function toggleBlindNil(idx) {
    let inputEl = document.querySelector(`.p-input[data-idx="${idx}"]`);
    if(inputEl && inputEl.value !== "" && inputEl.value !== "0") {
        showAlert("Blind Nil requires a bid of 0.");
        return;
    }
    if(inputEl) inputEl.value = "0";
    
    if (state.currentGame && state.currentGame.toggleBlindNil) {
        state.currentGame.toggleBlindNil(idx);
    }
    renderGame();
}

function applyMoon(idx) {
    let inputs = document.querySelectorAll('.p-input');
    inputs.forEach((inp, i) => {
        if (i === idx) inp.value = "0";
        else inp.value = "26";
    });
    captureInputs();
}