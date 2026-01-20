/**
 * Hearts
 * Point trick-taking game with passing rounds
 */

class HeartsGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
    }
    
    getHeroContent() {
        let r = (this.round - 1);
        let seq = [];
        const playerCount = this.players.length;
        
        if (playerCount === 3) {
            seq = ["Left", "Right", "Hold"];
        } else if (playerCount === 4) {
            seq = ["Left", "Right", "Across", "Hold"];
        } else if (playerCount === 5) {
            seq = ["Left", "Right", "2 Left", "2 Right", "Hold"];
        } else if (playerCount === 6) {
            seq = ["Left", "Right", "2 Left", "2 Right", "3 Left", "3 Right"];
        } else {
            seq = ["Left", "Right", "Across", "Hold"];
        }
        
        let msg = "Pass " + seq[r % seq.length];
        return `<span class="hero-display" style="font-size:1.2em">${msg}</span>`;
    }
    
    getRoundDescription(pIdx, rIdx) {
        let r = rIdx;
        let seq = [];
        const playerCount = this.players.length;
        
        if (playerCount === 3) {
            seq = ["Left", "Right", "Hold"];
        } else if (playerCount === 4) {
            seq = ["Left", "Right", "Across", "Hold"];
        } else {
            seq = ["Left", "Right", "Across", "Hold"];
        }
        
        return seq[r % seq.length];
    }
    
    validateInput(rawInputs) {
        let hasContent = false;
        rawInputs.forEach(val => {
            if (val !== '') hasContent = true;
        });
        
        if (!hasContent) {
            return { valid: false, msg: "Enter at least one score." };
        }
        
        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        let sum = inputs.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0);
        let moonSum = 26 * (this.players.length - 1);
        
        if (sum !== 26 && sum !== moonSum) {
            return { 
                valid: false, 
                msg: `Total must be 26 (or ${moonSum} for Moon). You have ${sum}.` 
            };
        }
        
        return { valid: true };
    }
}