/**
 * Rummikub
 * Winner takes pot scoring system
 */

class RummikubGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
    }
    
    validateInput(rawInputs) {
        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        let zeros = inputs.filter(v => v === 0).length;
        
        if (zeros === 0) {
            return { valid: false, msg: "Someone must have 0 (Winner)." };
        }
        if (zeros > 1) {
            return { valid: false, msg: "Only one person can have 0." };
        }
        
        return super.validateInput(rawInputs);
    }
    
    submitRound(rawInputs, modifiers = []) {
        const validation = this.validateInput(rawInputs);
        if (!validation.valid) return validation;
        
        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        let winnerIdx = inputs.indexOf(0);
        let totalPot = inputs.reduce((a,b) => a + b, 0);
        
        // Winner gets pot, losers get negative of their tiles
        const finalScores = inputs.map((val, i) => {
            if (i === winnerIdx) return totalPot;
            return -val;
        });
        
        const snapshot = this.createSnapshot();
        this.players.forEach((p, i) => p.total += finalScores[i]);
        
        this.history.push({
            label: this.round,
            scores: finalScores,
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
}