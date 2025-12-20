// ===== ASTEROIDS GAME =====
class AsteroidsGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.gameRunning = false;
        this.score = 0;
        this.lives = 3;
        this.level = 1;

        // Ship
        this.ship = {
            x: this.width / 2,
            y: this.height / 2,
            angle: -Math.PI / 2,
            velocity: { x: 0, y: 0 },
            radius: 12,
            thrust: false,
            rotatingLeft: false,
            rotatingRight: false
        };

        // Bullets
        this.bullets = [];
        this.bulletCooldown = 0;

        // Asteroids
        this.asteroids = [];

        // Particles for effects
        this.particles = [];

        // Controls
        this.keys = {};
        this.setupControls();
    }

    setupControls() {
        this.keydownHandler = (e) => {
            if (!this.gameRunning) return;
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
            }
        };

        this.keyupHandler = (e) => {
            this.keys[e.key] = false;
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    destroy() {
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
        this.gameRunning = false;
    }

    start() {
        this.score = 0;
        this.lives = 3;
        this.level = 1;
        this.ship.x = this.width / 2;
        this.ship.y = this.height / 2;
        this.ship.velocity = { x: 0, y: 0 };
        this.ship.angle = -Math.PI / 2;
        this.bullets = [];
        this.asteroids = [];
        this.particles = [];
        this.spawnAsteroids(4);
        this.gameRunning = true;
        this.gameLoop();
    }

    spawnAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let x, y;
            do {
                x = Math.random() * this.width;
                y = Math.random() * this.height;
            } while (this.distance(x, y, this.ship.x, this.ship.y) < 100);

            this.asteroids.push({
                x: x,
                y: y,
                velocity: {
                    x: (Math.random() - 0.5) * 2,
                    y: (Math.random() - 0.5) * 2
                },
                radius: 30 + Math.random() * 10,
                vertices: this.generateAsteroidVertices(),
                rotation: 0,
                rotationSpeed: (Math.random() - 0.5) * 0.02
            });
        }
    }

    generateAsteroidVertices() {
        const vertices = [];
        const numVertices = 8 + Math.floor(Math.random() * 4);
        for (let i = 0; i < numVertices; i++) {
            const angle = (i / numVertices) * Math.PI * 2;
            const radius = 0.7 + Math.random() * 0.3;
            vertices.push({ angle, radius });
        }
        return vertices;
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    update() {
        // Ship rotation
        if (this.keys['ArrowLeft'] || this.keys['a']) {
            this.ship.angle -= 0.08;
        }
        if (this.keys['ArrowRight'] || this.keys['d']) {
            this.ship.angle += 0.08;
        }

        // Ship thrust
        if (this.keys['ArrowUp'] || this.keys['w']) {
            this.ship.velocity.x += Math.cos(this.ship.angle) * 0.15;
            this.ship.velocity.y += Math.sin(this.ship.angle) * 0.15;
            this.ship.thrust = true;

            // Thrust particles
            if (Math.random() < 0.5) {
                this.particles.push({
                    x: this.ship.x - Math.cos(this.ship.angle) * 15,
                    y: this.ship.y - Math.sin(this.ship.angle) * 15,
                    velocity: {
                        x: -Math.cos(this.ship.angle) * 3 + (Math.random() - 0.5),
                        y: -Math.sin(this.ship.angle) * 3 + (Math.random() - 0.5)
                    },
                    life: 20,
                    color: '#FFA500'
                });
            }
        } else {
            this.ship.thrust = false;
        }

        // Shooting
        if (this.keys[' '] && this.bulletCooldown <= 0) {
            this.bullets.push({
                x: this.ship.x + Math.cos(this.ship.angle) * 15,
                y: this.ship.y + Math.sin(this.ship.angle) * 15,
                velocity: {
                    x: Math.cos(this.ship.angle) * 8 + this.ship.velocity.x * 0.5,
                    y: Math.sin(this.ship.angle) * 8 + this.ship.velocity.y * 0.5
                },
                life: 50
            });
            this.bulletCooldown = 10;
        }
        this.bulletCooldown--;

        // Apply friction and max speed
        this.ship.velocity.x *= 0.99;
        this.ship.velocity.y *= 0.99;
        const maxSpeed = 6;
        const speed = Math.sqrt(this.ship.velocity.x ** 2 + this.ship.velocity.y ** 2);
        if (speed > maxSpeed) {
            this.ship.velocity.x = (this.ship.velocity.x / speed) * maxSpeed;
            this.ship.velocity.y = (this.ship.velocity.y / speed) * maxSpeed;
        }

        // Move ship
        this.ship.x += this.ship.velocity.x;
        this.ship.y += this.ship.velocity.y;

        // Wrap ship
        if (this.ship.x < 0) this.ship.x = this.width;
        if (this.ship.x > this.width) this.ship.x = 0;
        if (this.ship.y < 0) this.ship.y = this.height;
        if (this.ship.y > this.height) this.ship.y = 0;

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.velocity.x;
            bullet.y += bullet.velocity.y;
            bullet.life--;

            // Wrap bullets
            if (bullet.x < 0) bullet.x = this.width;
            if (bullet.x > this.width) bullet.x = 0;
            if (bullet.y < 0) bullet.y = this.height;
            if (bullet.y > this.height) bullet.y = 0;

            return bullet.life > 0;
        });

        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.x += asteroid.velocity.x;
            asteroid.y += asteroid.velocity.y;
            asteroid.rotation += asteroid.rotationSpeed;

            // Wrap asteroids
            if (asteroid.x < -asteroid.radius) asteroid.x = this.width + asteroid.radius;
            if (asteroid.x > this.width + asteroid.radius) asteroid.x = -asteroid.radius;
            if (asteroid.y < -asteroid.radius) asteroid.y = this.height + asteroid.radius;
            if (asteroid.y > this.height + asteroid.radius) asteroid.y = -asteroid.radius;
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.velocity.x;
            particle.y += particle.velocity.y;
            particle.life--;
            return particle.life > 0;
        });

        // Bullet-asteroid collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                if (this.distance(this.bullets[i].x, this.bullets[i].y,
                    this.asteroids[j].x, this.asteroids[j].y) < this.asteroids[j].radius) {

                    // Explosion particles
                    for (let k = 0; k < 10; k++) {
                        this.particles.push({
                            x: this.asteroids[j].x,
                            y: this.asteroids[j].y,
                            velocity: {
                                x: (Math.random() - 0.5) * 4,
                                y: (Math.random() - 0.5) * 4
                            },
                            life: 30,
                            color: '#888'
                        });
                    }

                    // Split asteroid
                    if (this.asteroids[j].radius > 15) {
                        for (let k = 0; k < 2; k++) {
                            this.asteroids.push({
                                x: this.asteroids[j].x,
                                y: this.asteroids[j].y,
                                velocity: {
                                    x: (Math.random() - 0.5) * 3,
                                    y: (Math.random() - 0.5) * 3
                                },
                                radius: this.asteroids[j].radius / 2,
                                vertices: this.generateAsteroidVertices(),
                                rotation: 0,
                                rotationSpeed: (Math.random() - 0.5) * 0.04
                            });
                        }
                    }

                    this.score += Math.floor(50 / this.asteroids[j].radius * 10);
                    this.asteroids.splice(j, 1);
                    this.bullets.splice(i, 1);
                    break;
                }
            }
        }

        // Ship-asteroid collisions
        for (let asteroid of this.asteroids) {
            if (this.distance(this.ship.x, this.ship.y, asteroid.x, asteroid.y) < asteroid.radius + this.ship.radius) {
                this.lives--;

                // Explosion
                for (let k = 0; k < 20; k++) {
                    this.particles.push({
                        x: this.ship.x,
                        y: this.ship.y,
                        velocity: {
                            x: (Math.random() - 0.5) * 6,
                            y: (Math.random() - 0.5) * 6
                        },
                        life: 40,
                        color: '#FFF'
                    });
                }

                // Reset ship
                this.ship.x = this.width / 2;
                this.ship.y = this.height / 2;
                this.ship.velocity = { x: 0, y: 0 };

                if (this.lives <= 0) {
                    this.gameRunning = false;
                }
                break;
            }
        }

        // Level complete
        if (this.asteroids.length === 0) {
            this.level++;
            this.spawnAsteroids(3 + this.level);
        }
    }

    draw() {
        // Clear
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.life / 40;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Draw asteroids
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 2;
        this.asteroids.forEach(asteroid => {
            this.ctx.save();
            this.ctx.translate(asteroid.x, asteroid.y);
            this.ctx.rotate(asteroid.rotation);
            this.ctx.beginPath();
            asteroid.vertices.forEach((v, i) => {
                const x = Math.cos(v.angle) * asteroid.radius * v.radius;
                const y = Math.sin(v.angle) * asteroid.radius * v.radius;
                if (i === 0) this.ctx.moveTo(x, y);
                else this.ctx.lineTo(x, y);
            });
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        });

        // Draw bullets
        this.ctx.fillStyle = '#FFF';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw ship
        this.ctx.save();
        this.ctx.translate(this.ship.x, this.ship.y);
        this.ctx.rotate(this.ship.angle);

        this.ctx.strokeStyle = '#FFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0);
        this.ctx.lineTo(-10, -8);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.stroke();

        // Thrust flame
        if (this.ship.thrust) {
            this.ctx.strokeStyle = '#FFA500';
            this.ctx.beginPath();
            this.ctx.moveTo(-5, -4);
            this.ctx.lineTo(-15 - Math.random() * 5, 0);
            this.ctx.lineTo(-5, 4);
            this.ctx.stroke();
        }

        this.ctx.restore();

        // Draw HUD
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '16px "Tahoma", sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, 10, 25);
        this.ctx.fillText(`Lives: ${this.lives}`, 10, 45);
        this.ctx.fillText(`Level: ${this.level}`, 10, 65);

        // Game over
        if (!this.gameRunning && this.lives <= 0) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = 'bold 32px "Tahoma", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2 - 20);
            this.ctx.font = '18px "Tahoma", sans-serif';
            this.ctx.fillText(`Final Score: ${this.score}`, this.width / 2, this.height / 2 + 15);
            this.ctx.fillText('Press SPACE to play again', this.width / 2, this.height / 2 + 45);
            this.ctx.textAlign = 'left';

            if (this.keys[' ']) {
                this.start();
            }
        }
    }

    gameLoop() {
        if (!this.gameRunning && this.lives > 0) return;

        this.update();
        this.draw();

        if (this.gameRunning || this.lives <= 0) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

// Export for use
window.AsteroidsGame = AsteroidsGame;
