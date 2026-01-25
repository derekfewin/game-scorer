/**
 * Shanghai (Shang-Hi) Game
 * Contract rummy with 10 rounds
 * Supports teams and randomized goals
 */

class ShanghaiGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
        
        this.contracts = [...config.rounds];
        this.randomMap = null;
        
        const shuffle = (array) => {
            const arr = [...array]; // Create a copy to avoid mutating the original
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };
        if (settings.randomize) {
            if (settings.useTeams) {
                // Generate team-based random goals
                this.randomMap = new Array(players.length);
                let teamCount = players.length / 2;
                
                for(let t = 0; t < teamCount; t++) {
                    // Create one random sequence per team
                    let goals = shuffle(config.rounds);
                    this.randomMap[t * 2] = goals;
                    this.randomMap[t * 2 + 1] = goals;
                }
            } else {
                // Individual random goals
                this.randomMap = players.map(() => 
                    shuffle(config.rounds)
                );
            }
        }
    }
    
    getHeroContent() {
        if (this.randomMap) {
            return this.settings.useTeams 
                ? `(INDIVIDUAL TEAM GOALS)` 
                : `(INDIVIDUAL GOALS)`;
        }
        
        const txt = this.contracts[this.round - 1] || "Finish";
        return `<span class="hero-display">${txt}</span>`;
    }
    
    getRoundDescription(playerIdx, roundIdx) {
        if (this.randomMap) {
            return this.randomMap[playerIdx][roundIdx];
        }
        
        // Show contract only for first player
        if (playerIdx === 0) {
            return this.contracts[roundIdx];
        }
        
        return "";
    }
    
    validateInput(rawInputs) {
        let validNums = [];
        let hasContent = false;
        
        for (let i = 0; i < rawInputs.length; i++) {
            if (rawInputs[i] !== '') hasContent = true;
            
            let val = parseInt(rawInputs[i]);
            if (isNaN(val)) val = 0;
            
            // Must be multiple of 5
            if (val % 5 !== 0) {
                return { 
                    valid: false, 
                    msg: `Player ${i + 1}: Score must be multiple of 5` 
                };
            }
            
            validNums.push(val);
        }
        
        if (!hasContent) {
            return { valid: false, msg: "Enter scores." };
        }
        
        // Team validation
        if (this.settings.useTeams) {
            let winningTeams = 0;
            let partialZero = false;
            
            for (let i = 0; i < this.players.length; i += 2) {
                let s1 = validNums[i];
                let s2 = validNums[i + 1];
                
                if (s1 === 0 && s2 === 0) {
                    winningTeams++;
                } else if (s1 === 0 || s2 === 0) {
                    partialZero = true;
                }
            }
            
            if (partialZero) {
                return { 
                    valid: false, 
                    msg: "Team Rule: Both partners must have 0 to win." 
                };
            }
            
            if (winningTeams === 0) {
                return { 
                    valid: false, 
                    msg: "One team must have 0 (both players)." 
                };
            }
            
            if (winningTeams > 1) {
                return { 
                    valid: false, 
                    msg: "Only one team can have 0." 
                };
            }
        } else {
            // Individual validation
            let zeros = validNums.filter(v => v === 0).length;
            
            if (zeros === 0) {
                return { valid: false, msg: "Someone must have 0." };
            }
            
            if (zeros > 1) {
                return { valid: false, msg: "Only one person can have 0." };
            }
        }
        
        return { valid: true };
    }
    
    advanceRound() {
        super.advanceRound();
        
        // Game ends after 10 rounds
        if (this.round > 10) {
            this.isGameOver = true;
        }
    }
}