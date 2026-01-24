/**
 * Hearts Game
 * Card game with moon shooting and variable passing patterns
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
        
        let msg = seq[r % seq.length];
        // Don't add "Pass" prefix if it's "Hold"
        if (msg !== "Hold") {
            msg = "Pass " + msg;
        }
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
        } else if (playerCount === 5) {
            seq = ["Left", "Right", "2 Left", "2 Right", "Hold"];
        } else if (playerCount === 6) {
            seq = ["Left", "Right", "2 Left", "2 Right", "3 Left", "3 Right"];
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
        let sum = inputs.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
        let moonSum = 26 * (this.players.length - 1);
        
        if (sum !== 26 && sum !== moonSum) {
            return { 
                valid: false, 
                msg: `Total must be 26 (or ${moonSum} for Moon). You have ${sum}.` 
            };
        }
        
        return { valid: true };
    }

    submitRound(rawInputs, modifiers = []) {
        const validation = this.validateInput(rawInputs);
        if (!validation.valid) return validation;

        const inputs = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        const snapshot = this.createSnapshot();

        let scores = [...inputs];
        let moonShooterIdx = -1;

        // Check if someone shot the moon (got all 26 points)
        const moonIdx = inputs.findIndex(val => val === 26);
        
        if (moonIdx !== -1) {
            // Someone shot the moon - they get 0, everyone else gets 26
            moonShooterIdx = moonIdx;
            scores = inputs.map((val, idx) => {
                if (idx === moonIdx) {
                    return 0; // Moon shooter gets 0
                } else {
                    return 26; // Everyone else gets 26
                }
            });
        }

        // Apply scores to totals
        this.players.forEach((p, i) => p.total += scores[i]);

        this.history.push({
            label: this.round,
            scores: scores,
            dealerIdx: this.getDealerIdx(),
            meta: { raw: rawInputs, mods: modifiers, moonShooter: moonShooterIdx },
            starFlags: [...this.currentStars],
            snapshot: snapshot
        });

        this.advanceRound();
        this.modifiers = [];
        this.currentStars.fill(false);
        this.tempInput = [];
        return { valid: true };
    }

    advanceRound() {
        this.dealCount++;
        this.round++;
        
        if (this.settings.targetScore > 0) {
            const scores = this.players.map(p => p.total);
            const maxScore = Math.max(...scores);
            
            if (maxScore >= this.settings.targetScore) {
                this.isGameOver = true;
            }
        }
    }
}