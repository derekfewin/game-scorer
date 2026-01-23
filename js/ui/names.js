/**
 * Name Entry Screen
 * Player/team name configuration with dealer order notes
 */

function showNames() {
    state.gameKey = document.getElementById('game-select').value;
    const count = parseInt(document.getElementById('player-count').value);
    const useTeams = isTeamsActive();
    const randomize = isRandomizeActive();
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('name-screen').style.display = 'block';
    
    // Hide host claim button for solo games (only show for multiplayer hosts)
    const claimContainer = document.getElementById('host-claim-container');
    if (claimContainer && !state.isHost) {
        claimContainer.style.display = 'none';
    }
    
    const container = document.getElementById('name-inputs');
    container.innerHTML = '';
    
    // Add dealer order info box
    const infoBox = document.createElement('div');
    infoBox.style.cssText = 'background:#fff3cd; padding:12px; border-radius:8px; margin-bottom:20px; border:1px solid #ffc107; text-align:center;';
    infoBox.innerHTML = `<span style="color:#856404; font-size:0.9em; font-weight:600;">ℹ️ Player order determines dealer rotation</span>`;
    container.appendChild(infoBox);
    
    // Add randomize info for Shanghai
    if (state.gameKey === 'shanghai' && randomize) {
        const randomBox = document.createElement('div');
        randomBox.style.cssText = 'background:#e8f4fd; padding:12px; border-radius:8px; margin-bottom:20px; border:1px solid #3498db; text-align:center;';
        randomBox.innerHTML = `<span style="color:#2c3e50; font-size:0.9em; font-weight:600;">🔀 Goals are randomized - viewers will see their own goals automatically</span>`;
        container.appendChild(randomBox);
    }
    
    const numUnits = useTeams ? count/2 : count;
    
    for(let i = 1; i <= numUnits; i++) {
        let html = `<div class="setup-group">`;
        if (useTeams) {
            html += `<span class="team-label">Team ${i}</span>`;
            
            // Player 1 of team
            html += `<label>Player 1${getDealerNote(i, true)}</label>${nameDropdown(i+'-a')}`;
            
            // Player 2 of team
            html += `<label style="margin-top:10px;">Player 2</label>${nameDropdown(i+'-b')}`;
        } else {
            html += `<label>Player ${i}${getDealerNote(i, false)}</label>${nameDropdown(i)}`;
        }
        html += `</div>`;
        container.innerHTML += html;
    }
    updateNameDropdowns();
}

function getDealerNote(position, isTeam) {
    const ordinals = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
    const ordinal = ordinals[position - 1] || `#${position}`;
    
    return `<span style="color:#2c3e50; font-size:0.8em; margin-left:10px; font-weight:normal;">
        🎴 ${ordinal} dealer
    </span>`;
}

function nameDropdown(id) {
    let opts = COMMON_NAMES.map(n => `<option value="${n}">${n}</option>`).join('');
    return `<select id="n-${id}" class="name-selector" onchange="handleNameChange(this, 'c-${id}')">
        <option value="">-- Select --</option>
        ${opts}
        <option value="CUSTOM">Type Name...</option>
    </select>
    <input type="text" id="c-${id}" class="custom-name-box" placeholder="Name">`;
}

function handleNameChange(sel, inputId) {
    const input = document.getElementById(inputId);
    input.style.display = (sel.value === 'CUSTOM') ? 'block' : 'none';
    if(sel.value === 'CUSTOM') input.focus();
    updateNameDropdowns();
}

function updateNameDropdowns() {
    const selects = document.querySelectorAll('.name-selector');
    const taken = Array.from(selects)
        .map(s => s.value)
        .filter(v => v !== "" && v !== "CUSTOM");
    
    selects.forEach(dropdown => {
        const myValue = dropdown.value;
        dropdown.querySelectorAll('option').forEach(opt => {
            if (opt.value === "" || opt.value === "CUSTOM") return;
            if (taken.includes(opt.value) && opt.value !== myValue) {
                opt.disabled = true;
                opt.innerText = opt.value + " (Taken)";
            } else {
                opt.disabled = false;
                opt.innerText = opt.value;
            }
        });
    });
}

function getNameVal(id) {
    let el = document.getElementById('n-' + id);
    if (!el) return `P${id}`;
    let v = el.value;
    return (v === 'CUSTOM' || v === '') 
        ? (document.getElementById('c-' + id).value || 'P' + id) 
        : v;
}

function startGame() {
    const conf = GAMES[state.gameKey];
    const count = parseInt(document.getElementById('player-count').value);
    const useTeams = isTeamsActive();
    const randomize = isRandomizeActive();
    const target = parseInt(document.getElementById('target-score').value) || conf.target || 0;
    
    let players = [];
    for(let i = 1; i <= count; i++) {
        let name;
        if(useTeams) {
            let teamNum = Math.ceil(i / 2);
            let suffix = (i % 2 !== 0) ? 'a' : 'b';
            name = getNameVal(`${teamNum}-${suffix}`);
        } else {
            name = getNameVal(i);
        }
        players.push({ 
            name: name, 
            total: 0, 
            bags: 0, 
            bid: 0, 
            isBlindNil: false 
        });
    }

    // Create game instance using factory
    const GameClass = getGameClass(state.gameKey);
    state.currentGame = new GameClass(conf, players, { 
        useTeams, 
        randomize, 
        targetScore: target 
    });
    
    document.body.className = `game-${state.gameKey}`;
    document.documentElement.style.setProperty('--primary', conf.color);
    document.documentElement.style.setProperty('--accent', conf.color);
    
    document.getElementById('name-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
    
    saveState();
    renderGame();
}