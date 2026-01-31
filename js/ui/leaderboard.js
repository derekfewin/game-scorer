/**
 * Leaderboard (Hall of Fame)
 * Displays game history and win statistics with charts
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
    if (!lb[state.gameKey]) lb[state.gameKey] = { stats: {}, history: [] };
    
    // Ensure stats and history objects exist
    if (!lb[state.gameKey].stats) lb[state.gameKey].stats = {};
    if (!lb[state.gameKey].history) lb[state.gameKey].history = [];
    
    // Store game history
    const gameRecord = {
        date: new Date().toISOString(),
        players: state.currentGame.players.map(p => ({ name: p.name, score: p.total })),
        winners: winners,
        isTeams: state.currentGame.settings.useTeams || false
    };
    lb[state.gameKey].history.unshift(gameRecord); // Add to beginning
    
    // Keep only last 20 games per game type
    if (lb[state.gameKey].history.length > 20) {
        lb[state.gameKey].history = lb[state.gameKey].history.slice(0, 20);
    }
    
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
            if (!lb[state.gameKey].stats[t.name]) {
                lb[state.gameKey].stats[t.name] = { wins: 0, plays: 0, best: null };
            }
            
            let stats = lb[state.gameKey].stats[t.name];
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
            
            if (!lb[state.gameKey].stats[pName]) {
                lb[state.gameKey].stats[pName] = { wins: 0, plays: 0, best: null };
            }
            
            let stats = lb[state.gameKey].stats[pName];
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

// Keep track of active chart instances
let chartInstances = {}; 

function showLeaderboard() {
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'none';
    document.getElementById('leaderboard-screen').style.display = 'block';
    
    const lb = JSON.parse(localStorage.getItem('cardScorerLB') || '{}');
    const div = document.getElementById('lb-content');
    div.innerHTML = '';
    
    // Clean up old charts
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {}; 

    const chartJsAvailable = typeof Chart !== 'undefined';
    
    for(let k in GAMES) {
        // Game Title
        let title = document.createElement('div');
        title.className = 'lb-title';
        title.innerHTML = `<span>${GAMES[k].name}</span> 
            <button class="btn-lb-reset" onclick="resetLB('${k}')">Clear</button>`;
        div.appendChild(title);
        
        // Migrate old format to new format
        let gameData = lb[k] || {};
        if (!gameData.stats && !gameData.history) {
            // Old format - migrate
            gameData = { stats: gameData, history: [] };
        }
        
        let rawData = gameData.stats || {};
        let history = gameData.history || [];
        
        let entries = Object.entries(rawData).map(([name, val]) => {
            if (typeof val === 'number') {
                return { name, wins: val, plays: val, best: '-' };
            }
            return { name, ...val };
        });
        
        entries.sort((a,b) => b.wins - a.wins);
        
        if(!entries.length && !history.length) {
            div.innerHTML += `<div style="color:#999;font-style:italic;margin-bottom:30px">No stats yet</div>`;
            continue;
        }
        
        // === SECTION 1: RECENT GAMES HISTORY ===
        if (history.length > 0) {
            let historyTitle = document.createElement('h3');
            historyTitle.style.cssText = 'font-size:1em; margin:15px 0 10px 0; color:#555;';
            historyTitle.textContent = '📅 Recent Games';
            div.appendChild(historyTitle);
            
            let historyTable = `<table class="lb-table" style="margin-bottom: 25px;">
                <thead><tr><th>Date</th><th>Winner(s)</th><th>Scores</th></tr></thead>
                <tbody>`;
                
            history.slice(0, 10).forEach(game => {
                let date = new Date(game.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                let winnersText = game.winners.join(', ');
                
                let scoresText = game.players.map(p => 
                    `${p.name}: ${p.score}`
                ).join(', ');
                
                historyTable += `<tr>
                    <td style="white-space:nowrap;">${date}</td>
                    <td><strong>${winnersText}</strong></td>
                    <td style="font-size:0.9em;">${scoresText}</td>
                </tr>`;
            });
            historyTable += `</tbody></table>`;
            div.innerHTML += historyTable;
        }
        
        // === SECTION 2: OVERALL STATS TABLE ===
        if (entries.length > 0) {
            let statsTitle = document.createElement('h3');
            statsTitle.style.cssText = 'font-size:1em; margin:15px 0 10px 0; color:#555;';
            statsTitle.textContent = '🏆 Overall Statistics';
            div.appendChild(statsTitle);
            
            let statsTable = `<table class="lb-table" style="margin-bottom: 20px;">
                <thead><tr><th>Name</th><th>Wins</th><th>%</th><th>Best</th></tr></thead>
                <tbody>`;
                
            entries.forEach(e => {
                let pct = (e.plays > 0) ? Math.round((e.wins / e.plays) * 100) : 0;
                let best = (e.best !== null && e.best !== '-') ? e.best : '-';
                statsTable += `<tr>
                    <td>${e.name}</td>
                    <td><span class="lb-win-badge">${e.wins}</span></td>
                    <td>${pct}%</td>
                    <td>${best}</td>
                </tr>`;
            });
            statsTable += `</tbody></table>`;
            div.innerHTML += statsTable;

            // === SECTION 3: CHART ===
            if (chartJsAvailable && entries.length > 0) {
                try {
                    renderLeaderboardChart(k, entries, div);
                } catch (error) {
                    console.error('Error rendering chart for ' + k + ':', error);
                }
            }
        }
    }
}

function renderLeaderboardChart(gameKey, entries, container) {
    let canvasId = `chart-${gameKey}`;
    let chartContainer = document.createElement('div');
    chartContainer.style.cssText = 'position:relative; height:250px; width:100%; margin-bottom:40px;';
    chartContainer.innerHTML = `<canvas id="${canvasId}"></canvas>`;
    container.appendChild(chartContainer);

    const names = entries.map(e => e.name);
    const wins = entries.map(e => e.wins);
    const winRates = entries.map(e => (e.plays > 0 ? parseFloat(((e.wins / e.plays) * 100).toFixed(1)) : 0));

    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    chartInstances[gameKey] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: names,
            datasets: [
                {
                    label: 'Total Wins',
                    data: wins,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Win Rate %',
                    data: winRates,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderWidth: 2,
                    tension: 0.3,
                    yAxisID: 'y1',
                    order: 1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: { 
                    position: 'top',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'y1') {
                                    label += context.parsed.y + '%';
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { 
                        display: true, 
                        text: 'Total Wins',
                        font: { size: 12 }
                    },
                    ticks: { 
                        stepSize: 1,
                        beginAtZero: true
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: { 
                        display: true, 
                        text: 'Win Rate %',
                        font: { size: 12 }
                    },
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function closeLeaderboard() {
    Object.values(chartInstances).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });
    chartInstances = {};
    
    resetTheme();
    document.getElementById('leaderboard-screen').style.display = 'none';
    document.getElementById('setup-screen').style.display = 'block';
    checkRestore();
}

function resetLB(key) {
    showConfirm("Reset history for this game?", () => {
        let lb = JSON.parse(localStorage.getItem('cardScorerLB') || '{}');
        lb[key] = { stats: {}, history: [] };
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