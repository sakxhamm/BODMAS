/**
 * BODMAS Lab – core engine: tokenized expressions, BODMAS priority, step generator, explanation generator.
 */

const PHASES = [
  { id: 1, short: "Concept", title: "Concept introduction" },
  { id: 2, short: "Why", title: "Why BODMAS matters" },
  { id: 3, short: "Rules", title: "Rule breakdown" },
  { id: 4, short: "Visual", title: "Step-by-step visual solver" },
  { id: 5, short: "Interactive", title: "Interactive learning" },
  { id: 6, short: "Practice", title: "Practice (MCQ)" },
  { id: 7, short: "Challenge", title: "Challenge mode" }
];

const MODE_BY_PHASE = {
  4: "learning",
  5: "interactive",
  6: "practice",
  7: "challenge"
};

const MODE_CONFIG = {
  learning: { label: "Visual solver", total: 6, timed: false },
  interactive: { label: "Interactive learning", total: 8, timed: false },
  practice: { label: "Practice", total: 10, timed: false },
  challenge: { label: "Challenge", total: 10, timed: true }
};

const EXPLAIN = {
  brackets: {
    what: "We simplify the part inside the brackets into one number.",
    why: "Bracketed work must be finished first so the rest of the expression has clear values to combine.",
    rule: "B — Brackets first",
    ruleText: "Brackets are solved first according to BODMAS rule."
  },
  multiplyDivide: {
    what: "We multiply or divide these two numbers next (left ÷ or × as selected by order).",
    why: "Multiplication and division are solved before addition and subtraction—otherwise answers disagree with standard maths.",
    rule: "D/M before A/S",
    ruleText: "Multiplication and division are solved before addition and subtraction according to BODMAS rule."
  },
  addSubtract: {
    what: "We add or subtract this pair, moving left to right with any other + or − that share the same priority.",
    why: "When only + and − remain, we work in reading order so everyone gets the same final result.",
    rule: "A/S last (left to right)",
    ruleText: "Addition and subtraction come after × and ÷; same-priority steps go left to right (BODMAS rule)."
  }
};

const OPERATION_TYPES = [
  { key: "addSubtract", label: "Addition / Subtraction" },
  { key: "multiplyDivide", label: "Multiplication / Division" },
  { key: "brackets", label: "Brackets" }
];

const audioFiles = {
  correct: "assets/sounds/correct.mp3",
  wrong: "assets/sounds/wrong.mp3",
  gameOver: "assets/sounds/game-over.mp3"
};

const state = {
  difficulty: "easy",
  playerName: "",
  sessionIndex: 0,
  score: 0,
  displayedScore: 0,
  streak: 0,
  timerId: null,
  timeLeft: 0,
  current: null,
  canAct: true,
  activePhase: 1,
  selectedMode: "learning",
  ruleSubStep: 1,
  sessionRecentPatterns: [],
  learningBusy: false,
  learningCooldownUntil: 0,
  journey: {
    maxUnlocked: 1,
    completed: {}
  }
};

const preloadedAudio = {};
let audioContext;

const els = {
  hubScreen: document.getElementById("hub-screen"),
  labScreen: document.getElementById("lab-screen"),
  gameScreen: document.getElementById("game-screen"),
  resultScreen: document.getElementById("result-screen"),
  journeyStrip: document.getElementById("journey-strip"),
  journeyMini: document.getElementById("journey-mini"),
  beginJourneyBtn: document.getElementById("begin-journey-btn"),
  labBackBtn: document.getElementById("lab-back-btn"),
  labPhaseBadge: document.getElementById("lab-phase-badge"),
  labPanel1: document.getElementById("lab-panel-1"),
  labPanel2: document.getElementById("lab-panel-2"),
  labPanel3: document.getElementById("lab-panel-3"),
  ruleSub1: document.getElementById("rule-sub-1"),
  ruleSub2: document.getElementById("rule-sub-2"),
  ruleSub3: document.getElementById("rule-sub-3"),
  completePhase1: document.getElementById("complete-phase-1"),
  completePhase2: document.getElementById("complete-phase-2"),
  completePhase3: document.getElementById("complete-phase-3"),
  playBtn: null,
  restartBtn: document.getElementById("restart-btn"),
  menuBtn: document.getElementById("menu-btn"),
  backToMenuBtn: document.getElementById("back-to-menu-btn"),
  nextStepBtn: document.getElementById("next-step-btn"),
  nextBtn: document.getElementById("next-expression-btn"),
  sessionProgressFill: document.getElementById("session-progress-fill"),
  hubProgressFill: document.getElementById("hub-progress-fill"),
  playerNameInput: document.getElementById("player-name"),
  nameError: document.getElementById("name-error"),
  bestScore: document.getElementById("best-score"),
  loadingOverlay: document.getElementById("loading-overlay"),
  difficultyBtns: [...document.querySelectorAll(".difficulty-btn")],
  questionCount: document.getElementById("question-count"),
  score: document.getElementById("score"),
  scoreBadge: document.getElementById("score-badge"),
  streak: document.getElementById("streak"),
  streakPop: document.getElementById("streak-pop"),
  hudProgressLabel: document.getElementById("hud-progress-label"),
  currentModeTitle: document.getElementById("current-mode-title"),
  learningMessage: document.getElementById("learning-message"),
  timerWrap: document.getElementById("timer-wrap"),
  timer: document.getElementById("timer"),
  timerProgress: document.getElementById("timer-progress"),
  questionLabel: document.getElementById("question-label"),
  expressionVisual: document.getElementById("expression-visual"),
  interactiveOptions: document.getElementById("interactive-options"),
  mcqOptions: document.getElementById("mcq-options"),
  feedback: document.getElementById("feedback"),
  stepExplanation: document.getElementById("step-explanation"),
  explanation: document.getElementById("explanation"),
  historyWrap: document.getElementById("history-wrap"),
  historyList: document.getElementById("history-list"),
  wrongPopup: document.getElementById("wrong-popup"),
  wrongPopupText: document.getElementById("wrong-popup-text"),
  finalScore: document.getElementById("final-score"),
  resultMessage: document.getElementById("result-message"),
  resultBadge: document.getElementById("result-badge"),
  leaderboardList: document.getElementById("leaderboard-list"),
  confettiCanvas: document.getElementById("confetti-canvas")
};

function init() {
  bindEvents();
  resetToHomeOnLoad();
  renderJourneyStrip();
  updateHubProgressFill();
  updateBestScoreUI();
  renderLeaderboard();
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      resetToHomeOnLoad();
      renderJourneyStrip();
      updateHubProgressFill();
      updateBestScoreUI();
    }
  });
}

/** Every full load or BFCache restore: hub, locked journey (phase 1 only), fresh session. Persisted journey cleared. */
function resetToHomeOnLoad() {
  clearTimer();
  state.journey = { maxUnlocked: 1, completed: {} };
  saveJourneyProgress();
  state.playerName = "";
  state.sessionIndex = 0;
  state.score = 0;
  state.displayedScore = 0;
  state.streak = 0;
  state.current = null;
  state.canAct = true;
  state.activePhase = 1;
  state.selectedMode = "learning";
  state.ruleSubStep = 1;
  state.sessionRecentPatterns = [];
  state.learningBusy = false;
  state.learningCooldownUntil = 0;
  if (els.playerNameInput) {
    els.playerNameInput.value = "";
    els.nameError.textContent = "";
  }
  if (els.score) els.score.textContent = "0";
  if (els.scoreBadge) els.scoreBadge.textContent = "0";
  if (els.streak) els.streak.textContent = "0";
  if (els.streakPop) els.streakPop.textContent = "";
  showLoading(false);
  showScreen("hub");
  window.scrollTo(0, 0);
}

function bindEvents() {
  els.beginJourneyBtn.addEventListener("click", beginJourney);
  els.labBackBtn.addEventListener("click", () => {
    showScreen("hub");
    renderJourneyStrip();
  });
  els.completePhase1.addEventListener("click", () => completeLabPhase(1));
  els.completePhase2.addEventListener("click", () => completeLabPhase(2));
  els.completePhase3.addEventListener("click", () => completeLabPhase(3));
  document.querySelectorAll(".rule-next").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = Number(btn.dataset.next);
      showRuleSubStep(next);
    });
  });

  els.restartBtn.addEventListener("click", () => {
    showScreen("hub");
    renderJourneyStrip();
  });
  els.menuBtn.addEventListener("click", () => {
    showScreen("hub");
    renderJourneyStrip();
  });
  els.backToMenuBtn.addEventListener("click", () => {
    clearTimer();
    showScreen("hub");
    renderJourneyStrip();
  });
  els.nextBtn.addEventListener("click", advanceOrFinish);
  els.nextStepBtn.addEventListener("click", nextLearningStep);
  els.playerNameInput.addEventListener("input", () => {
    els.nameError.textContent = "";
  });

  els.difficultyBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.difficulty = btn.dataset.difficulty;
      els.difficultyBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function loadJourneyProgress() {
  const raw = localStorage.getItem("bodmasLabJourney");
  if (raw) {
    try {
      const p = JSON.parse(raw);
      state.journey.maxUnlocked = Math.min(8, Math.max(1, Number(p.maxUnlocked) || 1));
      state.journey.completed = Object(p.completed || {});
    } catch (e) {
      state.journey = { maxUnlocked: 1, completed: {} };
    }
  } else {
    migrateLegacyProgress();
  }
}

function migrateLegacyProgress() {
  const old = localStorage.getItem("bodmasProgress");
  let max = 1;
  if (old) {
    try {
      const p = JSON.parse(old);
      if (p.learningDone) max = Math.max(max, 5);
      if (p.practiceDone) max = Math.max(max, 7);
    } catch (e) {
      /* ignore */
    }
  }
  state.journey.maxUnlocked = max;
  state.journey.completed = {};
  for (let i = 1; i < max; i += 1) state.journey.completed[i] = true;
  saveJourneyProgress();
}

function saveJourneyProgress() {
  localStorage.setItem("bodmasLabJourney", JSON.stringify(state.journey));
}

function isPhaseUnlocked(phaseId) {
  return phaseId <= state.journey.maxUnlocked;
}

function completeLabPhase(phaseId) {
  state.journey.completed[phaseId] = true;
  state.journey.maxUnlocked = Math.min(8, Math.max(state.journey.maxUnlocked, phaseId + 1));
  saveJourneyProgress();
  renderJourneyStrip();
  updateHubProgressFill();
  showScreen("hub");
}

function renderJourneyStrip() {
  els.journeyStrip.innerHTML = "";
  PHASES.forEach((ph) => {
    const unlocked = isPhaseUnlocked(ph.id);
    const done = Boolean(state.journey.completed[ph.id]);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "journey-node";
    if (done) btn.classList.add("journey-done");
    if (!unlocked) btn.classList.add("journey-locked");
    btn.disabled = !unlocked;
    btn.innerHTML = `
      <span class="journey-num">${ph.id}</span>
      <span class="journey-name">${escapeHtml(ph.short)}</span>
    `;
    btn.title = ph.title;
    if (unlocked) {
      btn.addEventListener("click", () => openPhase(ph.id));
    }
    els.journeyStrip.appendChild(btn);
  });
  updateHubProgressFill();
}

function beginJourney() {
  const name = sanitizeName(els.playerNameInput.value);
  if (!name) {
    els.nameError.textContent = "Please enter your name to begin.";
    els.playerNameInput.focus();
    return;
  }
  state.playerName = name;
  const first = findFirstIncompletePhase();
  openPhase(first);
}

function findFirstIncompletePhase() {
  for (let i = 1; i <= 7; i += 1) {
    if (!state.journey.completed[i] && isPhaseUnlocked(i)) return i;
  }
  return Math.min(7, state.journey.maxUnlocked);
}

function openPhase(phaseId) {
  if (!isPhaseUnlocked(phaseId)) {
    els.nameError.textContent = "Complete previous phases first.";
    return;
  }
  if (!state.playerName && phaseId > 1) {
    const name = sanitizeName(els.playerNameInput.value);
    if (!name) {
      els.nameError.textContent = "Please enter your name.";
      els.playerNameInput.focus();
      return;
    }
    state.playerName = name;
  }
  if (phaseId === 1 && !state.playerName) {
    const name = sanitizeName(els.playerNameInput.value);
    if (!name) {
      els.nameError.textContent = "Please enter your name.";
      els.playerNameInput.focus();
      return;
    }
    state.playerName = name;
  }

  state.activePhase = phaseId;
  if (phaseId <= 3) {
    showLabPhase(phaseId);
    return;
  }
  showGamePhase(phaseId);
}

function showLabPhase(phaseId) {
  showScreen("lab");
  els.labPanel1.classList.add("hidden");
  els.labPanel2.classList.add("hidden");
  els.labPanel3.classList.add("hidden");
  const meta = PHASES.find((p) => p.id === phaseId);
  els.labPhaseBadge.textContent = `Phase ${phaseId}: ${meta ? meta.title : ""}`;

  if (phaseId === 1) {
    els.labPanel1.classList.remove("hidden");
  } else if (phaseId === 2) {
    els.labPanel2.classList.remove("hidden");
  } else if (phaseId === 3) {
    els.labPanel3.classList.remove("hidden");
    state.ruleSubStep = 1;
    showRuleSubStep(1);
  }
}

function showRuleSubStep(n) {
  state.ruleSubStep = n;
  els.ruleSub1.classList.toggle("hidden", n !== 1);
  els.ruleSub2.classList.toggle("hidden", n !== 2);
  els.ruleSub3.classList.toggle("hidden", n !== 3);
}

function showGamePhase(phaseId) {
  const mode = MODE_BY_PHASE[phaseId];
  if (!mode) return;
  state.selectedMode = mode;
  state.sessionIndex = 0;
  state.score = 0;
  state.displayedScore = 0;
  state.streak = 0;
  state.current = null;
  state.sessionRecentPatterns = [];
  state.learningBusy = false;
  state.learningCooldownUntil = 0;
  clearTimer();
  showScreen("game");
  els.journeyMini.classList.remove("hidden");
  els.journeyMini.textContent = `Phase ${phaseId}: ${PHASES[phaseId - 1].title}`;
  configureModeUI();
  if (els.sessionProgressFill) els.sessionProgressFill.style.width = "0%";
  startRound();
}

function configureModeUI() {
  const mode = state.selectedMode;
  els.currentModeTitle.textContent = MODE_CONFIG[mode].label;
  els.hudProgressLabel.textContent = mode === "challenge" ? "Question" : "Round";
  els.questionLabel.textContent =
    mode === "interactive"
      ? "Which operation type should be solved next?"
      : mode === "practice" || mode === "challenge"
        ? "Choose the final value"
        : "Expression";
  els.timerWrap.classList.toggle("hidden", !MODE_CONFIG[mode].timed);
  els.interactiveOptions.classList.toggle("hidden", mode !== "interactive");
  els.mcqOptions.classList.toggle("hidden", mode !== "practice" && mode !== "challenge");
  els.historyWrap.classList.remove("hidden");
  els.stepExplanation.classList.add("hidden");
  els.nextBtn.classList.add("hidden");
  els.nextStepBtn.classList.add("hidden");
  els.feedback.textContent = "";
  els.explanation.textContent = "";
  els.wrongPopup.classList.add("hidden");
}

function startRound() {
  const total = MODE_CONFIG[state.selectedMode].total;
  if (state.sessionIndex >= total) {
    endSession();
    return;
  }

  state.current = buildExpressionForMode(state.difficulty, state.sessionIndex, state.selectedMode);
  state.sessionIndex += 1;
  state.canAct = true;
  renderRound();
  updateHud();
  updateSessionProgressBar();
  if (state.selectedMode === "challenge") startChallengeTimer();
}

function renderRound() {
  els.feedback.textContent = "";
  els.explanation.textContent = "";
  els.stepExplanation.classList.add("hidden");
  els.wrongPopup.classList.add("hidden");
  els.nextBtn.classList.add("hidden");
  renderExpression(state.current.tokens);
  renderHistory([]);

  if (state.selectedMode === "learning") {
    updateLearningMessage(
      "You control the pace. When ready, press Next step. The active part glows, then merges into the result—read What / Why / Rule before continuing."
    );
    els.stepExplanation.classList.add("hidden");
    refreshLearningStepUi();
    return;
  }

  if (state.selectedMode === "interactive") {
    updateLearningMessage("Pick the operation type that BODMAS says to do next.");
    renderInteractiveChoices();
    return;
  }

  if (state.selectedMode === "practice" || state.selectedMode === "challenge") {
    updateLearningMessage(
      state.selectedMode === "challenge" ? "Timed practice—build your streak." : "Pick the correct final answer. Full breakdown after you answer."
    );
    renderMcqChoices();
  }
}

function refreshLearningStepUi() {
  state.learningBusy = false;
  const step = getNextStep(state.current.tokens);
  els.nextStepBtn.classList.remove("hidden");
  els.nextBtn.classList.add("hidden");
  els.stepExplanation.classList.add("hidden");
  if (!step) {
    els.nextStepBtn.classList.add("hidden");
    els.nextBtn.classList.remove("hidden");
    updateLearningMessage(
      `This expression is complete. Final answer: ${state.current.finalAnswer}. Review the history, then continue when ready.`
    );
    els.nextStepBtn.disabled = false;
    return;
  }
  updateLearningMessage(
    `Step ${state.current.doneSteps.length + 1} of ${state.current.steps.length}. Read the expression, then press Next step—the active part glows, then merges into the result.`
  );
  els.nextStepBtn.disabled = Date.now() < state.learningCooldownUntil;
  if (els.nextStepBtn.disabled) {
    setTimeout(() => {
      els.nextStepBtn.disabled = false;
    }, Math.max(0, state.learningCooldownUntil - Date.now()) + 50);
  }
}

function nextLearningStep() {
  if (state.selectedMode !== "learning" || state.learningBusy) return;
  if (Date.now() < state.learningCooldownUntil) return;
  const raw = getNextStep(state.current.tokens);
  if (!raw) return;

  state.learningBusy = true;
  els.nextStepBtn.disabled = true;
  const enriched = enrichStep(raw);

  highlightTriple(raw.opIndex);
  setTimeout(() => {
    runMergeAnimation(raw.opIndex, () => {
      applyStepToCurrent(enriched, true);
      state.score += 5;
      updateHud();
      renderHistory(state.current.doneSteps);
      renderExpression(state.current.tokens, raw.opIndex - 1);
      showStepExplanationBlock(enriched);
      updateLearningMessage(`${enriched.ruleText} So ${enriched.preview} = ${enriched.result}.`);
      playSound("correct");
      pulseCorrect();
      state.learningCooldownUntil = Date.now() + 780;
      updateSessionProgressBar();
      const more = getNextStep(state.current.tokens);
      if (!more) {
        state.learningBusy = false;
        els.nextStepBtn.classList.add("hidden");
        els.nextBtn.classList.remove("hidden");
        updateLearningMessage(
          `Final answer: ${state.current.finalAnswer}. Use Next expression when you are ready for a new problem.`
        );
        els.nextStepBtn.disabled = false;
        return;
      }
      setTimeout(() => {
        state.learningBusy = false;
        els.nextStepBtn.disabled = false;
        refreshLearningStepUi();
      }, 750);
    });
  }, 400);
}

function runMergeAnimation(opIndex, onDone) {
  const nodes = [...els.expressionVisual.children];
  [opIndex - 1, opIndex, opIndex + 1].forEach((i) => {
    const el = nodes[i];
    if (el) {
      el.classList.add("token-merge-group");
      requestAnimationFrame(() => el.classList.add("token-merge-out"));
    }
  });
  setTimeout(onDone, 520);
}

function highlightTriple(opIndex) {
  [...els.expressionVisual.querySelectorAll(".token")].forEach((el) => {
    el.classList.remove("token-current", "token-glow", "token-merge-group");
  });
  const nodes = [...els.expressionVisual.children];
  [opIndex - 1, opIndex, opIndex + 1].forEach((i) => {
    const el = nodes[i];
    if (el) {
      el.classList.add("token-current");
      requestAnimationFrame(() => el.classList.add("token-glow"));
    }
  });
}

function pulseCorrect() {
  els.feedback.classList.add("feedback-pulse");
  setTimeout(() => els.feedback.classList.remove("feedback-pulse"), 650);
}

function triggerScreenShake() {
  els.gameScreen.classList.remove("shake-screen");
  void els.gameScreen.offsetWidth;
  els.gameScreen.classList.add("shake-screen");
  setTimeout(() => els.gameScreen.classList.remove("shake-screen"), 550);
}

function updateSessionProgressBar() {
  if (!els.sessionProgressFill) return;
  const mode = state.selectedMode;
  const totalRounds = MODE_CONFIG[mode].total;
  const roundDone = Math.max(0, state.sessionIndex - 1);
  let frac = totalRounds > 0 ? roundDone / totalRounds : 0;
  if (state.current && state.current.steps && state.current.steps.length > 0) {
    const inRound = (state.current.doneSteps || []).length / state.current.steps.length;
    frac += (1 / totalRounds) * inRound;
  }
  els.sessionProgressFill.style.width = `${Math.min(100, frac * 100)}%`;
}

function updateHubProgressFill() {
  if (!els.hubProgressFill) return;
  const done = PHASES.filter((p) => state.journey.completed[p.id]).length;
  els.hubProgressFill.style.width = `${(done / 7) * 100}%`;
}

function enrichStep(step) {
  const pack = EXPLAIN[step.ruleType] || EXPLAIN.addSubtract;
  return {
    ...step,
    what: pack.what,
    why: pack.why,
    ruleShort: pack.rule,
    ruleText: pack.ruleText
  };
}

function showStepExplanationBlock(step) {
  els.stepExplanation.classList.remove("hidden");
  els.stepExplanation.innerHTML = `
    <div class="explain-row"><strong>What:</strong> ${escapeHtml(step.what)}</div>
    <div class="explain-row"><strong>Why:</strong> ${escapeHtml(step.why)}</div>
    <div class="explain-row"><strong>Which rule:</strong> ${escapeHtml(step.ruleShort)}</div>
    <div class="explain-row explain-say-it"><strong>In plain words:</strong> ${escapeHtml(step.ruleText)}</div>
  `;
}

function renderInteractiveChoices() {
  els.interactiveOptions.innerHTML = "";
  OPERATION_TYPES.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = option.label;
    button.addEventListener("click", () => handleInteractiveChoice(option.key, button));
    els.interactiveOptions.appendChild(button);
  });
}

function handleInteractiveChoice(choiceKey, clickedButton) {
  if (!state.canAct) return;
  const raw = getNextStep(state.current.tokens);
  if (!raw) return;
  const expected = enrichStep(raw);

  const buttons = [...els.interactiveOptions.querySelectorAll(".option-btn")];
  const correctButton = buttons.find((btn) => btn.textContent === operationLabel(expected.ruleType));

  if (choiceKey !== expected.ruleType) {
    state.canAct = false;
    state.streak = 0;
    updateHud();
    clickedButton.classList.add("wrong");
    if (correctButton) correctButton.classList.add("correct");
    showWrongReason(expected);
    playSound("wrong");
    triggerScreenShake();
    setTimeout(() => {
      buttons.forEach((b) => {
        b.classList.remove("wrong", "correct");
        b.disabled = false;
      });
      state.canAct = true;
    }, 1550);
    return;
  }

  state.canAct = false;
  buttons.forEach((b) => {
    b.disabled = true;
  });
  if (correctButton) correctButton.classList.add("correct");
  highlightTriple(expected.opIndex);
  setTimeout(() => {
    runMergeAnimation(expected.opIndex, () => {
      applyStepToCurrent(expected, true);
      state.score += 10;
      state.streak += 1;
      renderExpression(state.current.tokens, expected.opIndex - 1);
      renderHistory(state.current.doneSteps);
      showStepExplanationBlock(expected);
      showStreakAnimation();
      updateLearningMessage(`${expected.ruleText} So ${expected.preview} = ${expected.result}.`);
      updateHud();
      updateSessionProgressBar();
      pulseCorrect();
      playSound("correct");
      if (state.current.tokens.length === 1) {
        els.nextBtn.classList.remove("hidden");
        els.explanation.textContent = `Final answer: ${state.current.finalAnswer}`;
      } else {
        renderInteractiveChoices();
        state.canAct = true;
      }
    });
  }, 450);
}

function renderMcqChoices() {
  els.mcqOptions.innerHTML = "";
  state.current.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "option-btn";
    button.textContent = String(option);
    button.addEventListener("click", () => handleMcqChoice(option, button));
    els.mcqOptions.appendChild(button);
  });
}

function handleMcqChoice(selected, clickedButton) {
  if (!state.canAct) return;
  state.canAct = false;
  if (state.selectedMode === "challenge") clearTimer();

  const correct = Number(selected) === Number(state.current.finalAnswer);
  const buttons = [...els.mcqOptions.querySelectorAll(".option-btn")];
  const correctBtn = buttons.find((btn) => Number(btn.textContent) === Number(state.current.finalAnswer));
  if (correctBtn) correctBtn.classList.add("correct");
  buttons.forEach((b) => {
    b.disabled = true;
  });

  if (correct) {
    clickedButton.classList.add("correct");
    const base = state.selectedMode === "challenge" ? 20 : 15;
    const bonus = state.selectedMode === "challenge" && state.streak >= 2 ? 5 : 0;
    state.score += base + bonus;
    state.streak += 1;
    els.feedback.textContent = bonus > 0 ? `Correct! +${base} (+${bonus} streak)` : `Correct! +${base}`;
    els.feedback.className = "feedback-text good";
    showStreakAnimation();
    pulseCorrect();
    playSound("correct");
  } else {
    clickedButton.classList.add("wrong");
    state.streak = 0;
    els.feedback.textContent = `Incorrect. Answer: ${state.current.finalAnswer}`;
    els.feedback.className = "feedback-text bad";
    playSound("wrong");
    triggerScreenShake();
  }

  updateHud();
  updateSessionProgressBar();
  renderHistory(state.current.steps);
  els.stepExplanation.classList.remove("hidden");
  els.stepExplanation.innerHTML = buildStepBreakdownHtml(state.current.steps);
  els.explanation.textContent = "Each step follows BODMAS: what happens, why, and which rule applies.";
  els.nextBtn.classList.remove("hidden");
}

function startChallengeTimer() {
  clearTimer();
  const base = state.difficulty === "easy" ? 14 : state.difficulty === "medium" ? 11 : 9;
  state.timeLeft = Math.max(5, base - Math.floor(state.sessionIndex / 3));
  els.timer.textContent = String(state.timeLeft);
  updateTimerBar();
  state.timerId = setInterval(() => {
    state.timeLeft -= 1;
    els.timer.textContent = String(Math.max(0, state.timeLeft));
    updateTimerBar();
    if (state.timeLeft <= 0) {
      clearTimer();
      state.streak = 0;
      state.canAct = false;
      updateHud();
      els.feedback.textContent = `Time up. Answer: ${state.current.finalAnswer}`;
      els.feedback.className = "feedback-text bad";
      renderHistory(state.current.steps);
      els.stepExplanation.classList.remove("hidden");
      els.stepExplanation.innerHTML = buildStepBreakdownHtml(state.current.steps);
      els.nextBtn.classList.remove("hidden");
      playSound("wrong");
    }
  }, 1000);
}

function clearTimer() {
  clearInterval(state.timerId);
  state.timerId = null;
}

function updateTimerBar() {
  const modeBase = state.difficulty === "easy" ? 14 : state.difficulty === "medium" ? 11 : 9;
  const pct = (state.timeLeft / modeBase) * 100;
  els.timerProgress.style.width = `${Math.max(0, pct)}%`;
  els.timerProgress.classList.remove("medium", "low");
  if (pct <= 55 && pct > 25) els.timerProgress.classList.add("medium");
  if (pct <= 25) els.timerProgress.classList.add("low");
}

function advanceOrFinish() {
  startRound();
}

function endSession() {
  clearTimer();
  const phase = state.activePhase;
  state.journey.completed[phase] = true;
  state.journey.maxUnlocked = Math.min(8, Math.max(state.journey.maxUnlocked, phase + 1));
  saveJourneyProgress();

  animateFinalScore(state.score);
  els.resultMessage.textContent = sessionMessage();
  els.resultBadge.textContent = `Phase ${phase} complete. ${phase < 7 ? "Next phase unlocked in the hub." : "You finished the full lab journey."}`;
  updateLeaderboard(state.score, state.difficulty, `${state.playerName} · P${phase}`);
  persistBestScore(state.score);
  renderLeaderboard();
  updateHubProgressFill();
  showScreen("result");
  if (state.score >= 120) launchConfetti();
  playSound("gameOver");
  saveScoreToBackend(state.playerName, state.score);
}

function sessionMessage() {
  if (state.activePhase === 7) return "Challenge complete! You worked under pressure with BODMAS.";
  if (state.score >= 140) return "Strong performance across this phase.";
  if (state.score >= 80) return "Solid work. Replay any phase from the hub to reinforce.";
  return "Keep going—use the visual and interactive phases to build confidence.";
}

function buildExpressionForMode(difficulty, index, mode) {
  const phase = index >= 6 ? 2 : index >= 3 ? 1 : 0;
  const tokens = pickDiverseTokens(difficulty, phase);
  const steps = simulateSteps(tokens);
  const finalAnswer = steps[steps.length - 1].result;
  return {
    tokens: cloneTokens(tokens),
    steps,
    doneSteps: [],
    options: mode === "practice" || mode === "challenge" ? generateOptions(finalAnswer) : [],
    finalAnswer
  };
}

function pickDiverseTokens(difficulty, phase) {
  const pool = buildPatternPool(difficulty, phase);
  const recent = state.sessionRecentPatterns;
  const ordered = shuffle([...pool]);
  const pick = ordered.find((p) => !recent.slice(-6).includes(p.key)) || ordered[0];
  recent.push(pick.key);
  if (recent.length > 20) recent.shift();
  return pick.make();
}

function buildPatternPool(difficulty, phase) {
  const bump = phase * 2;
  const n1 = () => randInt(2, 10 + bump);
  const n2 = () => randInt(2, 8 + bump);

  const patterns = [
    {
      key: "a+b×c",
      make: () => makeTokens([n1(), n1(), n1()], ["+", "×"])
    },
    {
      key: "(a+b)×c",
      make: () => makeTokens([n2(), n2(), n1()], ["+", "×"], [0])
    },
    {
      key: "a+b×c÷d",
      make: () => {
        const d = randInt(2, 9 + bump);
        return makeTokens([n1(), n1(), n1(), d], ["+", "×", "÷"]);
      }
    }
  ];

  patterns.push({
    key: "(a+b)×(c−d)",
    make: () => {
      const a = n2();
      const b = n2();
      const c = n1();
      const d = randInt(1, Math.max(1, c - 1));
      return makeTokens([a, b, c, d], ["+", "×", "-"], [0, 2]);
    }
  });

  patterns.push({
    key: "a+b÷c",
    make: () => {
      const c = randInt(2, 9 + bump);
      const b = c * randInt(2, 6 + bump);
      return makeTokens([n1(), b, c], ["+", "÷"]);
    }
  });

  if (difficulty === "medium" || difficulty === "hard") {
    patterns.push({
      key: "a×b+c−d",
      make: () => makeTokens([n1(), n1(), n1(), n1()], ["×", "+", "-"])
    });
    patterns.push({
      key: "(a+b)×c−d",
      make: () => makeTokens([n2(), n2(), n1(), n2()], ["+", "×", "-"], [0])
    });
  }

  if (difficulty === "hard") {
    patterns.push({
      key: "a+(b×c)÷d",
      make: () => {
        const b = n1();
        const c = n1();
        const prod = b * c;
        const d = randInt(2, 9 + bump);
        return makeTokens([n1(), prod, d], ["+", "÷"]);
      }
    });
    patterns.push({
      key: "(a+b)×c÷d",
      make: () => {
        const a = n2();
        const b = n2();
        const c = n1() * randInt(2, 4 + bump);
        const d = randInt(2, 7 + bump);
        return makeTokens([a, b, c, d], ["+", "×", "÷"], [0]);
      }
    });
  }

  return patterns;
}

function makeTokens(numbers, ops, bracketOpIndices = []) {
  const tokens = [];
  for (let i = 0; i < numbers.length; i += 1) {
    tokens.push({ type: "number", value: Number(numbers[i]) });
    if (i < ops.length) {
      const op = { type: "op", value: normalizeOp(ops[i]) };
      if (bracketOpIndices.includes(i)) op.group = "brackets";
      tokens.push(op);
    }
  }
  bracketOpIndices.forEach((opIdx) => {
    const li = opIdx * 2;
    const ri = opIdx * 2 + 2;
    if (tokens[li]) tokens[li].bracketStart = true;
    if (tokens[ri]) tokens[ri].bracketEnd = true;
  });
  return tokens;
}

function simulateSteps(initialTokens) {
  const tokens = cloneTokens(initialTokens);
  const steps = [];
  while (tokens.length > 1) {
    const step = getNextStep(tokens);
    if (!step) break;
    applyStepRaw(tokens, step);
    steps.push(enrichStep(step));
  }
  return steps;
}

function getNextStep(tokens) {
  const opIndex = findNextOperationIndex(tokens);
  if (opIndex < 1 || opIndex > tokens.length - 2) return null;
  const left = tokens[opIndex - 1].value;
  const op = tokens[opIndex].value;
  const right = tokens[opIndex + 1].value;
  const ruleType = inferRuleType(tokens[opIndex]);
  return {
    opIndex,
    left,
    op,
    right,
    result: compute(left, op, right),
    ruleType,
    preview: `${left} ${op} ${right}`
  };
}

function findNextOperationIndex(tokens) {
  for (let i = 1; i < tokens.length - 1; i += 2) {
    if (tokens[i].group === "brackets") return i;
  }
  for (let i = 1; i < tokens.length - 1; i += 2) {
    if (tokens[i].value === "×" || tokens[i].value === "÷") return i;
  }
  return tokens.length > 1 ? 1 : -1;
}

function inferRuleType(opToken) {
  if (opToken.group === "brackets") return "brackets";
  if (opToken.value === "×" || opToken.value === "÷") return "multiplyDivide";
  return "addSubtract";
}

function applyStepToCurrent(step, rewardVisual) {
  applyStepRaw(state.current.tokens, step);
  state.current.doneSteps.push(step);
  if (rewardVisual) {
    els.feedback.className = "feedback-text good";
    els.feedback.textContent = `${step.preview} = ${step.result}`;
    els.explanation.textContent = step.ruleText;
  }
}

function applyStepRaw(tokens, step) {
  const leftToken = tokens[step.opIndex - 1];
  const rightToken = tokens[step.opIndex + 1];
  const merged = {
    type: "number",
    value: step.result,
    bracketStart: leftToken.bracketStart,
    bracketEnd: rightToken.bracketEnd
  };
  if (merged.bracketStart && merged.bracketEnd) {
    delete merged.bracketStart;
    delete merged.bracketEnd;
  }
  tokens.splice(step.opIndex - 1, 3, merged);
}

function renderExpression(tokens, pulseIndex = null) {
  els.expressionVisual.innerHTML = "";
  tokens.forEach((token, i) => {
    const node = document.createElement("span");
    if (token.type === "number") {
      const left = token.bracketStart ? "(" : "";
      const right = token.bracketEnd ? ")" : "";
      node.className = "token token-number";
      node.textContent = `${left}${token.value}${right}`;
    } else {
      node.className = "token token-op";
      node.textContent = token.value;
    }
    if (pulseIndex !== null && i === pulseIndex) node.classList.add("token-just-merged");
    els.expressionVisual.appendChild(node);
  });
}

function renderHistory(steps) {
  els.historyList.innerHTML = "";
  if (!steps.length) {
    const row = document.createElement("div");
    row.className = "history-row history-empty";
    row.textContent = "Steps appear here as you solve.";
    els.historyList.appendChild(row);
    return;
  }
  steps.forEach((step, idx) => {
    const row = document.createElement("div");
    row.className = "history-row";
    const r = step.ruleShort || step.ruleText || "";
    row.innerHTML = `<span class="history-step-num">${idx + 1}.</span> ${escapeHtml(step.preview)} = ${escapeHtml(String(step.result))} <span class="history-rule">(${escapeHtml(r)})</span>`;
    els.historyList.appendChild(row);
  });
}

function buildStepBreakdownHtml(steps) {
  return steps
    .map(
      (step, i) => `
    <div class="breakdown-step">
      <strong>Step ${i + 1}:</strong> ${escapeHtml(step.preview)} = ${escapeHtml(String(step.result))}
      <div class="explain-row"><strong>What:</strong> ${escapeHtml(step.what)}</div>
      <div class="explain-row"><strong>Why:</strong> ${escapeHtml(step.why)}</div>
      <div class="explain-row"><strong>Rule:</strong> ${escapeHtml(step.ruleShort)}</div>
    </div>`
    )
    .join("");
}

function showWrongReason(expected) {
  els.wrongPopupText.textContent = `${expected.why} ${expected.ruleText}`;
  els.wrongPopup.classList.remove("hidden");
  els.wrongPopup.classList.remove("pop-in");
  void els.wrongPopup.offsetWidth;
  els.wrongPopup.classList.add("pop-in");
  els.feedback.className = "feedback-text bad";
  els.feedback.textContent = "Not this rule yet.";
  els.explanation.textContent = `Try: ${expected.ruleShort}.`;
  showStepExplanationBlock(expected);
}

function updateLearningMessage(text) {
  els.learningMessage.textContent = text;
}

function operationLabel(ruleType) {
  const found = OPERATION_TYPES.find((item) => item.key === ruleType);
  return found ? found.label : ruleType;
}

function updateHud() {
  const total = MODE_CONFIG[state.selectedMode].total;
  const current = Math.min(Math.max(state.sessionIndex, 1), total);
  els.questionCount.textContent = `${current}/${total}`;
  animateScoreTo(state.score);
  els.streak.textContent = String(state.streak);
}

function showScreen(screen) {
  els.hubScreen.classList.remove("active");
  els.labScreen.classList.remove("active");
  els.gameScreen.classList.remove("active");
  els.resultScreen.classList.remove("active");
  if (screen === "hub") els.hubScreen.classList.add("active");
  if (screen === "lab") els.labScreen.classList.add("active");
  if (screen === "game") els.gameScreen.classList.add("active");
  if (screen === "result") els.resultScreen.classList.add("active");
}

function generateOptions(answer) {
  const set = new Set([Number(answer)]);
  while (set.size < 4) {
    const offset = randInt(-14, 14);
    const candidate = Number(answer) + offset;
    if (candidate !== Number(answer)) set.add(candidate);
  }
  return shuffle([...set]);
}

function compute(a, op, b) {
  if (op === "+") return a + b;
  if (op === "-") return a - b;
  if (op === "×") return a * b;
  return a / b;
}

function normalizeOp(op) {
  if (op === "*") return "×";
  if (op === "/") return "÷";
  return op;
}

function cloneTokens(tokens) {
  return tokens.map((token) => ({ ...token }));
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
  board.push({ name, score, difficulty, date: new Date().toLocaleDateString() });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("bodmasLeaderboard", JSON.stringify(board.slice(0, 10)));
}

async function renderLeaderboard() {
  const remoteBoard = await fetchLeaderboard();
  const board = remoteBoard.length ? remoteBoard : JSON.parse(localStorage.getItem("bodmasLeaderboard") || "[]");
  els.leaderboardList.innerHTML = "";
  if (!board.length) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "No scores yet.";
    els.leaderboardList.appendChild(empty);
    return;
  }
  board.slice(0, 10).forEach((entry, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    const rank = index + 1;
    const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
    row.innerHTML = `
      <div class="leaderboard-rank">${rankLabel}</div>
      <div class="leaderboard-name"><span>${escapeHtml(entry.name || "Player")}</span></div>
      <div class="leaderboard-score">${Number(entry.score)} pts</div>
    `;
    els.leaderboardList.appendChild(row);
  });
}

async function saveScoreToBackend(name, score) {
  try {
    await sendScore(name, score);
    await renderLeaderboard();
  } catch (error) {
    /* local only */
  }
}

function playSound(type) {
  if (!preloadedAudio[type]) preloadedAudio[type] = new Audio(audioFiles[type]);
  preloadedAudio[type].currentTime = 0;
  preloadedAudio[type].play().catch(() => synthFallback(type));
}

function animateScoreTo(targetScore) {
  const from = state.displayedScore;
  const to = targetScore;
  if (from === to) return;
  const start = performance.now();
  const duration = 240;
  const run = (now) => {
    const p = Math.min((now - start) / duration, 1);
    state.displayedScore = Math.round(from + (to - from) * p);
    els.score.textContent = String(state.displayedScore);
    els.scoreBadge.textContent = String(state.displayedScore);
    if (p < 1) requestAnimationFrame(run);
  };
  requestAnimationFrame(run);
}

function showStreakAnimation() {
  if (state.streak >= 3) {
    const label = state.streak >= 5 ? `×${state.streak} MEGA` : `×${state.streak} STREAK`;
    els.streakPop.textContent = label;
    els.streakPop.classList.remove("streak-burst");
    void els.streakPop.offsetWidth;
    els.streakPop.classList.add("streak-burst");
  } else {
    els.streakPop.textContent = "";
  }
}

function animateFinalScore(target) {
  const start = performance.now();
  const duration = 650;
  const run = (now) => {
    const p = Math.min((now - start) / duration, 1);
    els.finalScore.textContent = String(Math.round(target * p));
    if (p < 1) requestAnimationFrame(run);
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
    y: -Math.random() * 200,
    size: 4 + Math.random() * 7,
    speedY: 1 + Math.random() * 3,
    speedX: -1 + Math.random() * 2,
    color: ["#f59e0b", "#22c55e", "#06b6d4", "#f43f5e"][Math.floor(Math.random() * 4)]
  }));
  let frame = 0;
  const draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((piece) => {
      piece.x += piece.speedX;
      piece.y += piece.speedY;
      ctx.fillStyle = piece.color;
      ctx.fillRect(piece.x, piece.y, piece.size, piece.size * 0.6);
    });
    frame += 1;
    if (frame < 170) requestAnimationFrame(draw);
  };
  draw();
}

function showLoading(show) {
  els.loadingOverlay.classList.toggle("active", show);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeName(value) {
  return String(value || "").trim().replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 18);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function persistBestScore(score) {
  const prev = Number(localStorage.getItem("bodmasBestScore") || 0);
  if (score > prev) localStorage.setItem("bodmasBestScore", String(score));
  updateBestScoreUI();
}

function updateBestScoreUI() {
  els.bestScore.textContent = String(Number(localStorage.getItem("bodmasBestScore") || 0));
}

function synthFallback(type) {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.frequency.value = type === "correct" ? 640 : type === "wrong" ? 220 : 140;
  gain.gain.value = 0.1;
  osc.start();
  osc.stop(audioContext.currentTime + 0.16);
}

init();
