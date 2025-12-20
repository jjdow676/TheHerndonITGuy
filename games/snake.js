// ===== SNAKE GAME =====
class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Grid settings
        this.gridSize = 20;
        this.gridWidth = Math.floor(this.width / this.gridSize);
        this.gridHeight = Math.floor(this.height / this.gridSize);

        // Game state
        this.snake = [];
        this.food = null;
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        this.gameRunning = false;
        this.gameOver = false;
        this.speed = 100; // ms per frame

        // Animation
        this.lastTime = 0;
        this.animationId = null;

        this.setupControls();
    }

    setupControls() {
        this.keydownHandler = (e) => {
            if (this.gameOver && e.key === ' ') {
                this.start();
                return;
            }

            if (!this.gameRunning) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction !== 'down') this.nextDirection = 'up';
                    e.preventDefault();
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction !== 'up') this.nextDirection = 'down';
                    e.preventDefault();
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction !== 'right') this.nextDirection = 'left';
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction !== 'left') this.nextDirection = 'right';
                    e.preventDefault();
                    break;
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
    }

    destroy() {
        document.removeEventListener('keydown', this.keydownHandler);
        this.gameRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    start() {
        // Initialize snake in the center
        const startX = Math.floor(this.gridWidth / 2);
        const startY = Math.floor(this.gridHeight / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.speed = 100;
        this.gameOver = false;
        this.gameRunning = true;

        this.spawnFood();
        this.lastTime = performance.now();
        this.gameLoop();
    }

    spawnFood() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.gridWidth);
            y = Math.floor(Math.random() * this.gridHeight);
        } while (this.snake.some(segment => segment.x === x && segment.y === y));

        this.food = { x, y };
    }

    update() {
        this.direction = this.nextDirection;

        // Calculate new head position
        const head = { ...this.snake[0] };
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        // Check wall collision
        if (head.x < 0 || head.x >= this.gridWidth ||
            head.y < 0 || head.y >= this.gridHeight) {
            this.endGame();
            return;
        }

        // Check self collision
        if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            this.endGame();
            return;
        }

        // Add new head
        this.snake.unshift(head);

        // Check food collision
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            // Speed up slightly
            if (this.speed > 50) {
                this.speed -= 2;
            }
            this.spawnFood();
        } else {
            // Remove tail if no food eaten
            this.snake.pop();
        }
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
    }

    draw() {
        // Clear canvas with dark background
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid lines (subtle)
        this.ctx.strokeStyle = '#252545';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Draw food
        if (this.food) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.beginPath();
            const foodX = this.food.x * this.gridSize + this.gridSize / 2;
            const foodY = this.food.y * this.gridSize + this.gridSize / 2;
            this.ctx.arc(foodX, foodY, this.gridSize / 2 - 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Food shine
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.beginPath();
            this.ctx.arc(foodX - 3, foodY - 3, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            const x = segment.x * this.gridSize;
            const y = segment.y * this.gridSize;

            // Gradient from head to tail
            const hue = 120; // Green
            const saturation = 70;
            const lightness = 50 - (index / this.snake.length) * 20;
            this.ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

            // Rounded rectangle for each segment
            const radius = 4;
            const padding = 1;
            this.ctx.beginPath();
            this.ctx.roundRect(
                x + padding,
                y + padding,
                this.gridSize - padding * 2,
                this.gridSize - padding * 2,
                radius
            );
            this.ctx.fill();

            // Draw eyes on head
            if (index === 0) {
                this.ctx.fillStyle = '#FFF';
                let eyeOffsetX = 4, eyeOffsetY = 4;
                if (this.direction === 'up') { eyeOffsetX = 4; eyeOffsetY = 4; }
                else if (this.direction === 'down') { eyeOffsetX = 4; eyeOffsetY = 10; }
                else if (this.direction === 'left') { eyeOffsetX = 4; eyeOffsetY = 6; }
                else if (this.direction === 'right') { eyeOffsetX = 10; eyeOffsetY = 6; }

                // Left eye
                this.ctx.beginPath();
                this.ctx.arc(x + eyeOffsetX, y + eyeOffsetY, 3, 0, Math.PI * 2);
                this.ctx.fill();

                // Right eye
                this.ctx.beginPath();
                if (this.direction === 'up' || this.direction === 'down') {
                    this.ctx.arc(x + this.gridSize - eyeOffsetX, y + eyeOffsetY, 3, 0, Math.PI * 2);
                } else {
                    this.ctx.arc(x + eyeOffsetX, y + this.gridSize - eyeOffsetY, 3, 0, Math.PI * 2);
                }
                this.ctx.fill();

                // Pupils
                this.ctx.fillStyle = '#000';
                this.ctx.beginPath();
                this.ctx.arc(x + eyeOffsetX, y + eyeOffsetY, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                if (this.direction === 'up' || this.direction === 'down') {
                    this.ctx.arc(x + this.gridSize - eyeOffsetX, y + eyeOffsetY, 1.5, 0, Math.PI * 2);
                } else {
                    this.ctx.arc(x + eyeOffsetX, y + this.gridSize - eyeOffsetY, 1.5, 0, Math.PI * 2);
                }
                this.ctx.fill();
            }
        });

        // Draw HUD
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px "Tahoma", sans-serif';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`High Score: ${this.highScore}`, this.width - 10, 25);

        // Game over screen
        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = 'bold 32px "Tahoma", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 30);

            this.ctx.fillStyle = '#FFF';
            this.ctx.font = '18px "Tahoma", sans-serif';
            this.ctx.fillText(`Score: ${this.score}`, this.width / 2, this.height / 2 + 5);

            if (this.score === this.highScore && this.score > 0) {
                this.ctx.fillStyle = '#f1c40f';
                this.ctx.fillText('NEW HIGH SCORE!', this.width / 2, this.height / 2 + 30);
            }

            this.ctx.fillStyle = '#AAA';
            this.ctx.font = '14px "Tahoma", sans-serif';
            this.ctx.fillText('Press SPACE to play again', this.width / 2, this.height / 2 + 60);
        }
    }

    gameLoop(timestamp = 0) {
        if (!this.gameRunning && !this.gameOver) return;

        if (this.gameRunning) {
            if (timestamp - this.lastTime >= this.speed) {
                this.update();
                this.lastTime = timestamp;
            }
        }

        this.draw();

        this.animationId = requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Polyfill for roundRect if not supported
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

// Export for use
window.SnakeGame = SnakeGame;
