/**
 * Triominos
 * Simple golf/penalty scoring
 */

class TriominosGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
    }
    
    validateInput(rawInputs) {
        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        let zeros = inputs.filter(v => v === 0).length;
        
        if (zeros === 0) {
            return { valid: false, msg: "Someone must have 0 (The Winner)." };
        }
        if (zeros > 1) {
            return { valid: false, msg: "Only one person can have 0." };
        }
        
        return super.validateInput(rawInputs);
    }
}