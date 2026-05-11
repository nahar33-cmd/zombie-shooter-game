const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Variables
let gameRunning = true;
let gameOver = false;
let score = 0;
let level = 1;
let wave = 1;
let enemiesDefeated = 0;

// Player (Zombie)
const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 15,
    maxHealth: 100,
    health: 100,
    speed: 4,
    attackRange: 50,
    attackCooldown: 0,
    maxAttackCooldown: 30
};

// Enemies (Humans with guns)
let enemies = [];

// Bullets
let bullets = [];

// Particles
let particles = [];

// Keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// Mouse input
let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;
let isAttacking = false;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    isAttacking = true;
});

canvas.addEventListener('mouseup', () => {
    isAttacking = false;
});

// Enemy class
class Enemy {
    constructor(x, y, health) {
        this.x = x;
        this.y = y;
        this.radius = 12;
        this.maxHealth = health;
        this.health = health;
        this.speed = 1.5;
        this.shootCooldown = 0;
        this.maxShootCooldown = 60;
        this.width = 20;
        this.height = 30;
    }

    update() {
        // Move towards player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Shoot at player
        this.shootCooldown--;
        if (this.shootCooldown <= 0) {
            this.shoot();
            this.shootCooldown = this.maxShootCooldown;
        }
    }

    shoot() {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            const bullet = {
                x: this.x + (dx / distance) * 20,
                y: this.y + (dy / distance) * 20,
                vx: (dx / distance) * 4,
                vy: (dy / distance) * 4,
                radius: 4,
                damage: 10
            };
            bullets.push(bullet);
        }
    }

    draw() {
        // Draw body
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

        // Draw head
        ctx.fillStyle = '#ffaa99';
        ctx.beginPath();
        ctx.arc(this.x, this.y - this.height / 2 - 8, 8, 0, Math.PI * 2);
        ctx.fill();

        // Draw gun
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x + 8, this.y - 5);
        ctx.lineTo(this.x + 20, this.y - 8);
        ctx.stroke();

        // Draw health bar
        const barWidth = 30;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 20, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x - barWidth / 2, this.y - this.height / 2 - 20, barWidth * healthPercent, barHeight);
    }
}

// Bullet class
class Bullet {
    constructor(x, y, vx, vy, radius, damage) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.damage = damage;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw() {
        if (this.radius > 3) {
            // Enemy bullet (from humans)
            ctx.fillStyle = '#ffff00';
        } else {
            // Zombie attack (close range)
            ctx.fillStyle = '#ff00ff';
        }
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    isOutOfBounds() {
        return this.x < -20 || this.x > canvas.width + 20 || this.y < -20 || this.y > canvas.height + 20;
    }
}

// Particle class
class Particle {
    constructor(x, y, vx, vy, color, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.2; // Gravity
        this.life--;
    }

    draw() {
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Initialize enemies
function spawnEnemies() {
    enemies = [];
    const enemyCount = 2 + wave;
    const health = 30 + (wave * 10);

    for (let i = 0; i < enemyCount; i++) {
        let x, y, distance;
        do {
            x = Math.random() * (canvas.width - 100) + 50;
            y = Math.random() * (canvas.height - 100) + 50;
            distance = Math.sqrt((x - player.x) ** 2 + (y - player.y) ** 2);
        } while (distance < 150);

        enemies.push(new Enemy(x, y, health));
    }
}

// Update player
function updatePlayer() {
    const moveSpeed = player.speed;
    let moving = false;

    if (keys['w'] || keys['arrowup']) {
        player.y -= moveSpeed;
        moving = true;
    }
    if (keys['s'] || keys['arrowdown']) {
        player.y += moveSpeed;
        moving = true;
    }
    if (keys['a'] || keys['arrowleft']) {
        player.x -= moveSpeed;
        moving = true;
    }
    if (keys['d'] || keys['arrowright']) {
        player.x += moveSpeed;
        moving = true;
    }

    // Keep player in bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

    // Attack cooldown
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    }

    // Handle attacks
    if (isAttacking && player.attackCooldown <= 0) {
        performAttack();
        player.attackCooldown = player.maxAttackCooldown;
    }
}

// Perform claw attack
function performAttack() {
    // Create attack particles
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const vx = Math.cos(angle) * 6;
        const vy = Math.sin(angle) * 6;
        particles.push(new Particle(player.x, player.y, vx, vy, '#ff0000', 20));
    }

    // Check for enemy hits
    for (let enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.attackRange + enemy.radius) {
            enemy.health -= 20;
            
            // Knockback
            if (distance > 0) {
                enemy.x += (dx / distance) * 30;
                enemy.y += (dy / distance) * 30;
            }

            // Blood particles
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2;
                const vx = Math.cos(angle) * 4;
                const vy = Math.sin(angle) * 4;
                particles.push(new Particle(enemy.x, enemy.y, vx, vy, '#cc0000', 30));
            }
        }
    }
}

// Update game
function update() {
    if (!gameRunning) return;

    updatePlayer();

    // Update enemies
    for (let enemy of enemies) {
        enemy.update();
    }

    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].update();

        // Check collision with player
        const dx = bullets[i].x - player.x;
        const dy = bullets[i].y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.radius + bullets[i].radius && bullets[i].radius > 3) {
            player.health -= bullets[i].damage;
            
            // Blood particles
            for (let j = 0; j < 10; j++) {
                const angle = Math.random() * Math.PI * 2;
                const vx = Math.cos(angle) * 5;
                const vy = Math.sin(angle) * 5;
                particles.push(new Particle(player.x, player.y, vx, vy, '#ff0000', 40));
            }

            bullets.splice(i, 1);
            continue;
        }

        if (bullets[i].isOutOfBounds()) {
            bullets.splice(i, 1);
        }
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }

    // Remove dead enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].health <= 0) {
            score += 100 * level;
            enemiesDefeated++;
            enemies.splice(i, 1);
        }
    }

    // Check win condition
    if (enemies.length === 0 && gameRunning) {
        wave++;
        level = Math.floor(wave / 2) + 1;
        spawnEnemies();
    }

    // Check lose condition
    if (player.health <= 0) {
        gameRunning = false;
        endGame();
    }

    updateUI();
}

// Draw game
function draw() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }

    // Draw attack range indicator
    if (isAttacking) {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw player
    drawZombie(player.x, player.y);

    // Draw aim indicator
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
    }

    // Draw enemies
    for (let enemy of enemies) {
        enemy.draw();
    }

    // Draw bullets
    for (let bullet of bullets) {
        bullet.draw();
    }

    // Draw particles
    for (let particle of particles) {
        particle.draw();
    }
}

function drawZombie(x, y) {
    // Body
    ctx.fillStyle = '#55aa55';
    ctx.fillRect(x - 12, y - 10, 24, 25);

    // Head
    ctx.fillStyle = '#66bb66';
    ctx.beginPath();
    ctx.arc(x, y - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    // Left eye
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(x - 4, y - 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(x + 4, y - 20, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Eyes glow
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(x - 4, y - 20, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4, y - 20, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Mouth
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y - 15, 4, 0, Math.PI);
    ctx.stroke();

    // Left arm with claws
    ctx.strokeStyle = '#558855';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 5);
    ctx.lineTo(x - 25, y);
    ctx.stroke();

    // Left claws
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const offset = i - 1;
        ctx.beginPath();
        ctx.moveTo(x - 25, y + offset * 3);
        ctx.lineTo(x - 32, y + offset * 3 - 5);
        ctx.stroke();
    }

    // Right arm with claws
    ctx.strokeStyle = '#558855';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 12, y - 5);
    ctx.lineTo(x + 25, y);
    ctx.stroke();

    // Right claws
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
        const offset = i - 1;
        ctx.beginPath();
        ctx.moveTo(x + 25, y + offset * 3);
        ctx.lineTo(x + 32, y + offset * 3 - 5);
        ctx.stroke();
    }

    // Legs
    ctx.strokeStyle = '#558855';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 6, y + 15);
    ctx.lineTo(x - 6, y + 28);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 15);
    ctx.lineTo(x + 6, y + 28);
    ctx.stroke();
}

function updateUI() {
    // Update health bar
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('playerHealthBar').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = `${Math.max(0, player.health)} / ${player.maxHealth}`;

    // Update score and level
    document.getElementById('scoreDisplay').textContent = `KILLS: ${score}`;
    document.getElementById('levelDisplay').textContent = `LEVEL: ${level}`;

    // Update wave and enemy count
    document.getElementById('waveText').textContent = `WAVE ${wave}`;
    document.getElementById('enemyCount').textContent = `Enemies: ${enemies.length}`;

    // Display nearest enemy health
    if (enemies.length > 0) {
        let nearestEnemy = enemies[0];
        let nearestDistance = Infinity;
        for (let enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        }
        document.getElementById('enemyHealthDisplay').textContent = `Enemy Health: ${Math.max(0, nearestEnemy.health)}`;
    } else {
        document.getElementById('enemyHealthDisplay').textContent = `Wave Complete!`;
    }
}

function endGame() {
    gameOver = true;
    document.getElementById('gameOverScreen').style.display = 'block';
    document.getElementById('finalScore').textContent = `FINAL SCORE: ${score} | WAVES: ${wave} | ENEMIES DEFEATED: ${enemiesDefeated}`;
}

// Game loop
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start game
spawnEnemies();
gameLoop();