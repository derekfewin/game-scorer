/**
 * Mexican Train Dominoes
 * 13 rounds with manual starter selection
 */

class MexicanTrainGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
        this.manualStarter = -1;
    }
    
    getHeroContent() {
        let val = 13 - this.round;
        if (val < 0) val = 0;
        return getDominoSvg(val, 60) + getDominoSvg(val, 60);
    }
    
    getRoundDescription(pIdx, rIdx) {
        let val = 13 - (rIdx + 1);
        if (val < 0) return "";
        return getDominoSvg(val, 20) + getDominoSvg(val, 20);
    }
    
    getDealerIdx() {
        return this.manualStarter;
    }
    
    setStarter(idx) {
        this.manualStarter = idx;
    }
    
    validateInput(rawInputs) {
        let base = super.validateInput(rawInputs);
        if (!base.valid) return base;
        
        if (this.manualStarter === -1) {
            return { valid: false, msg: "Who started the round? Tap a domino." };
        }
        
        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        let zeroCount = inputs.filter(v => v === 0).length;
        
        if (zeroCount === 0) {
            return { valid: false, msg: "Someone must have 0 (The Winner)." };
        }
        if (zeroCount > 1) {
            return { valid: false, msg: "Only one person can have 0." };
        }
        
        return { valid: true };
    }
    
    advanceRound() {
        this.dealCount++;
        this.round++;
        this.manualStarter = -1;
        if (this.round > 13) this.isGameOver = true;
    }
    
    undo() {
        let last = super.undo();
        if (last) this.manualStarter = last.dealerIdx;
        return last;
    }
}