/**
 * GameBase Class
 * Parent class for all games - provides common functionality
 */

class GameBase {
    constructor(config, players, settings) {
        this.conf = config;
        this.players = players;
        this.settings = settings;
        
        this.round = 1;
        this.history = [];
        this.isGameOver = false;
        this.dealCount = 0;
        this.phase = 'score';
        
        this.modifiers = [];
        this.currentStars = new Array(players.length).fill(false);
        this.tempInput = [];
    }

    /**
     * Get the dealer/starter index
     */
    getDealerIdx() {
        if (!this.conf.hasDealer) return -1;
        
        if (this.settings.useTeams) {
            let numTeams = this.players.length / 2;
            let teamIndex = this.dealCount % numTeams;
            let memberIndex = Math.floor(this.dealCount / numTeams) % 2;
            return (teamIndex * 2) + memberIndex;
        }
        
        return this.dealCount % this.players.length;
    }

    /**
     * Get hero content (big display at top of screen)
     */
    getHeroContent() {
        return `<span class="hero-display">${this.conf.name}<br>Round ${this.round}</span>`;
    }
    
    /**
     * Get description for a specific round
     * Used in table headers and individual goals
     */
    getRoundDescription(playerIdx, roundIdx) {
        return "";
    }

    /**
     * Validate input before submission
     * Override in child classes for custom validation
     */
    validateInput(rawInputs) {
        let hasContent = false;
        rawInputs.forEach(val => {
            if (val !== '') hasContent = true;
        });
        
        if (!hasContent) {
            return { valid: false, msg: "Enter at least one score." };
        }
        
        return { valid: true };
    }

    /**
     * Create a snapshot of current player state for undo
     */
    createSnapshot() {
        return this.players.map(p => ({...p}));
    }

    /**
     * Submit a round of scores
     * Override for games with special scoring logic
     */
    submitRound(rawInputs, modifiers = []) {
        const validation = this.validateInput(rawInputs);
        if (!validation.valid) return validation;

        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        const snapshot = this.createSnapshot();

        const scores = inputs.map((val, i) => {
            let s = val;
            if (modifiers[i]) {
                modifiers[i].forEach(modId => {
                    let def = this.conf.helpers.find(h => h.id === modId);
                    if (def) s += def.val;
                });
            }
            return s;
        });

        this.players.forEach((p, i) => p.total += scores[i]);

        this.history.push({
            label: this.round,
            scores: scores,
            dealerIdx: this.getDealerIdx(),
            meta: { raw: rawInputs, mods: modifiers },
            starFlags: [...this.currentStars],
            snapshot: snapshot
        });

        this.advanceRound();
        this.modifiers = [];
        this.currentStars.fill(false);
        this.tempInput = [];
        return { valid: true };
    }

    /**
     * Advance to next round and check for game over
     */
    advanceRound() {
        this.dealCount++;
        this.round++;
        
        if (this.settings.targetScore > 0) {
            const scores = this.players.map(p => p.total);
            const check = (this.conf.type === 'low_score') 
                ? Math.min(...scores) 
                : Math.max(...scores);
            
            if (check >= this.settings.targetScore) {
                this.isGameOver = true;
            }
        }
    }

    /**
     * Undo the last round
     */
    undo() {
        if (!this.history.length) return null;
        
        const last = this.history.pop();
        
        this.isGameOver = false;
        this.round--;
        this.dealCount--;

        // Restore from snapshot if available
        if (last.snapshot) {
            this.players = last.snapshot;
        } else {
            // Fallback: subtract scores
            this.players.forEach((p, i) => p.total -= last.scores[i]);
        }
        
        // Restore temporary state
        if (last.meta && last.meta.raw) this.tempInput = last.meta.raw;
        if (last.meta && last.meta.mods) this.modifiers = last.meta.mods;
        if (last.starFlags) this.currentStars = last.starFlags;
        
        return last;
    }
}