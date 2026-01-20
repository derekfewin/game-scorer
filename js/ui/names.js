/**
 * Name Entry Screen
 * Player/team name configuration
 */

function showNames() {
    state.gameKey = document.getElementById('game-select').value;
    const count = parseInt(document.getElementById('player-count').value);
    const useTeams = document.getElementById('use-teams').checked;
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('name-screen').style.display = 'block';
    
    const container = document.getElementById('name-inputs');
    container.innerHTML = '';
    const numUnits = useTeams ? count/2 : count;
    
    for(let i = 1; i <= numUnits; i++) {
        let html = `<div class="setup-group">`;
        if (useTeams) {
            html += `<span class="team-label">Team ${i}</span>
                     <label>Member 1</label>${nameDropdown(i+'-a')}
                     <label>Member 2</label>${nameDropdown(i+'-b')}`;
        } else {
            html += `<label>Player ${i}</label>${nameDropdown(i)}`;
        }
        html += `</div>`;
        container.innerHTML += html;
    }
    updateNameDropdowns();
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
    const useTeams = document.getElementById('use-teams').checked;
    const randomize = document.getElementById('randomize-goals').checked;
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