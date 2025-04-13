const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const gameContainer = document.querySelector('.game-container');

// Create high score element
const scoreContainer = document.createElement('div');
scoreContainer.className = 'score-container';
const highScoreElement = document.createElement('div');
highScoreElement.id = 'highscore';
gameContainer.appendChild(scoreContainer);
scoreContainer.appendChild(scoreElement);
scoreContainer.appendChild(highScoreElement);

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game objects
const slime = {
    x: canvas.width / 2,
    y: canvas.height - 25,
    width: 100,
    height: 50,
    speed: 5,
    color: '#0ff'
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 20,
    dx: 0,
    dy: 0,
    rotation: 0,
    lastHit: 0,
    glowSize: 20
};

let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let gameStarted = false;
let keys = {};

// Update high score display
highScoreElement.textContent = `HIGH ${highScore}`;

function createHitFlash() {
    const flash = document.createElement('div');
    flash.className = 'hit-flash';
    gameContainer.appendChild(flash);
    setTimeout(() => flash.remove(), 150);
}

function triggerQuake() {
    scoreContainer.classList.add('quake');
    gameContainer.classList.add('quake');
    
    setTimeout(() => {
        scoreContainer.classList.remove('quake');
        gameContainer.classList.remove('quake');
    }, 500);
}

function drawSoccerBall(x, y, radius, rotation) {
    // Main ball circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Save the current context state
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw pentagon pattern
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Draw hexagon pattern
    const segments = 6;
    const angleStep = (Math.PI * 2) / segments;
    
    for (let i = 0; i < segments; i++) {
        const angle = i * angleStep;
        const nextAngle = angle + angleStep;
        const midRadius = radius * 0.7;
        
        // Draw connecting lines
        ctx.beginPath();
        ctx.moveTo(radius * Math.cos(angle), radius * Math.sin(angle));
        ctx.lineTo(midRadius * Math.cos(angle + angleStep/2), midRadius * Math.sin(angle + angleStep/2));
        ctx.lineTo(radius * Math.cos(nextAngle), radius * Math.sin(nextAngle));
        ctx.stroke();
    }
    
    // Restore the context state
    ctx.restore();
}

// Event listeners
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (!gameStarted && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        startGame();
    }
});
document.addEventListener('keyup', (e) => keys[e.key] = false);
canvas.addEventListener('click', startGame);

function startGame() {
    if (!gameStarted) {
        gameStarted = true;
        ball.dy = -12;
        score = 0;
        scoreElement.textContent = score;
        requestAnimationFrame(gameLoop);
    }
}

function handleMovement() {
    if (keys['ArrowLeft']) {
        slime.x = Math.max(0, slime.x - slime.speed);
    }
    if (keys['ArrowRight']) {
        slime.x = Math.min(canvas.width - slime.width, slime.x + slime.speed);
    }
}

function drawSlime() {
    ctx.shadowBlur = 20;
    ctx.shadowColor = slime.color;
    
    ctx.fillStyle = slime.color;
    ctx.beginPath();
    ctx.arc(slime.x + slime.width/2, slime.y, slime.width/2, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function drawBall() {
    ctx.shadowBlur = ball.glowSize;
    ctx.shadowColor = '#ffffff';
    drawSoccerBall(ball.x, ball.y, ball.radius, ball.rotation);
    ctx.shadowBlur = 0;
}

function updateBall() {
    ball.dy += 0.2;
    
    ball.x += ball.dx;
    ball.y += ball.dy;
    
    // Update rotation based on horizontal and vertical movement
    const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.rotation += speed * 0.05;
    
    if (ball.glowSize > 20) {
        ball.glowSize = Math.max(20, ball.glowSize - 2);
    }
    
    if (ball.x - ball.radius < 0) {
        ball.dx = Math.abs(ball.dx) * 0.8;
        ball.x = ball.radius;
    } else if (ball.x + ball.radius > canvas.width) {
        ball.dx = -Math.abs(ball.dx) * 0.8;
        ball.x = canvas.width - ball.radius;
    }
    
    const currentTime = Date.now();
    if (ball.y + ball.radius > slime.y - slime.height/2 &&
        ball.y - ball.radius < slime.y + slime.height/2 &&
        ball.x + ball.radius > slime.x &&
        ball.x - ball.radius < slime.x + slime.width &&
        currentTime - ball.lastHit > 100) {
        
        ball.dy = -12;
        ball.dx = (ball.x - (slime.x + slime.width/2)) * 0.08;
        score++;
        scoreElement.textContent = score;
        ball.lastHit = currentTime;
        
        // Update high score if needed
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
            highScoreElement.textContent = `HIGH ${highScore}`;
        }
        
        createHitFlash();
        ball.glowSize = 40;
    }
    
    if (ball.y + ball.radius > canvas.height) {
        gameStarted = false;
        ball.y = canvas.height / 2;
        ball.x = canvas.width / 2;
        ball.dx = 0;
        ball.dy = 0;
        ball.rotation = 0;
        triggerQuake();
    }
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    handleMovement();
    drawSlime();
    drawBall();
    updateBall();
    
    if (gameStarted) {
        requestAnimationFrame(gameLoop);
    }
}

// Initial draw
drawSlime();
drawBall(); 