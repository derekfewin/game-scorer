/**
 * Leaderboard (Hall of Fame)
 * Displays win statistics and personal bests
 */

function finalizeGame() {
    if (!state.currentGame) return;
    
    const conf = GAMES[state.gameKey];
    const totals = state.currentGame.players.map(p => p.total);
    let bestScore = (conf.type === 'low_score') 
        ? Math.min(...totals) 
        : Math.max(...totals);
    let winners = state.currentGame.players
        .filter(p => p.total === bestScore)
        .map(p => p.name);
    
    let lb = JSON.parse(localStorage.getItem('cardScorerLB') || '{}');
    if (!lb[state.gameKey]) lb[state.gameKey] = {};
    
    if (state.currentGame.settings.useTeams) {
        // TEAM STATS
        let teamCount = state.currentGame.players.length / 2;
        let teams = [];
        
        for(let t = 0; t < teamCount; t++) {
            let p1 = state.currentGame.players[t * 2];
            let p2 = state.currentGame.players[t * 2 + 1];
            let teamName = [p1.name, p2.name].sort().join(' & ');
            
            let s = (state.gameKey === 'spades') ? p1.total : (p1.total + p2.total);
            teams.push({ name: teamName, score: s });
        }
        
        let bestTeamScore = (conf.type === 'low_score') 
            ? Math.min(...teams.map(t => t.score)) 
            : Math.max(...teams.map(t => t.score));
        let winningTeams = teams.filter(t => t.score === bestTeamScore).map(t => t.name);
        
        teams.forEach(t => {
            if (!lb[state.gameKey][t.name]) {
                lb[state.gameKey][t.name] = { wins: 0, plays: 0, best: null };
            }
            
            let stats = lb[state.gameKey][t.name];
            stats.plays++;
            
            if (winningTeams.includes(t.name)) {
                stats.wins++;
            }
            
            if (stats.best === null) {
                stats.best = t.score;
            } else {
                if (conf.type === 'low_score') {
                    if (t.score < stats.best) stats.best = t.score;
                } else {
                    if (t.score > stats.best) stats.best = t.score;
                }
            }
        });
        
    } else {
        // INDIVIDUAL STATS
        state.currentGame.players.forEach(p => {
            let pName = p.name;
            
            // Migration: Convert old number format to object
            if (typeof lb[state.gameKey][pName] === 'number') {
                lb[state.gameKey][pName] = { 
                    wins: lb[state.gameKey][pName], 
                    plays: lb[state.gameKey][pName], 
                    best: null 
                };
            }
            
            if (!lb[state.gameKey][pName]) {
                lb[state.gameKey][pName] = { wins: 0, plays: 0, best: null };
            }
            
            let stats = lb[state.gameKey][pName];
            stats.plays++;
            
            if (winners.includes(pName)) {
                stats.wins++;
            }
            
            let pTotal = p.total;
            if (stats.best === null) {
                stats.best = pTotal;
            } else {
                if (conf.type === 'low_score') {
                    if (pTotal < stats.best) stats.best = pTotal;
                } else {
                    if (pTotal > stats.best) stats.best = pTotal;
                }
            }
        });
    }
    
    localStorage.setItem('cardScorerLB', JSON.stringify(lb));
    localStorage.removeItem('cardScorerSave');
    
    state.currentGame = null;
    document.getElementById('restore-btn').style.display = 'none';
    showLeaderboard();
}

function showLeaderboard() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('leaderboard-screen').style.display = 'block';
    
    const lb = JSON.parse(localStorage.getItem('cardScorerLB') || '{}');
    const div = document.getElementById('lb-content');
    div.innerHTML = '';
    
    for(let k in GAMES) {
        let title = document.createElement('div');
        title.className = 'lb-title';
        title.innerHTML = `<span>${GAMES[k].name}</span> 
            <button class="btn-lb-reset" onclick="resetLB('${k}')">Clear</button>`;
        div.appendChild(title);
        
        let rawData = lb[k] || {};
        let entries = Object.entries(rawData).map(([name, val]) => {
            if (typeof val === 'number') {
                return { name, wins: val, plays: val, best: '-' };
            }
            return { name, ...val };
        });
        
        entries.sort((a,b) => b.wins - a.wins);
        
        if(!entries.length) {
            div.innerHTML += `<div style="color:#999;font-style:italic;margin-bottom:20px">No stats yet</div>`;
        } else {
            let table = `<table class="lb-table">
                <thead><tr><th>Name</th><th>Wins</th><th>%</th><th>Best</th></tr></thead>
                <tbody>`;
                
            entries.forEach(e => {
                let pct = (e.plays > 0) ? Math.round((e.wins / e.plays) * 100) + '%' : '-';
                let best = (e.best !== null && e.best !== '-') ? e.best : '-';
                table += `<tr>
                    <td>${e.name}</td>
                    <td><span class="lb-win-badge">${e.wins}</span></td>
                    <td>${pct}</td>
                    <td>${best}</td>
                </tr>`;
            });
            table += `</tbody></table>`;
            div.innerHTML += table;
        }
    }
}

function closeLeaderboard() {
    resetTheme();
    document.getElementById('leaderboard-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
    checkRestore();
}

function resetLB(key) {
    showConfirm("Reset history for this game?", () => {
        let lb = JSON.parse(localStorage.getItem('cardScorerLB') || '{}');
        lb[key] = {};
        localStorage.setItem('cardScorerLB', JSON.stringify(lb));
        showLeaderboard();
    });
}

function clearLeaderboard() {
    showConfirm("Reset ALL history?", () => {
        localStorage.removeItem('cardScorerLB');
        showLeaderboard();
    });
}