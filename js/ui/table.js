/**
 * Score Table Renderer
 * Displays game history and current totals
 */

function renderTable() {
    if (!state.currentGame) return;
    
    const game = state.currentGame;
    const conf = GAMES[state.gameKey];
    const thead = document.getElementById('table-head');
    const tbody = document.getElementById('table-body');
    const tfoot = document.getElementById('table-foot');
    
    // Build header
    let hHtml = `<th>Rd</th>`;
    
    if (state.gameKey === 'oldhell') {
        hHtml = `<th>Cards</th><th>Trump</th>`;
    }
    
    let showGoalCol = true;
    if (game.randomMap) showGoalCol = false;
    if (state.gameKey === 'qwirkle' || state.gameKey === 'oldhell' || 
        state.gameKey === 'rummikub' || state.gameKey === 'triominos') showGoalCol = false;
    if (state.gameKey === 'spades') showGoalCol = false;
    
    if(showGoalCol) hHtml += `<th>Goal</th>`;
    
    let useTeams = game.settings.useTeams;

    if (useTeams) {
        let teamCount = game.players.length / 2;
        for(let t = 0; t < teamCount; t++) {
            let p1Name = game.players[t * 2].name;
            let p2Name = game.players[t * 2 + 1].name;
            hHtml += `<th>${p1Name} & ${p2Name}</th>`;
        }
    } else {
        game.players.forEach(p => hHtml += `<th>${p.name}</th>`);
    }
    
    thead.innerHTML = hHtml;
    
    // Build body
    tbody.innerHTML = '';
    const history = game.history;

    history.forEach((h, rIdx) => {
        let tr = document.createElement('tr');
        
        let ctx = game.getRoundDescription(0, rIdx);
        
        if (state.gameKey === 'oldhell') {
            // handled below
        } else if (state.gameKey === 'mexicantrain') {
            // handled in getRoundDescription
        } else if (h.trump) {
            ctx = `<span style="font-size:1.5em; color:${(h.trump==='H'||h.trump==='D')?'red':'black'}">${getSuitIcon(h.trump)}</span>`;
        } else if (h.isBid) {
            ctx = "Bids";
        }
        
        if (ctx) ctx = ctx.replace(', ', '<br>');
        
        let rowHtml = `<td>${h.label}</td>`;
        
        if (state.gameKey === 'oldhell') {
            let tIcon = h.trump ? `<span style="color:${(h.trump==='H'||h.trump==='D')?'red':'black'}">${getSuitIcon(h.trump)}</span>` : '';
            rowHtml += `<td style="font-size:1.2em">${tIcon}</td>`;
        }
        
        if(showGoalCol) rowHtml += `<td class="contract-text">${ctx}</td>`;
        tr.innerHTML = rowHtml;
        
        // Build player/team columns
        if (useTeams) {
            let teamCount = game.players.length / 2;
            for(let t = 0; t < teamCount; t++) {
                let p1Idx = t * 2;
                let p2Idx = t * 2 + 1;
                let valToDisplay = 0;
                
                if (h.isBid) {
                    let b1 = h.scores[p1Idx];
                    let b2 = h.scores[p2Idx];
                    valToDisplay = `${b1} / ${b2}`;
                } else {
                    if (state.gameKey === 'spades') {
                        if (h.isComplete) {
                            let b1 = h.bids[p1Idx];
                            let b2 = h.bids[p2Idx];
                            let t1 = h.tricks[p1Idx];
                            let t2 = h.tricks[p2Idx];
                            let score = h.scores[p1Idx];
                            
                            valToDisplay = `<div class="spades-cell">
                                <div class="spades-details">
                                    <span class="s-label">B: ${b1}/${b2}</span>
                                    <span class="s-label">T: ${t1}/${t2}</span>
                                </div>
                                <div class="spades-score">${score}</div>
                            </div>`;
                        } else {
                            valToDisplay = h.scores[p1Idx];
                        }
                    } else {
                        let scoreSum = h.scores[p1Idx] + h.scores[p2Idx];
                        if (state.gameKey === 'shanghai' && game.randomMap) {
                            let g = game.randomMap[p1Idx][rIdx];
                            valToDisplay = `<div style="font-size:0.75em; color:#555; margin-bottom:4px; line-height:1.2; text-align:left">
                                <div>${g}</div>
                            </div>
                            <span style="font-weight:bold">${scoreSum}</span>`;
                        } else {
                            valToDisplay = scoreSum;
                        }
                    }
                }
                tr.innerHTML += `<td>${valToDisplay}</td>`;
            }
        } else {
            h.scores.forEach((s, i) => {
                let cls = (i === h.dealerIdx) ? 'history-dealer' : '';
                let content = s;

                if (state.gameKey === 'oldhell' && h.isComplete) {
                    let bid = h.bids[i];
                    let made = h.made[i];
                    let score = h.scores[i];
                    let colorClass = (made) ? 'oh-made' : 'oh-missed';
                    let statusText = made ? 'Made' : 'Missed';
                    
                    content = `<div class="spades-cell ${colorClass}">
                        <div class="spades-details">
                            <span class="s-label">B: ${bid}</span>
                            <span class="s-label">${statusText}</span>
                        </div>
                        <div class="spades-score">${score}</div>
                    </div>`;
                } else if (state.gameKey === 'spades' && h.isComplete) {
                    let bid = h.bids[i];
                    let trick = h.tricks[i];
                    let score = h.scores[i];
                    
                    content = `<div class="spades-cell">
                        <div class="spades-details">
                            <span class="s-label">B: ${bid}</span>
                            <span class="s-label">T: ${trick}</span>
                        </div>
                        <div class="spades-score">${score}</div>
                    </div>`;
                } else {
                    if (h.starFlags && h.starFlags[i]) {
                        content = `${content}<span class="history-star">★</span>`;
                    }
                    
                    if (h.meta && h.meta.mods && h.meta.mods[i]) {
                        h.meta.mods[i].forEach(m => {
                            if(m === 'q') content += '<span class="badge-q">Q</span>';
                            if(m === 'qq') content += '<span class="badge-qq">QQ</span>';
                            if(m === 'end') content += '<span class="badge-end">🏁</span>';
                        });
                    }
                    
                    if(game.randomMap) {
                        content += `<span class="table-sub">${game.randomMap[i][rIdx]}</span>`;
                    }
                }

                tr.innerHTML += `<td class="${cls}">${content}</td>`;
            });
        }
        tbody.appendChild(tr);
    });
    
    // Build footer
    let fHtml = `<td>Tot</td>`;
    if(state.gameKey === 'oldhell') fHtml += `<td></td>`;
    if(showGoalCol) fHtml += `<td></td>`;
    
    if (useTeams) {
        let teamCount = game.players.length / 2;
        for(let t = 0; t < teamCount; t++) {
            let p1Total = game.players[t * 2].total;
            let p2Total = game.players[t * 2 + 1].total;
            let combined = (state.gameKey === 'spades') ? p1Total : (p1Total + p2Total);
            fHtml += `<td>${combined}</td>`;
        }
    } else {
        game.players.forEach(p => fHtml += `<td>${p.total}</td>`);
    }
    
    tfoot.innerHTML = fHtml;
}