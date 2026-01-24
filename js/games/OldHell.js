/**
 * Old Hell (Oh Hell)
 * Bidding game with variable hand size and trump selection
 */

class OldHellGame extends GameBase {
    constructor(config, players, settings) {
        super(config, players, settings);
        this.handSize = Math.floor(52 / players.length);
        this.phase = 'bid';
        this.currentTrump = '';
    }

    getHeroContent() {
        if (this.phase === 'bid') {
            return `<span class="hero-display">BID<br><span style="font-size:0.6em">${this.handSize} Cards</span></span>`;
        }
        return `<span class="hero-display">SCORE<br><span style="font-size:0.6em">${this.handSize} Cards</span></span>`;
    }

    setTrump(t) {
        this.currentTrump = t;
    }

    submitRound(rawInputs) {
        if (this.phase === 'bid') return this.handleBid(rawInputs);
        return this.handleScore(rawInputs);
    }

    handleBid(rawInputs) {
        if (!this.currentTrump) {
            return { valid: false, msg: "Select a Trump suit." };
        }
        
        const bids = rawInputs.map(v => (v === '' ? 0 : parseInt(v)));
        const totalBids = bids.reduce((a,b) => a + b, 0);
        
        if (totalBids === this.handSize) {
            return { 
                valid: false, 
                msg: `Screw the Dealer: Total bids (${totalBids}) cannot equal card count (${this.handSize}).` 
            };
        }
        
        this.players.forEach((p, i) => p.bid = bids[i]);
        
        this.history.push({
            label: this.handSize,
            scores: bids,
            isBid: true,
            dealerIdx: this.getDealerIdx(),
            trump: this.currentTrump,
            snapshot: this.createSnapshot()
        });
        
        this.phase = 'score';
        this.tempInput = [];
        return { valid: true };
    }

    handleScore(rawInputs) {
        const bidHistory = this.history.pop();
        const snapshot = this.createSnapshot();
        
        const madeFlags = rawInputs.map(v => v === 'true');
        
        const scores = this.players.map((p, i) => {
            const made = madeFlags[i];
            return made ? (10 + p.bid) : 0;
        });
        
        const allMade = rawInputs.every(v => v === 'true');
        const sumBids = this.players.reduce((a,p) => a + p.bid, 0);
        
        if (allMade && sumBids !== this.handSize) {
            this.history.push(bidHistory);
            return { 
                valid: false, 
                msg: "Impossible! Total bids didn't match card count, so someone must have missed." 
            };
        }

        this.players.forEach((p, i) => p.total += scores[i]);

        this.history.push({
            label: this.handSize,
            bids: this.players.map(p => p.bid),
            made: madeFlags,
            scores: scores,
            isComplete: true,
            dealerIdx: this.getDealerIdx(),
            trump: this.currentTrump,
            meta: { raw: rawInputs },
            snapshot: snapshot
        });

        this.dealCount++;
        this.handSize--;
        this.phase = 'bid';
        this.currentTrump = '';
        this.tempInput = [];
        
        if (this.handSize < 1) this.isGameOver = true;
        return { valid: true };
    }
    
    undo() {
        let last = super.undo();
        
        if (last.isBid) {
            this.phase = 'bid';
            this.currentTrump = last.trump;
            this.tempInput = last.scores;
            this.dealCount++;
            this.round++;
        } else if (last.isComplete) {
            this.history.push({
                label: last.label,
                scores: last.bids,
                isBid: true,
                dealerIdx: last.dealerIdx,
                trump: last.trump,
                snapshot: last.snapshot
            });
            this.phase = 'score';
            this.handSize++;
            this.currentTrump = last.trump;
            this.tempInput = last.meta.raw;
        }
        return last;
    }
}