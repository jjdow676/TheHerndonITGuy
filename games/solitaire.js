// ===== SOLITAIRE (KLONDIKE) GAME =====
class SolitaireGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Card dimensions
        this.cardWidth = 50;
        this.cardHeight = 70;
        this.cardGap = 15;
        this.stackOffset = 18;

        // Game state
        this.deck = [];
        this.waste = [];
        this.foundations = [[], [], [], []]; // 4 foundation piles
        this.tableau = [[], [], [], [], [], [], []]; // 7 tableau piles
        this.moves = 0;

        // Drag state
        this.dragging = null;
        this.dragOffset = { x: 0, y: 0 };
        this.dragSource = null;

        // Setup
        this.setupControls();
    }

    setupControls() {
        this.mousedownHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseDown(x, y);
        };

        this.mousemoveHandler = (e) => {
            if (!this.dragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseMove(x, y);
        };

        this.mouseupHandler = (e) => {
            if (!this.dragging) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseUp(x, y);
        };

        this.canvas.addEventListener('mousedown', this.mousedownHandler);
        this.canvas.addEventListener('mousemove', this.mousemoveHandler);
        this.canvas.addEventListener('mouseup', this.mouseupHandler);
    }

    destroy() {
        this.canvas.removeEventListener('mousedown', this.mousedownHandler);
        this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
        this.canvas.removeEventListener('mouseup', this.mouseupHandler);
    }

    createDeck() {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        const deck = [];
        for (let suit of suits) {
            for (let value = 1; value <= 13; value++) {
                deck.push({
                    suit,
                    value,
                    faceUp: false,
                    color: (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black'
                });
            }
        }
        return deck;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    start() {
        // Create and shuffle deck
        this.deck = this.shuffle(this.createDeck());
        this.waste = [];
        this.foundations = [[], [], [], []];
        this.tableau = [[], [], [], [], [], [], []];
        this.moves = 0;
        this.dragging = null;

        // Deal to tableau
        for (let i = 0; i < 7; i++) {
            for (let j = i; j < 7; j++) {
                const card = this.deck.pop();
                card.faceUp = (j === i);
                this.tableau[j].push(card);
            }
        }

        this.draw();
    }

    getCardName(card) {
        const names = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        return names[card.value];
    }

    getSuitSymbol(suit) {
        const symbols = {
            hearts: '\u2665',
            diamonds: '\u2666',
            clubs: '\u2663',
            spades: '\u2660'
        };
        return symbols[suit];
    }

    drawCard(card, x, y, highlight = false) {
        this.ctx.save();

        // Card shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.fillRect(x + 2, y + 2, this.cardWidth, this.cardHeight);

        // Card background
        if (card.faceUp) {
            this.ctx.fillStyle = highlight ? '#FFFFCC' : '#FFF';
        } else {
            this.ctx.fillStyle = '#1E4D8C';
        }
        this.ctx.fillRect(x, y, this.cardWidth, this.cardHeight);

        // Card border
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.cardWidth, this.cardHeight);

        if (card.faceUp) {
            // Card content
            this.ctx.fillStyle = card.color;
            this.ctx.font = 'bold 12px "Tahoma", sans-serif';
            this.ctx.textAlign = 'left';

            const name = this.getCardName(card);
            const suit = this.getSuitSymbol(card.suit);

            // Top left
            this.ctx.fillText(name, x + 4, y + 14);
            this.ctx.font = '14px "Tahoma", sans-serif';
            this.ctx.fillText(suit, x + 4, y + 28);

            // Center suit
            this.ctx.font = '24px "Tahoma", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(suit, x + this.cardWidth / 2, y + this.cardHeight / 2 + 8);
        } else {
            // Card back pattern
            this.ctx.strokeStyle = '#2E6DBD';
            this.ctx.lineWidth = 1;
            for (let i = 4; i < this.cardWidth - 4; i += 6) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + i, y + 4);
                this.ctx.lineTo(x + i, y + this.cardHeight - 4);
                this.ctx.stroke();
            }
        }

        this.ctx.restore();
    }

    drawEmptySlot(x, y) {
        this.ctx.strokeStyle = '#2E6DBD';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, this.cardWidth, this.cardHeight);
        this.ctx.setLineDash([]);
    }

    getTableauX(index) {
        return 10 + index * (this.cardWidth + this.cardGap);
    }

    getFoundationX(index) {
        return this.width - 10 - (4 - index) * (this.cardWidth + this.cardGap);
    }

    handleMouseDown(x, y) {
        // Check deck
        if (x >= 10 && x <= 10 + this.cardWidth && y >= 10 && y <= 10 + this.cardHeight) {
            if (this.deck.length > 0) {
                const card = this.deck.pop();
                card.faceUp = true;
                this.waste.push(card);
                this.moves++;
            } else if (this.waste.length > 0) {
                // Flip waste back to deck
                while (this.waste.length > 0) {
                    const card = this.waste.pop();
                    card.faceUp = false;
                    this.deck.push(card);
                }
            }
            this.draw();
            return;
        }

        // Check waste pile for drag
        if (this.waste.length > 0) {
            const wasteX = 10 + this.cardWidth + this.cardGap;
            const wasteY = 10;
            if (x >= wasteX && x <= wasteX + this.cardWidth &&
                y >= wasteY && y <= wasteY + this.cardHeight) {
                this.dragging = [this.waste[this.waste.length - 1]];
                this.dragSource = { type: 'waste' };
                this.dragOffset = { x: x - wasteX, y: y - wasteY };
                return;
            }
        }

        // Check tableau piles
        for (let i = 0; i < 7; i++) {
            const pile = this.tableau[i];
            const pileX = this.getTableauX(i);

            for (let j = pile.length - 1; j >= 0; j--) {
                const card = pile[j];
                if (!card.faceUp) continue;

                const cardY = 100 + j * this.stackOffset;

                if (x >= pileX && x <= pileX + this.cardWidth &&
                    y >= cardY && y <= cardY + this.cardHeight) {
                    // Grab this card and all cards on top
                    this.dragging = pile.slice(j);
                    this.dragSource = { type: 'tableau', index: i, cardIndex: j };
                    this.dragOffset = { x: x - pileX, y: y - cardY };
                    return;
                }
            }
        }

        // Check foundation piles for drag
        for (let i = 0; i < 4; i++) {
            const pile = this.foundations[i];
            if (pile.length === 0) continue;

            const foundX = this.getFoundationX(i);
            if (x >= foundX && x <= foundX + this.cardWidth &&
                y >= 10 && y <= 10 + this.cardHeight) {
                this.dragging = [pile[pile.length - 1]];
                this.dragSource = { type: 'foundation', index: i };
                this.dragOffset = { x: x - foundX, y: y - 10 };
                return;
            }
        }
    }

    handleMouseMove(x, y) {
        this.draw();

        // Draw dragged cards
        if (this.dragging) {
            for (let i = 0; i < this.dragging.length; i++) {
                this.drawCard(this.dragging[i],
                    x - this.dragOffset.x,
                    y - this.dragOffset.y + i * this.stackOffset);
            }
        }
    }

    handleMouseUp(x, y) {
        if (!this.dragging) return;

        let placed = false;

        // Try to place on foundation
        for (let i = 0; i < 4; i++) {
            const foundX = this.getFoundationX(i);
            if (x >= foundX && x <= foundX + this.cardWidth &&
                y >= 10 && y <= 10 + this.cardHeight) {

                if (this.dragging.length === 1 && this.canPlaceOnFoundation(this.dragging[0], i)) {
                    this.foundations[i].push(this.dragging[0]);
                    this.removeFromSource();
                    placed = true;
                    break;
                }
            }
        }

        // Try to place on tableau
        if (!placed) {
            for (let i = 0; i < 7; i++) {
                const pileX = this.getTableauX(i);
                const pile = this.tableau[i];
                const pileY = pile.length === 0 ? 100 : 100 + (pile.length - 1) * this.stackOffset;

                if (x >= pileX && x <= pileX + this.cardWidth &&
                    y >= pileY && y <= pileY + this.cardHeight + 50) {

                    if (this.canPlaceOnTableau(this.dragging[0], i)) {
                        for (let card of this.dragging) {
                            this.tableau[i].push(card);
                        }
                        this.removeFromSource();
                        placed = true;
                        break;
                    }
                }
            }
        }

        this.dragging = null;
        this.dragSource = null;
        this.moves++;
        this.draw();
        this.checkWin();
    }

    removeFromSource() {
        if (!this.dragSource) return;

        if (this.dragSource.type === 'waste') {
            this.waste.pop();
        } else if (this.dragSource.type === 'tableau') {
            const pile = this.tableau[this.dragSource.index];
            pile.splice(this.dragSource.cardIndex);
            // Flip top card if needed
            if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
                pile[pile.length - 1].faceUp = true;
            }
        } else if (this.dragSource.type === 'foundation') {
            this.foundations[this.dragSource.index].pop();
        }
    }

    canPlaceOnFoundation(card, foundIndex) {
        const pile = this.foundations[foundIndex];
        if (pile.length === 0) {
            return card.value === 1; // Ace
        }
        const top = pile[pile.length - 1];
        return card.suit === top.suit && card.value === top.value + 1;
    }

    canPlaceOnTableau(card, tableauIndex) {
        const pile = this.tableau[tableauIndex];
        if (pile.length === 0) {
            return card.value === 13; // King
        }
        const top = pile[pile.length - 1];
        return card.color !== top.color && card.value === top.value - 1;
    }

    checkWin() {
        const totalInFoundations = this.foundations.reduce((sum, f) => sum + f.length, 0);
        if (totalInFoundations === 52) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 32px "Tahoma", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('YOU WIN!', this.width / 2, this.height / 2 - 20);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '18px "Tahoma", sans-serif';
            this.ctx.fillText(`Moves: ${this.moves}`, this.width / 2, this.height / 2 + 15);
        }
    }

    draw() {
        // Background
        this.ctx.fillStyle = '#1E5631';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw deck
        if (this.deck.length > 0) {
            this.drawCard({ faceUp: false }, 10, 10);
        } else {
            this.drawEmptySlot(10, 10);
        }

        // Draw waste
        const wasteX = 10 + this.cardWidth + this.cardGap;
        if (this.waste.length > 0) {
            this.drawCard(this.waste[this.waste.length - 1], wasteX, 10);
        } else {
            this.drawEmptySlot(wasteX, 10);
        }

        // Draw foundations
        for (let i = 0; i < 4; i++) {
            const x = this.getFoundationX(i);
            if (this.foundations[i].length > 0) {
                this.drawCard(this.foundations[i][this.foundations[i].length - 1], x, 10);
            } else {
                this.drawEmptySlot(x, 10);
            }
        }

        // Draw tableau
        for (let i = 0; i < 7; i++) {
            const x = this.getTableauX(i);
            const pile = this.tableau[i];

            if (pile.length === 0) {
                this.drawEmptySlot(x, 100);
            } else {
                for (let j = 0; j < pile.length; j++) {
                    // Don't draw cards being dragged
                    if (this.dragging && this.dragSource &&
                        this.dragSource.type === 'tableau' &&
                        this.dragSource.index === i &&
                        j >= this.dragSource.cardIndex) {
                        continue;
                    }
                    this.drawCard(pile[j], x, 100 + j * this.stackOffset);
                }
            }
        }

        // Draw moves counter
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '14px "Tahoma", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Moves: ${this.moves}`, 10, this.height - 10);
    }
}

// Export for use
window.SolitaireGame = SolitaireGame;
