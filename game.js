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
function resizeCanvas() {
    const container = document.querySelector('.game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
}

// Initial resize
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game objects
const slime = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 50,
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
    glowSize: 20,
    gravity: 0.2,
    normalGravity: 0.2,
    specialGravity: 0.1,
    normalBounce: -12,
    specialBounce: -16
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

function createHatTrick() {
    const hatTrick = document.createElement('div');
    hatTrick.className = 'hat-trick';
    hatTrick.textContent = 'HAT-TRICK!';
    hatTrick.style.left = `${slime.x + slime.width/2}px`;
    hatTrick.style.top = `${slime.y}px`;
    gameContainer.appendChild(hatTrick);
    setTimeout(() => hatTrick.remove(), 1500);
}

function updatePulsation() {
    if (score % 10 === 0 && score > 0) {
        gameContainer.classList.add('enhanced-pulse');
    } else {
        gameContainer.classList.remove('enhanced-pulse');
    }
}

function updateBall() {
    ball.dy += ball.gravity;
    
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
        
        // Check if this is a special bounce (multiple of 10)
        const isSpecialBounce = score % 10 === 9; // Check if next score will be multiple of 10
        
        if (isSpecialBounce) {
            ball.gravity = ball.specialGravity;
            ball.dy = ball.specialBounce;
            // Reset gravity after a short delay
            setTimeout(() => {
                ball.gravity = ball.normalGravity;
            }, 1000);
        } else {
            ball.gravity = ball.normalGravity;
            ball.dy = ball.normalBounce;
        }
        
        // Add a subtle random horizontal movement to prevent perfect vertical bouncing
        const randomFactor = (Math.random() - 0.5) * 0.3; // Small random value between -0.15 and 0.15
        ball.dx = (ball.x - (slime.x + slime.width/2)) * 0.08 + randomFactor;
        
        score++;
        scoreElement.textContent = score;
        ball.lastHit = currentTime;
        
        // Check for hat-trick
        if (score % 3 === 0 && score > 0) {
            createHatTrick();
        }
        
        // Update pulsation effect
        updatePulsation();
        
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
        ball.gravity = ball.normalGravity; // Reset gravity on game over
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