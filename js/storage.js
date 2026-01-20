/**
 * Storage Management
 * Handles localStorage operations and data backup/restore
 */

function saveState() {
    if (!state.currentGame) return;
    
    let dataToSave = {
        gameKey: state.gameKey,
        classData: {
            players: state.currentGame.players,
            history: state.currentGame.history,
            round: state.currentGame.round,
            dealCount: state.currentGame.dealCount,
            isGameOver: state.currentGame.isGameOver,
            randomMap: state.currentGame.randomMap,
            phase: state.currentGame.phase,
            handSize: state.currentGame.handSize,
            currentTrump: state.currentGame.currentTrump,
            manualStarter: state.currentGame.manualStarter,
            settings: state.currentGame.settings
        }
    };
    
    localStorage.setItem('cardScorerSave', JSON.stringify(dataToSave));
}

function checkRestore() {
    if(localStorage.getItem('cardScorerSave')) {
        document.getElementById('restore-btn').style.display = 'block';
    } else {
        document.getElementById('restore-btn').style.display = 'none';
    }
}

function restoreGame() {
    let s = localStorage.getItem('cardScorerSave');
    if(!s) return;
    
    let parsed = JSON.parse(s);
    state.gameKey = parsed.gameKey;
    
    const conf = GAMES[state.gameKey];
    const cd = parsed.classData;
    const savedSettings = cd.settings || {};
    
    // Create appropriate game instance
    const GameClass = getGameClass(state.gameKey);
    state.currentGame = new GameClass(conf, cd.players, savedSettings);
    
    // Restore properties
    Object.assign(state.currentGame, cd);
    
    // Sync UI
    document.getElementById('game-select').value = state.gameKey;
    if (savedSettings.useTeams !== undefined) {
        document.getElementById('use-teams').checked = savedSettings.useTeams;
    }
    if (savedSettings.randomize !== undefined) {
        document.getElementById('randomize-goals').checked = savedSettings.randomize;
    }
    
    updateSetupUI();
    renderGame();
    
    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';
}

function getGameClass(key) {
    const classMap = {
        shanghai: ShanghaiGame,
        spades: SpadesGame,
        oldhell: OldHellGame,
        hearts: HeartsGame,
        mexicantrain: MexicanTrainGame,
        rummikub: RummikubGame,
        triominos: TriominosGame,
        qwirkle: SimpleScoreGame
    };
    return classMap[key] || SimpleScoreGame;
}

function exportData() {
    const backup = {
        save: localStorage.getItem('cardScorerSave'),
        lb: localStorage.getItem('cardScorerLB'),
        timestamp: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const fileName = `game_scorer_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', fileName);
    link.click();
}

function triggerImport() {
    document.getElementById('import-file').click();
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const backup = JSON.parse(content);
            
            showConfirm("This will OVERWRITE your current history. Continue?", () => {
                if (backup.save) localStorage.setItem('cardScorerSave', backup.save);
                if (backup.lb) localStorage.setItem('cardScorerLB', backup.lb);
                showAlert("Backup restored successfully!");
                setTimeout(() => location.reload(), 1000);
            });
        } catch (err) {
            showAlert("Error loading file: " + err);
        }
    };
    reader.readAsText(file);
    input.value = '';
}