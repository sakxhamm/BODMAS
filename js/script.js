const GAME_CONFIG = {
  totalQuestions: 10,
  difficultyTime: {
    easy: 15,
    medium: 12,
    hard: 10
  },
  pointsPerCorrect: 10
};

const state = {
  difficulty: "easy",
  playerName: "",
  questionIndex: 0,
  score: 0,
  displayedScore: 0,
  streak: 0,
  currentQuestion: null,
  timerId: null,
  timeLeft: 0,
  questionTimeLimit: 15
};

const els = {
  startScreen: document.getElementById("start-screen"),
  gameScreen: document.getElementById("game-screen"),
  resultScreen: document.getElementById("result-screen"),
  playBtn: document.getElementById("play-btn"),
  restartBtn: document.getElementById("restart-btn"),
  menuBtn: document.getElementById("menu-btn"),
  backToMenuBtn: document.getElementById("back-to-menu-btn"),
  playerNameInput: document.getElementById("player-name"),
  nameError: document.getElementById("name-error"),
  bestScore: document.getElementById("best-score"),
  loadingOverlay: document.getElementById("loading-overlay"),
  difficultyBtns: [...document.querySelectorAll(".difficulty-btn")],
  questionCount: document.getElementById("question-count"),
  score: document.getElementById("score"),
  streak: document.getElementById("streak"),
  timer: document.getElementById("timer"),
  timerProgress: document.getElementById("timer-progress"),
  question: document.getElementById("question"),
  options: document.getElementById("options"),
  feedback: document.getElementById("feedback"),
  explanation: document.getElementById("explanation"),
  finalScore: document.getElementById("final-score"),
  resultMessage: document.getElementById("result-message"),
  leaderboardList: document.getElementById("leaderboard-list"),
  scoreBadge: document.getElementById("score-badge"),
  streakPop: document.getElementById("streak-pop"),
  resultBadge: document.getElementById("result-badge"),
  confettiCanvas: document.getElementById("confetti-canvas")
};

const explanationByOperation = {
  plusMinus: "Addition and subtraction are solved after multiplication/division, from left to right.",
  multiplyDivide: "Multiplication/division happen before addition/subtraction.",
  brackets: "Brackets are solved first, then remaining operations using BODMAS."
};

const audioFiles = {
  correct: "assets/sounds/correct.mp3",
  wrong: "assets/sounds/wrong.mp3",
  gameOver: "assets/sounds/game-over.mp3"
};

const preloadedAudio = {};
let audioContext;

function init() {
  bindEvents();
  updateBestScoreUI();
  renderLeaderboard();
}

function bindEvents() {
  els.playBtn.addEventListener("click", startGame);
  els.restartBtn.addEventListener("click", resetToStart);
  els.menuBtn.addEventListener("click", resetToStart);
  els.backToMenuBtn.addEventListener("click", resetToStart);
  els.playerNameInput.addEventListener("input", () => {
    els.nameError.textContent = "";
  });

  els.difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.difficulty;
      els.difficultyBtns.forEach((item) => item.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

async function startGame() {
  const name = sanitizeName(els.playerNameInput.value);
  if (!name) {
    els.nameError.textContent = "Please enter your name to begin.";
    els.playerNameInput.focus();
    return;
  }
  state.playerName = name;
  showLoading(true);

  state.questionIndex = 0;
  state.score = 0;
  state.displayedScore = 0;
  state.streak = 0;
  state.questionTimeLimit = GAME_CONFIG.difficultyTime[state.difficulty];
  updateHud();
  await wait(650);
  showLoading(false);
  showScreen("game");
  nextQuestion();
}

function resetToStart() {
  clearInterval(state.timerId);
  showLoading(false);
  showScreen("start");
  renderLeaderboard();
}

function showScreen(screen) {
  els.startScreen.classList.remove("active");
  els.gameScreen.classList.remove("active");
  els.resultScreen.classList.remove("active");

  if (screen === "start") {
    els.startScreen.classList.add("active");
  } else if (screen === "game") {
    els.gameScreen.classList.add("active");
  } else {
    els.resultScreen.classList.add("active");
  }
}

function nextQuestion() {
  if (state.questionIndex >= GAME_CONFIG.totalQuestions) {
    return endGame();
  }

  state.currentQuestion = generateQuestion(state.difficulty, state.questionIndex);
  renderQuestion(state.currentQuestion);
  state.questionIndex += 1;
  updateHud();
  startTimer();
}

function updateHud() {
  const currentQuestionNumber = Math.min(Math.max(state.questionIndex, 1), GAME_CONFIG.totalQuestions);
  els.questionCount.textContent = `${currentQuestionNumber}/${GAME_CONFIG.totalQuestions}`;
  animateScoreTo(state.score);
  els.streak.textContent = String(state.streak);
  els.scoreBadge.textContent = String(state.displayedScore);
}

function renderQuestion(questionObj) {
  els.question.textContent = questionObj.display;
  els.options.innerHTML = "";
  els.feedback.textContent = "";
  els.explanation.textContent = "";
  els.feedback.className = "feedback-text";

  questionObj.options.forEach((option) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = option;
    button.addEventListener("click", () => validateAnswer(option));
    els.options.appendChild(button);
  });
}

function startTimer() {
  clearInterval(state.timerId);
  state.timeLeft = state.questionTimeLimit;
  els.timer.textContent = String(state.timeLeft);
  updateTimerBar();

  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    els.timer.textContent = String(Math.max(state.timeLeft, 0));
    updateTimerBar();

    if (state.timeLeft <= 0) {
      clearInterval(state.timerId);
      lockOptions();
      state.streak = 0;
      els.feedback.textContent = "⌛ Time's up!";
      els.feedback.classList.add("bad");
      els.explanation.textContent = state.currentQuestion.explanation;
      playSound("wrong");
      setTimeout(nextQuestion, 1300);
    }
  }, 1000);
}

function updateTimerBar() {
  const progress = (state.timeLeft / state.questionTimeLimit) * 100;
  els.timerProgress.style.width = `${Math.max(progress, 0)}%`;
  els.timerProgress.classList.remove("medium", "low");
  if (progress <= 55 && progress > 25) {
    els.timerProgress.classList.add("medium");
  } else if (progress <= 25) {
    els.timerProgress.classList.add("low");
  }
}

function validateAnswer(selectedOption) {
  clearInterval(state.timerId);
  lockOptions();

  const isCorrect = Number(selectedOption) === state.currentQuestion.answer;
  const buttons = [...document.querySelectorAll(".option-btn")];

  buttons.forEach((btn) => {
    const value = Number(btn.textContent);
    if (value === state.currentQuestion.answer) {
      btn.classList.add("correct");
    }
  });

  if (isCorrect) {
    const streakBonus = state.streak >= 2 ? 5 : 0;
    state.score += GAME_CONFIG.pointsPerCorrect + streakBonus;
    state.streak += 1;
    els.feedback.textContent = streakBonus > 0 ? `✅ Correct! +${GAME_CONFIG.pointsPerCorrect} (+${streakBonus} streak bonus)` : "✅ Correct! +10";
    els.feedback.classList.add("good");
    showStreakAnimation();
    playSound("correct");
  } else {
    const selectedButton = buttons.find((btn) => Number(btn.textContent) === Number(selectedOption));
    if (selectedButton) selectedButton.classList.add("wrong");
    state.streak = 0;
    els.feedback.textContent = `❌ Wrong! Correct answer: ${state.currentQuestion.answer}`;
    els.feedback.classList.add("bad");
    triggerScreenShake();
    playSound("wrong");
  }

  els.explanation.textContent = state.currentQuestion.explanation;
  updateHud();
  setTimeout(nextQuestion, 1400);
}

function lockOptions() {
  [...document.querySelectorAll(".option-btn")].forEach((btn) => {
    btn.disabled = true;
  });
}

function endGame() {
  clearInterval(state.timerId);
  animateFinalScore(state.score);
  els.resultMessage.textContent = getResultMessage(state.score);
  els.resultBadge.textContent = state.score >= 100 ? "🎉 Bonus Unlocked: Math Master!" : "✨ Keep practicing for a mastery badge!";
  updateLeaderboard(state.score, state.difficulty, state.playerName);
  persistBestScore(state.score);
  renderLeaderboard();
  showScreen("result");
  if (state.score >= 90) {
    launchConfetti();
  }
  playSound("gameOver");
  saveScoreToBackend(state.playerName, state.score);
}

function getResultMessage(score) {
  if (score >= 110) return "Legendary! Your BODMAS skills are elite. 👑";
  if (score >= 80) return "Great job! You have solid order-of-operations mastery. 💪";
  if (score >= 50) return "Nice effort! Keep practicing to improve speed and accuracy. 📘";
  return "Good start! Try again and focus on BODMAS steps carefully. 🚀";
}

function generateQuestion(difficulty, index) {
  const phase = index >= 6 ? 2 : index >= 3 ? 1 : 0;
  if (difficulty === "easy") return generateEasyQuestion(phase);
  if (difficulty === "medium") return generateMediumQuestion(phase);
  return generateHardQuestion(phase);
}

function generateEasyQuestion(phase = 0) {
  const a = randInt(2, 12 + phase);
  const b = randInt(2, 12 + phase);
  const c = randInt(2, 12 + phase);
  const operationType = Math.random() > 0.5 ? "multiplyFirst" : "divideFirst";

  let expression;
  let answer;
  let explanation;

  if (operationType === "multiplyFirst") {
    expression = `${a} + ${b} × ${c}`;
    answer = a + b * c;
    explanation = explanationByOperation.multiplyDivide;
  } else {
    const dividend = b * c;
    expression = `${a} + ${dividend} ÷ ${b}`;
    answer = a + dividend / b;
    explanation = explanationByOperation.multiplyDivide;
  }

  return buildQuestion(expression, answer, explanation);
}

function generateMediumQuestion(phase = 0) {
  const a = randInt(1, 15 + phase * 2);
  const b = randInt(2, 10 + phase);
  const c = randInt(2, 10 + phase);
  const d = randInt(1, 10 + phase);
  const pattern = randInt(1, 2);
  let expression;
  let answer;

  if (pattern === 1) {
    expression = `${a} + ${b} × ${c} - ${d}`;
    answer = a + b * c - d;
  } else {
    const dividend = b * c;
    expression = `${a} + ${dividend} ÷ ${b} × ${d}`;
    answer = a + (dividend / b) * d;
  }

  return buildQuestion(expression, answer, explanationByOperation.plusMinus);
}

function generateHardQuestion(phase = 0) {
  const a = randInt(2, 12 + phase * 2);
  const b = randInt(2, 12 + phase * 2);
  const c = randInt(2, 10 + phase * 2);
  const d = randInt(3, 10 + phase * 2);
  const pattern = randInt(1, 2);
  let expression;
  let answer;

  if (pattern === 1) {
    const dividend = c * d;
    expression = `(${a} + ${b}) × ${c} - ${dividend} ÷ ${d}`;
    answer = (a + b) * c - dividend / d;
  } else {
    const dividend = b * c;
    const e = randInt(1, d - 1);
    expression = `${a} + (${dividend} ÷ ${b}) × (${d} - ${e})`;
    answer = a + (dividend / b) * (d - e);
  }

  return buildQuestion(expression, answer, explanationByOperation.brackets);
}

function buildQuestion(display, answer, explanation) {
  const options = generateOptions(answer);
  return {
    display,
    answer: Number(answer),
    options: shuffle(options).map((n) => Number(n)),
    explanation
  };
}

function generateOptions(correctAnswer) {
  const optionSet = new Set([Number(correctAnswer)]);
  while (optionSet.size < 4) {
    const offset = randInt(-12, 12);
    const candidate = Number(correctAnswer) + offset;
    if (candidate !== Number(correctAnswer)) optionSet.add(candidate);
  }
  return [...optionSet];
}

function shuffle(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateLeaderboard(score, difficulty, name) {
  const board = JSON.parse(localStorage.getItem("bodmasLeaderboard") || "[]");
  board.push({
    name,
    score,
    difficulty,
    date: new Date().toLocaleDateString()
  });
  board.sort((a, b) => b.score - a.score);
  const topFive = board.slice(0, 5);
  localStorage.setItem("bodmasLeaderboard", JSON.stringify(topFive));
}

async function renderLeaderboard() {
  const remoteBoard = await fetchLeaderboard();
  const board = remoteBoard.length ? remoteBoard : JSON.parse(localStorage.getItem("bodmasLeaderboard") || "[]");
  els.leaderboardList.innerHTML = "";
  if (!board.length) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "No scores yet. Play your first battle!";
    els.leaderboardList.appendChild(empty);
    return;
  }

  board.slice(0, 10).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";

    const normalizedName = entry.name || "Player";
    if (normalizedName.toLowerCase() === state.playerName.toLowerCase() && Number(entry.score) === Number(state.score)) {
      row.classList.add("me");
    }

    const rank = index + 1;
    const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    const crown = rank === 1 ? "👑" : "";

    row.innerHTML = `
      <div class="leaderboard-rank">${rankLabel}</div>
      <div class="leaderboard-name">${crown}<span>${escapeHtml(normalizedName)}</span></div>
      <div class="leaderboard-score">${Number(entry.score)} pts</div>
    `;
    els.leaderboardList.appendChild(row);
  });
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

async function saveScoreToBackend(name, score) {
  try {
    await sendScore(name, score);
    await renderLeaderboard();
  } catch (error) {
    // If PHP backend is not enabled, local leaderboard still works.
  }
}

function playSound(type) {
  if (!preloadedAudio[type]) {
    preloadedAudio[type] = new Audio(audioFiles[type]);
  }
  preloadedAudio[type].currentTime = 0;
  preloadedAudio[type].play().catch(() => {
    synthFallback(type);
  });
}

function animateScoreTo(targetScore) {
  const from = state.displayedScore;
  const to = targetScore;
  if (from === to) return;

  const duration = 240;
  const start = performance.now();

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    state.displayedScore = Math.round(from + (to - from) * progress);
    els.score.textContent = String(state.displayedScore);
    els.scoreBadge.textContent = String(state.displayedScore);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      els.score.classList.add("score-pop");
      els.scoreBadge.classList.add("score-pop");
      setTimeout(() => {
        els.score.classList.remove("score-pop");
        els.scoreBadge.classList.remove("score-pop");
      }, 220);
    }
  };

  requestAnimationFrame(step);
}

function showStreakAnimation() {
  if (state.streak >= 3) {
    const label = state.streak >= 5 ? `x${state.streak} MEGA!` : `x${state.streak} STREAK!`;
    els.streakPop.textContent = label;
    els.streakPop.classList.remove("streak-burst");
    void els.streakPop.offsetWidth;
    els.streakPop.classList.add("streak-burst");
  } else {
    els.streakPop.textContent = "";
  }
}

function triggerScreenShake() {
  els.gameScreen.style.animation = "none";
  void els.gameScreen.offsetWidth;
  els.gameScreen.style.animation = "shake 0.35s ease";
  setTimeout(() => {
    els.gameScreen.style.animation = "";
  }, 360);
}

function animateFinalScore(target) {
  const duration = 650;
  const start = performance.now();
  const from = 0;

  const run = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(from + (target - from) * progress);
    els.finalScore.textContent = String(value);
    if (progress < 1) requestAnimationFrame(run);
  };

  requestAnimationFrame(run);
}

function launchConfetti() {
  const canvas = els.confettiCanvas;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const pieces = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.4,
    size: 4 + Math.random() * 8,
    speedY: 1 + Math.random() * 2.8,
    speedX: -1 + Math.random() * 2,
    color: ["#f59e0b", "#22c55e", "#06b6d4", "#f43f5e", "#a78bfa"][Math.floor(Math.random() * 5)]
  }));

  let frames = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size * 0.6);
    });
    frames += 1;
    if (frames < 180) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
}

function showLoading(isVisible) {
  els.loadingOverlay.classList.toggle("active", isVisible);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeName(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 18);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function persistBestScore(score) {
  const prev = Number(localStorage.getItem("bodmasBestScore") || 0);
  if (score > prev) {
    localStorage.setItem("bodmasBestScore", String(score));
  }
  updateBestScoreUI();
}

function updateBestScoreUI() {
  els.bestScore.textContent = String(Number(localStorage.getItem("bodmasBestScore") || 0));
}

function synthFallback(type) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const tones = {
    correct: 640,
    wrong: 220,
    gameOver: 140
  };

  oscillator.frequency.value = tones[type] || 300;
  gainNode.gain.value = 0.1;
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.16);
}

init();
