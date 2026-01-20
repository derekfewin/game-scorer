/**
 * Spades Game
 * Bidding game with bags and blind nil
 * Supports teams
 */

class SpadesGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
        this.phase = 'bid';
        this.tempBlindNil = new Array(players.length).fill(false);
    }

    getHeroContent() {
        return (this.phase === 'bid') 
            ? `<span class="hero-display">BID</span>` 
            : `<span class="hero-display">TRICKS</span>`;
    }

    toggleBlindNil(idx) {
        this.tempBlindNil[idx] = !this.tempBlindNil[idx];
    }

    submitRound(rawInputs) {
        if (this.phase === 'bid') return this.handleBid(rawInputs);
        return this.handleScore(rawInputs);
    }

    handleBid(rawInputs) {
        const bids = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        this.players.forEach((p, i) => {
            p.bid = bids[i];
            p.isBlindNil = this.tempBlindNil[i];
        });

        let displayBids = this.players.map(p => 
            p.isBlindNil ? "BN" : (p.bid === 0 ? "Nil" : p.bid)
        );
        
        this.history.push({
            label: this.round,
            scores: displayBids,
            isBid: true,
            dealerIdx: this.getDealerIdx(),
            snapshot: this.createSnapshot()
        });

        this.phase = 'score';
        this.tempInput = [];
        this.tempBlindNil.fill(false);
        return { valid: true };
    }

    handleScore(rawInputs) {
        const bidHistory = this.history.pop();
        
        let hasContent = false;
        let trickInputs = rawInputs.map(v => {
            let n = parseInt(v);
            if(!isNaN(n)) hasContent = true;
            return isNaN(n) ? 0 : n;
        });

        if (!hasContent) {
            this.history.push(bidHistory);
            return { valid: false, msg: "Please enter tricks." };
        }
        
        let totalTricks = trickInputs.reduce((a,b) => a + b, 0);
        if(totalTricks !== 13) {
            this.history.push(bidHistory);
            return { 
                valid: false, 
                msg: `Total tricks must be 13 (Counted: ${totalTricks})` 
            };
        }

        const snapshot = this.createSnapshot();
        let roundScores = [];

        if (this.settings.useTeams) {
            let teamCount = this.players.length / 2;
            let teamScores = new Array(this.players.length).fill(0);
            
            for(let t = 0; t < teamCount; t++) {
                let p1Idx = t * 2;
                let p2Idx = t * 2 + 1;
                let p1 = this.players[p1Idx];
                let p2 = this.players[p2Idx];
                let t1 = trickInputs[p1Idx];
                let t2 = trickInputs[p2Idx];
                
                let teamScore = 0;
                let teamBags = 0;
                let combinedTricks = t1 + t2;
                let requiredTricks = 0;

                const handleNil = (p, tricks) => {
                    if (p.isBlindNil) return (tricks === 0) ? 200 : -200;
                    if (p.bid === 0) return (tricks === 0) ? 100 : -100;
                    requiredTricks += p.bid;
                    return 0;
                };

                teamScore += handleNil(p1, t1);
                teamScore += handleNil(p2, t2);

                if (requiredTricks > 0) {
                    if (combinedTricks >= requiredTricks) {
                        teamScore += (requiredTricks * 10);
                        let bags = combinedTricks - requiredTricks;
                        teamScore += bags;
                        teamBags += bags;
                    } else {
                        teamScore -= (requiredTricks * 10);
                    }
                }

                p1.bags = (p1.bags || 0) + teamBags;
                if (p1.bags >= 10) {
                    teamScore -= 100;
                    p1.bags -= 10;
                }

                teamScores[p1Idx] = teamScore;
                teamScores[p2Idx] = teamScore;
                p1.total += teamScore;
                p2.total += teamScore;
            }
            roundScores = teamScores;
        } else {
            roundScores = trickInputs.map((tricks, i) => {
                let p = this.players[i];
                let s = 0;
                if (p.isBlindNil) {
                    s = (tricks === 0) ? 200 : -200;
                } else if (p.bid === 0) {
                    s = (tricks === 0) ? 100 : -100;
                } else {
                    if (tricks >= p.bid) {
                        s = (p.bid * 10) + (tricks - p.bid);
                        p.bags = (p.bags || 0) + (tricks - p.bid);
                    } else {
                        s = -(p.bid * 10);
                    }
                }
                if (p.bags >= 10) {
                    s -= 100;
                    p.bags -= 10;
                }
                p.total += s;
                return s;
            });
        }

        this.history.push({
            label: this.round,
            scores: roundScores,
            bids: bidHistory.scores,
            tricks: trickInputs,
            dealerIdx: this.getDealerIdx(),
            snapshot: snapshot,
            isComplete: true,
            meta: { raw: rawInputs }
        });

        this.dealCount++;
        this.round++;
        this.phase = 'bid';
        this.tempInput = [];
        
        let top = Math.max(...this.players.map(p => p.total));
        if (top >= this.settings.targetScore) this.isGameOver = true;
        
        return { valid: true };
    }
    
    undo() {
        let last = super.undo();
        if (last.isBid) {
            this.phase = 'bid';
            this.tempInput = last.scores;
            this.tempBlindNil = this.players.map(p => p.isBlindNil);
            this.dealCount++;
            this.round++;
        } else if (last.isComplete) {
            this.history.push({
                label: last.label,
                scores: last.bids,
                isBid: true,
                dealerIdx: last.dealerIdx,
                snapshot: last.snapshot
            });
            this.phase = 'score';
            this.tempInput = last.meta.raw;
        }
        return last;
    }
}