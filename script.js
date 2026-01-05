// Simple Pong game
// Player controls left paddle with mouse and ArrowUp/ArrowDown
// Right paddle is simple AI

(function () {
  // Canvas setup
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Score elements
  const playerScoreEl = document.getElementById('playerScore');
  const computerScoreEl = document.getElementById('computerScore');
  const startBtn = document.getElementById('startBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Game constants
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 90;
  const PADDLE_MARGIN = 10;

  const BALL_RADIUS = 8;

  const WIN_SCORE = 11; // optional winning score (not enforced), used only if you want to detect end

  // Game state
  let playerScore = 0;
  let computerScore = 0;

  let isRunning = false;
  let lastTime = 0;

  // Player paddle state
  const player = {
    x: PADDLE_MARGIN,
    y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 6, // keyboard speed
    dy: 0,
  };

  // Computer paddle state
  const computer = {
    x: WIDTH - PADDLE_MARGIN - PADDLE_WIDTH,
    y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 4.0, // how fast the computer moves to track the ball
  };

  // Ball state
  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: BALL_RADIUS,
    speed: 6,
    vx: 6,
    vy: 2,
  };

  // Reset ball: center and send toward recent scorer or random
  function resetBall(direction) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    // direction: -1 to left, 1 to right, or random if undefined
    const dir = direction === -1 || direction === 1 ? direction : (Math.random() < 0.5 ? -1 : 1);
    const speed = 5 + Math.random() * 2;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8); // -22.5deg to 22.5deg
    ball.speed = speed;
    ball.vx = dir * speed * Math.cos(angle);
    ball.vy = speed * Math.sin(angle);
  }

  // Start / resume game
  function startGame() {
    if (!isRunning) {
      isRunning = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  // Reset scores and ball
  function resetGame() {
    playerScore = 0;
    computerScore = 0;
    updateScoreboard();
    resetBall(Math.random() < 0.5 ? -1 : 1);
    startGame();
  }

  // Game loop
  function loop(now) {
    if (!isRunning) return;
    const dt = (now - lastTime) / 1000; // seconds elapsed
    lastTime = now;

    update(dt);
    render();

    requestAnimationFrame(loop);
  }

  // Update game state
  function update(dt) {
    // Move player paddle by keyboard dy
    player.y += player.dy;

    // Clamp player paddle
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > HEIGHT) player.y = HEIGHT - player.height;

    // Simple AI: move computer paddle toward ball center with max speed
    const targetY = ball.y - (computer.height / 2);
    const diff = targetY - computer.y;
    const maxMove = computer.speed;
    if (Math.abs(diff) > maxMove) {
      computer.y += diff > 0 ? maxMove : -maxMove;
    } else {
      computer.y = targetY;
    }
    // Clamp computer
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > HEIGHT) computer.y = HEIGHT - computer.height;

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Wall collisions (top/bottom)
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
    }
    if (ball.y + ball.radius > HEIGHT) {
      ball.y = HEIGHT - ball.radius;
      ball.vy = -ball.vy;
    }

    // Check paddle collisions
    // Player paddle
    if (ball.x - ball.radius <= player.x + player.width) {
      if (ball.y >= player.y && ball.y <= player.y + player.height) {
        // collision
        ball.x = player.x + player.width + ball.radius; // push out to avoid sticking
        reflectBallFromPaddle(player);
      } else if (ball.x - ball.radius < 0) {
        // missed: computer scores
        computerScore++;
        updateScoreboard();
        resetBall(1); // send to right->left? Actually after computer scores we send to the scoring player's opponent: send to right
      }
    }

    // Computer paddle
    if (ball.x + ball.radius >= computer.x) {
      if (ball.y >= computer.y && ball.y <= computer.y + computer.height) {
        // collision
        ball.x = computer.x - ball.radius;
        reflectBallFromPaddle(computer);
      } else if (ball.x + ball.radius > WIDTH) {
        // missed: player scores
        playerScore++;
        updateScoreboard();
        resetBall(-1);
      }
    }

    // Optional: slowly increase difficulty by very slightly increasing ball speed over time or per hit
  }

  function reflectBallFromPaddle(paddle) {
    // Calculate hit position relative to paddle center [-1 .. 1]
    const relativeIntersectY = (paddle.y + paddle.height / 2) - ball.y;
    const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);

    // Bounce angle max 75 degrees
    const maxBounceAngle = (5 * Math.PI) / 12; // ~75 degrees
    const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;

    // Determine new direction based on which paddle: left paddle sends right (positive vx), right paddle sends left (negative vx)
    const direction = paddle === player ? 1 : -1;

    const speedIncrease = 0.25; // small speed kick on paddle hit
    ball.speed = Math.min(12, Math.hypot(ball.vx, ball.vy) + speedIncrease);

    ball.vx = direction * ball.speed * Math.cos(bounceAngle);
    ball.vy = -ball.speed * Math.sin(bounceAngle);
  }

  // Rendering
  function render() {
    // Clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // draw field (dashed center line)
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.setLineDash([6, 12]);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(WIDTH / 2, 10);
    ctx.lineTo(WIDTH / 2, HEIGHT - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // draw paddles
    drawRoundRect(player.x, player.y, player.width, player.height, 6, '#00d1ff');
    drawRoundRect(computer.x, computer.y, computer.width, computer.height, 6, '#ff7ca3');

    // draw ball
    ctx.fillStyle = '#f8f9fb';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // draw scores (also in DOM)
    // small HUD on canvas if desired (we already use DOM)
  }

  function drawRoundRect(x, y, w, h, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.fill();
  }

  function updateScoreboard() {
    playerScoreEl.textContent = playerScore;
    computerScoreEl.textContent = computerScore;
  }

  // Controls: mouse move over canvas controls paddle center
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    player.y = y - player.height / 2;
    // clamp
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > HEIGHT) player.y = HEIGHT - player.height;
  });

  // Keyboard controls
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      player.dy = -player.speed;
      keys['ArrowUp'] = true;
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      player.dy = player.speed;
      keys['ArrowDown'] = true;
      e.preventDefault();
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // pause/resume
      toggleRunning();
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
      keys['ArrowUp'] = false;
      if (!keys['ArrowDown']) player.dy = 0;
      else player.dy = player.speed;
    } else if (e.key === 'ArrowDown') {
      keys['ArrowDown'] = false;
      if (!keys['ArrowUp']) player.dy = 0;
      else player.dy = -player.speed;
    }
  });

  // Buttons
  startBtn.addEventListener('click', () => {
    toggleRunning();
  });
  resetBtn.addEventListener('click', () => {
    resetGame();
  });

  function toggleRunning() {
    isRunning = !isRunning;
    if (isRunning) {
      lastTime = performance.now();
      requestAnimationFrame(loop);
    }
  }

  // Initialize
  updateScoreboard();
  resetBall(Math.random() < 0.5 ? -1 : 1);
  // start automatically
  startGame();

  // Optional: expose some state for debugging
  window.pong = {
    player,
    computer,
    ball,
    resetBall,
    resetGame,
    startGame,
    stop: () => (isRunning = false),
  };
})();
