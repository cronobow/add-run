(() => {
  const screens = {
    home: document.getElementById("screenHome"),
    countdown: document.getElementById("screenCountdown"),
    play: document.getElementById("screenPlay"),
    result: document.getElementById("screenResult"),
  };

  const appRoot = document.getElementById("appRoot");
  const timeButtons = Array.from(document.querySelectorAll(".time-option"));
  const sumButtons = Array.from(document.querySelectorAll("[data-sum-limit]"));
  const zeroButtons = Array.from(
    document.querySelectorAll("[data-allow-zero]"),
  );
  const timeLimitButtons = Array.from(
    document.querySelectorAll("[data-time-limit]"),
  );
  const btnStart = document.getElementById("btnStart");
  const btnRetry = document.getElementById("btnRetry");
  const btnBackHome = document.getElementById("btnBackHome");
  const countdownNumber = document.getElementById("countdownNumber");
  const timeDisplay = document.getElementById("timeDisplay");
  const questionCard = document.getElementById("questionCard");
  const gestureArea = document.getElementById("gestureArea");
  const resultScore = document.getElementById("resultScore");
  const resultLabel = document.getElementById("resultLabel");
  const resultCorrect = document.getElementById("resultCorrect");
  const resultWrong = document.getElementById("resultWrong");
  const resultTotal = document.getElementById("resultTotal");
  const resultAccuracy = document.getElementById("resultAccuracy");
  const resultLevel = document.getElementById("resultLevel");
  const levelTitle = document.getElementById("levelTitle");
  const levelMessage = document.getElementById("levelMessage");
  const levelEffects = document.getElementById("levelEffects");
  const monkeyEmoji = document.getElementById("monkeyEmoji");
  const crocodileEmoji = document.getElementById("crocodileEmoji");
  const gameStatus = document.getElementById("gameStatus");

  const QUESTION_POOL_SIZE = 200;
  const BALANCED_SUM_MIN = 4;
  const BALANCED_SUM_MAX = 10;

  const levelConfig = {
    amazing: {
      label: "驚人",
      message: "速度與準確度都滿點，保持住！",
      animation: "confetti",
    },
    excellent: {
      label: "超級棒",
      message: "節奏俐落又穩定，距離滿分超近！",
      animation: "bubbles",
    },
    good: {
      label: "不錯",
      message: "漸入佳境，再多練幾題就更熟悉囉。",
      animation: "rings",
    },
    tryagain: {
      label: "再加油",
      message: "穩住呼吸，慢慢算、慢慢唸，下次一定更好。",
      animation: "shake",
    },
  };

  const state = {
    selectedSeconds: 0,
    sumLimit: null,
    allowZero: null,
    questionTimeLimit: 2000,
    remainingSeconds: 0,
    timerId: null,
    countdownId: null,
    countdownValue: 3,
    correct: 0,
    wrong: 0,
    swipeThreshold: 60,
    cardLocked: false,
    questionPool: [],
    questionIndex: 0,
    currentQuestionStartTime: 0,
    currentQuestion: null,
    answerLog: [],
    monkeyPosition: 5,
    questionTimerId: null,
    gameOver: false,
  };

  let effectCleanup = null;

  const showScreen = (name) => {
    Object.values(screens).forEach((screen) =>
      screen.classList.remove("screen--active"),
    );
    screens[name].classList.add("screen--active");
  };

  const formatTime = (seconds) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const updateTimerUI = () => {
    timeDisplay.textContent = formatTime(state.remainingSeconds);
  };

  const hasRequiredSelections = () =>
    Boolean(state.selectedSeconds && state.sumLimit && state.questionTimeLimit) &&
    typeof state.allowZero === "boolean";

  const updateStartButtonState = () => {
    const ready = hasRequiredSelections();
    btnStart.disabled = !ready;
    btnStart.setAttribute("aria-disabled", String(!ready));
  };

  const resetStats = () => {
    state.correct = 0;
    state.wrong = 0;
    state.remainingSeconds = state.selectedSeconds ?? 60;
    state.answerLog = [];
    state.currentQuestionStartTime = 0;
    state.currentQuestion = null;
    updateTimerUI();
    state.monkeyPosition = 5;
    state.gameOver = false;
    if (state.questionTimerId) {
      clearTimeout(state.questionTimerId);
      state.questionTimerId = null;
    }
    if (monkeyEmoji && crocodileEmoji) {
      monkeyEmoji.classList.remove("move-right", "move-left", "eaten");
      crocodileEmoji.classList.remove("eating");
    }
    setTimeout(() => {
      updateMonkeyPosition();
      updateGameStatus("答對往右，答錯或超時往左", "");
    }, 50);
  };

  const randomInt = (min, max) => {
    if (max <= min) {
      return min;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const isZeroPairDisallowed = (a, b) =>
    state.allowZero &&
    ((a === 0 && (b === 0 || b === 1)) ||
      (b === 0 && (a === 0 || a === 1)));

  const getBalancedSums = () => {
    const limit = state.sumLimit ?? BALANCED_SUM_MAX;
    const upper = Math.min(BALANCED_SUM_MAX, limit);
    const lower = Math.min(BALANCED_SUM_MIN, upper);
    const sums = [];
    for (let sum = lower; sum <= upper; sum += 1) {
      sums.push(sum);
    }
    return sums.length ? sums : [upper];
  };

  const distributeCounts = (total, bucketCount) => {
    const base = Math.floor(total / bucketCount);
    const remainder = total % bucketCount;
    const counts = new Array(bucketCount).fill(base);
    const indices = shuffleArray(
      Array.from({ length: bucketCount }, (_, index) => index),
    );
    for (let i = 0; i < remainder; i += 1) {
      counts[indices[i]] += 1;
    }
    return counts;
  };

  const getValidPairsForSum = (sum) => {
    const minOperand = state.allowZero ? 0 : 1;
    const maxOperand = 9;
    const pairs = [];
    const maxFirst = Math.min(maxOperand, sum - minOperand);
    for (let a = minOperand; a <= maxFirst; a += 1) {
      const b = sum - a;
      if (b < minOperand || b > maxOperand) {
        continue;
      }
      if (isZeroPairDisallowed(a, b)) {
        continue;
      }
      pairs.push([a, b]);
    }
    return pairs;
  };

  const generateQuestionsForSum = (sum, count) => {
    const pairs = getValidPairsForSum(sum);
    if (!pairs.length) {
      return [];
    }
    const questions = [];
    for (let i = 0; i < count; i += 1) {
      const [a, b] = pairs[randomInt(0, pairs.length - 1)];
      questions.push({ a, b, label: `${a} + ${b}` });
    }
    return questions;
  };

  const removeDuplicateConsecutives = (pool) => {
    if (pool.length <= 1) return pool;
    const filtered = [pool[0]];
    for (let i = 1; i < pool.length; i += 1) {
      const prev = filtered[filtered.length - 1];
      const curr = pool[i];
      // 只有當兩題的 a 和 b 完全相同時才視為重複（不考慮交換）
      if (prev.a === curr.a && prev.b === curr.b) {
        continue;
      }
      filtered.push(curr);
    }
    return filtered;
  };

  const hasOperandZeroOrOne = (question) =>
    question.a === 0 ||
    question.a === 1 ||
    question.b === 0 ||
    question.b === 1;

  const enforceZeroOneRatioCap = (pool, maxRatio = 0.1) => {
    const countWithZeroOrOne = pool.filter(hasOperandZeroOrOne).length;
    const currentRatio = pool.length ? countWithZeroOrOne / pool.length : 0;
    if (currentRatio <= maxRatio) {
      return pool;
    }
    const targetCount = Math.floor(pool.length * maxRatio);
    const withZeroOrOne = pool.filter(hasOperandZeroOrOne);
    const withoutZeroOrOne = pool.filter((q) => !hasOperandZeroOrOne(q));
    const result = withoutZeroOrOne.slice(
      0,
      Math.max(pool.length - targetCount, 0),
    );
    result.push(...withZeroOrOne.slice(0, targetCount));
    return shuffleArray(result);
  };

  const buildQuestionPool = () => {
    const sums = getBalancedSums();
    if (!sums.length) {
      return [];
    }
    const counts = distributeCounts(QUESTION_POOL_SIZE, sums.length);
    const pool = sums.flatMap((sum, index) =>
      generateQuestionsForSum(sum, counts[index]),
    );
    if (pool.length < QUESTION_POOL_SIZE) {
      const fallbackPairs = getValidPairsForSum(sums[0]);
      for (let i = pool.length; i < QUESTION_POOL_SIZE; i += 1) {
        const [a, b] =
          fallbackPairs[randomInt(0, fallbackPairs.length - 1)] || [2, 2];
        pool.push({ a, b, label: `${a} + ${b}` });
      }
    }
    const shuffled = shuffleArray(pool);
    const deduplicated = removeDuplicateConsecutives(shuffled);
    const ratioLimited = enforceZeroOneRatioCap(deduplicated, 0.1);
    return ratioLimited;
  };

  const prepareQuestionPool = () => {
    state.questionPool = buildQuestionPool();
    state.questionIndex = 0;
  };

  const getNextQuestionFromPool = () => {
    if (
      !Array.isArray(state.questionPool) ||
      state.questionPool.length === 0 ||
      state.questionIndex >= state.questionPool.length
    ) {
      prepareQuestionPool();
    }
    const question = state.questionPool[state.questionIndex];
    state.questionIndex += 1;
    return question;
  };

  const pickQuestion = () => {
    const question = getNextQuestionFromPool();
    state.currentQuestionStartTime = Date.now();
    state.currentQuestion = question;
    questionCard.textContent = question.label;
    questionCard.classList.remove("slide-left", "slide-right");
    questionCard.classList.add("pop");
    setTimeout(() => questionCard.classList.remove("pop"), 600);
    startQuestionTimer();
  };

  // === 猴子遊戲邏輯 ===
  const updateMonkeyPosition = () => {
    if (!monkeyEmoji) return;

    const trackCells = document.querySelectorAll('.track-cell');
    trackCells.forEach(cell => cell.classList.remove('active'));

    const targetCell = Array.from(trackCells).find(
      cell => parseInt(cell.dataset.position) === state.monkeyPosition
    );

    if (targetCell) {
      monkeyEmoji.classList.remove('move-right', 'move-left', 'eaten');
      targetCell.appendChild(monkeyEmoji);
      targetCell.classList.add('active');
    }
  };

  const moveMonkeyRight = () => {
    if (state.monkeyPosition < 9 && !state.gameOver) {
      monkeyEmoji.classList.add('move-right');
      state.monkeyPosition += 1;

      setTimeout(() => {
        updateMonkeyPosition();
        updateGameStatus('答對！繼續加油 🎉', 'status-success');
      }, 200);
    }
  };

  const moveMonkeyLeft = () => {
    if (state.monkeyPosition > 0 && !state.gameOver) {
      monkeyEmoji.classList.add('move-left');
      state.monkeyPosition -= 1;

      setTimeout(() => {
        updateMonkeyPosition();

        if (state.monkeyPosition === 0) {
          triggerGameOver();
        } else {
          updateGameStatus('小心！猴子往左移動了 ⚠️', 'status-alert');
        }
      }, 200);
    }
  };

  const updateGameStatus = (message, className = '') => {
    if (!gameStatus) return;
    const statusText = gameStatus.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = message;
      statusText.className = `status-text ${className}`;
    }
  };

  const triggerGameOver = () => {
    state.gameOver = true;
    if (state.questionTimerId) {
      clearTimeout(state.questionTimerId);
      state.questionTimerId = null;
    }

    monkeyEmoji.classList.add('eaten');
    crocodileEmoji.classList.add('eating');
    updateGameStatus('猴子被鱷魚吃掉了！遊戲結束 😱', 'status-alert');

    setTimeout(() => {
      endSession();
    }, 1500);
  };

  const startQuestionTimer = () => {
    if (state.questionTimerId) {
      clearTimeout(state.questionTimerId);
    }

    state.questionTimerId = setTimeout(() => {
      if (screens.play.classList.contains("screen--active") && !state.cardLocked && !state.gameOver) {
        handleTimeout();
      }
    }, state.questionTimeLimit);
  };

  const handleTimeout = () => {
    state.cardLocked = true;

    if (state.currentQuestion && state.currentQuestionStartTime > 0) {
      const answerTime = Date.now();
      const duration = answerTime - state.currentQuestionStartTime;
      state.answerLog.push({
        question: state.currentQuestion.label,
        a: state.currentQuestion.a,
        b: state.currentQuestion.b,
        answer: state.currentQuestion.a + state.currentQuestion.b,
        isCorrect: false,
        duration: duration,
        timeout: true,
      });
    }

    state.wrong += 1;
    moveMonkeyLeft();

    questionCard.classList.add("slide-left");
    finishCardAnimation(() => {
      if (state.remainingSeconds > 0 && !state.gameOver) {
        pickQuestion();
      }
    });
  };

  const computeSwipeThreshold = () => Math.min(window.innerWidth * 0.12, 80);

  const applyOrientationLayout = () => {
    const layout =
      window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    appRoot.classList.toggle("layout--landscape", layout === "landscape");
    appRoot.classList.toggle("layout--portrait", layout === "portrait");
    state.swipeThreshold = computeSwipeThreshold();
  };

  const stopTimer = () => {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  };

  const stopCountdown = () => {
    if (state.countdownId) {
      clearInterval(state.countdownId);
      state.countdownId = null;
    }
  };

  const startCountdown = () => {
    if (!hasRequiredSelections()) return;
    stopTimer();
    stopCountdown();
    resetAnimations();
    state.countdownValue = 3;
    countdownNumber.textContent = state.countdownValue;
    showScreen("countdown");
    state.countdownId = setInterval(() => {
      state.countdownValue -= 1;
      if (state.countdownValue <= 0) {
        stopCountdown();
        beginSession();
        return;
      }
      countdownNumber.textContent = state.countdownValue;
    }, 1000);
  };

  const beginSession = () => {
    resetStats();
    showScreen("play");
    state.cardLocked = false;
    prepareQuestionPool();
    pickQuestion();
    state.timerId = setInterval(() => {
      state.remainingSeconds -= 1;
      if (state.remainingSeconds <= 0) {
        state.remainingSeconds = 0;
        updateTimerUI();
        endSession();
        return;
      }
      updateTimerUI();
    }, 1000);
  };

  const finishCardAnimation = (callback) => {
    let hasBeenCalled = false;
    const handle = () => {
      if (hasBeenCalled) return;
      hasBeenCalled = true;
      questionCard.removeEventListener("transitionend", handle);
      questionCard.classList.remove("slide-left", "slide-right");
      state.cardLocked = false;
      callback();
    };
    questionCard.addEventListener("transitionend", handle);
    setTimeout(handle, 320);
  };

  const registerAnswer = (type) => {
    if (!screens.play.classList.contains("screen--active") || state.cardLocked)
      return;
    state.cardLocked = true;


    // 停止單題計時器
    if (state.questionTimerId) {
      clearTimeout(state.questionTimerId);
      state.questionTimerId = null;
    }
    // 記錄答題時間
    if (state.currentQuestion && state.currentQuestionStartTime > 0) {
      const answerTime = Date.now();
      const duration = answerTime - state.currentQuestionStartTime;
      state.answerLog.push({
        question: state.currentQuestion.label,
        a: state.currentQuestion.a,
        b: state.currentQuestion.b,
        answer: state.currentQuestion.a + state.currentQuestion.b,
        isCorrect: type === "correct",
        duration: duration,
      });
    }

    if (type === "correct") {
      state.correct += 1;
      questionCard.classList.add("slide-right");
      moveMonkeyRight();
    } else {
      state.wrong += 1;
      questionCard.classList.add("slide-left");
      moveMonkeyLeft();
    }
    finishCardAnimation(() => {
      if (state.remainingSeconds > 0 && !state.gameOver) {
        pickQuestion();
      }
    });
  };

  const assignedKeyMap = {
    ArrowRight: "correct",
    ArrowLeft: "wrong",
    d: "correct",
    a: "wrong",
  };

  document.addEventListener("keydown", (event) => {
    if (!screens.play.classList.contains("screen--active")) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const action = assignedKeyMap[key];
    if (action) {
      event.preventDefault();
      registerAnswer(action);
    }
  });

  const swipeData = {
    pointerId: null,
    startX: 0,
    dragging: false,
  };

  const clearSwipe = () => {
    if (swipeData.pointerId !== null) {
      try {
        gestureArea.releasePointerCapture(swipeData.pointerId);
      } catch (error) {
        // ignore
      }
    }
    swipeData.pointerId = null;
    swipeData.dragging = false;
    questionCard.style.transform = "";
  };

  gestureArea.addEventListener("pointerdown", (event) => {
    if (!screens.play.classList.contains("screen--active")) return;
    swipeData.pointerId = event.pointerId;
    swipeData.startX = event.clientX;
    swipeData.dragging = true;
    gestureArea.setPointerCapture(event.pointerId);
  });

  gestureArea.addEventListener("pointermove", (event) => {
    if (!swipeData.dragging || event.pointerId !== swipeData.pointerId) return;
    const deltaX = event.clientX - swipeData.startX;
    questionCard.style.transform = `translateX(${deltaX}px)`;
  });

  const completeSwipe = (deltaX) => {
    clearSwipe();
    if (Math.abs(deltaX) < state.swipeThreshold) return;
    if (deltaX > 0) {
      registerAnswer("correct");
    } else {
      registerAnswer("wrong");
    }
  };

  gestureArea.addEventListener("pointerup", (event) => {
    if (!swipeData.dragging || event.pointerId !== swipeData.pointerId) return;
    const deltaX = event.clientX - swipeData.startX;
    completeSwipe(deltaX);
  });

  gestureArea.addEventListener("pointercancel", clearSwipe);

  timeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = parseInt(button.dataset.seconds || "60", 10);
      state.selectedSeconds = seconds;
      timeButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", btn === button ? "true" : "false"),
      );
      updateStartButtonState();
    });
  });

  sumButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const limit = parseInt(button.dataset.sumLimit || "10", 10);
      state.sumLimit = limit;
      sumButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", btn === button ? "true" : "false"),
      );
      updateStartButtonState();
    });
  });

  zeroButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.allowZero = button.dataset.allowZero === "true";
      zeroButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", btn === button ? "true" : "false"),
      );
      updateStartButtonState();
    });
  });

  timeLimitButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.questionTimeLimit = parseInt(button.dataset.timeLimit, 10);
      timeLimitButtons.forEach((btn) =>
        btn.setAttribute("aria-pressed", btn === button ? "true" : "false"),
      );
      updateStartButtonState();
    });
  });

  btnStart.addEventListener("click", startCountdown);
  btnRetry.addEventListener("click", startCountdown);

  const goHome = () => {
    stopTimer();
    stopCountdown();
    resetAnimations();
    showScreen("home");
    resetSelection();
  };

  btnBackHome.addEventListener("click", goHome);

  const resetAnimations = () => {
    if (effectCleanup) {
      effectCleanup();
      effectCleanup = null;
    }
    levelEffects.innerHTML = "";
    resultLevel.classList.remove("is-shaking");
  };

  const endSession = () => {
    if (!screens.play.classList.contains("screen--active")) return;
    stopTimer();
    showScreen("result");
    if (state.questionTimerId) {
      clearTimeout(state.questionTimerId);
      state.questionTimerId = null;
    }
    const total = state.correct + state.wrong;
    const levelKey = getLevelKey(state.correct);
    const level = levelConfig[levelKey];
    resultScore.textContent = state.correct;
    resultLabel.textContent = level.label;
    resultCorrect.textContent = state.correct;
    resultWrong.textContent = state.wrong;
    resultTotal.textContent = total;
    const accuracy =
      total === 0 ? 0 : Math.round((state.correct / total) * 100);
    resultAccuracy.textContent = `${accuracy}%`;
    renderSlowestQuestions();
    renderResultLevel(levelKey);
  };

  const renderSlowestQuestions = () => {
    const slowestContainer = document.getElementById("slowestQuestions");
    if (!slowestContainer) return;

    // 篩選答錯的題目
    const wrongAnswers = state.answerLog.filter(log => !log.isCorrect);

    // 篩選答對但超過1秒的題目
    const slowCorrectAnswers = state.answerLog
      .filter(log => log.isCorrect && log.duration > 1000)
      .sort((a, b) => b.duration - a.duration);

    if (wrongAnswers.length === 0 && slowCorrectAnswers.length === 0) {
      slowestContainer.innerHTML = '<div class="slowest-empty">所有題目都答對且在1秒內完成！太棒了！🎉</div>';
      return;
    }

    let htmlContent = '';

    // 顯示答錯的題目
    if (wrongAnswers.length > 0) {
      const wrongHtml = wrongAnswers.map((log, index) => {
        const seconds = (log.duration / 1000).toFixed(1);
        const timeoutTag = log.timeout ? ' <span class="timeout-tag">超時</span>' : '';
        return `<div class="slowest-item slowest-item--wrong">
          <span class="slowest-rank">${index + 1}</span>
          <span class="slowest-question">${log.question} = ${log.answer}</span>
          <span class="slowest-time">${seconds}秒${timeoutTag}</span>
        </div>`;
      }).join('');

      htmlContent += `
        <div class="slowest-section">
          <div class="slowest-title slowest-title--wrong">答錯的 ${wrongAnswers.length} 題</div>
          <div class="slowest-list">${wrongHtml}</div>
        </div>
      `;
    }

    // 顯示答對但超過1秒的題目
    if (slowCorrectAnswers.length > 0) {
      const slowHtml = slowCorrectAnswers.map((log, index) => {
        const seconds = (log.duration / 1000).toFixed(1);
        return `<div class="slowest-item slowest-item--slow">
          <span class="slowest-rank">${index + 1}</span>
          <span class="slowest-question">${log.question}</span>
          <span class="slowest-time">${seconds}秒</span>
        </div>`;
      }).join('');

      htmlContent += `
        <div class="slowest-section">
          <div class="slowest-title slowest-title--slow">答對但超過1秒的 ${slowCorrectAnswers.length} 題</div>
          <div class="slowest-list">${slowHtml}</div>
        </div>
      `;
    }

    slowestContainer.innerHTML = htmlContent;
  };

  const renderResultLevel = (levelKey) => {
    resetAnimations();
    const config = levelConfig[levelKey];
    levelTitle.textContent = config.label;
    levelMessage.textContent = config.message;
    resultLevel.classList.remove(
      "level-amazing",
      "level-excellent",
      "level-good",
      "level-tryagain",
    );
    resultLevel.classList.add(`level-${levelKey}`);
    triggerLevelEffect(levelKey);
  };

  const levelEffectTimers = [];

  const registerEffectCleanup = (cleanup) => {
    effectCleanup = () => {
      cleanup();
      levelEffectTimers.forEach((timer) => clearTimeout(timer));
      levelEffectTimers.length = 0;
    };
  };

  const triggerLevelEffect = (levelKey) => {
    switch (levelKey) {
      case "amazing":
        spawnConfetti(42);
        break;
      case "excellent":
        spawnBubblesAndStars();
        break;
      case "good":
        spawnRings();
        break;
      case "tryagain":
        resultLevel.classList.add("is-shaking");
        levelEffectTimers.push(
          setTimeout(() => resultLevel.classList.remove("is-shaking"), 3000),
        );
        registerEffectCleanup(() => {
          levelEffects.innerHTML = "";
          resultLevel.classList.remove("is-shaking");
        });
        break;
      default:
        break;
    }
  };

  const spawnConfetti = (count) => {
    const colors = ["#ff6b6b", "#ffd166", "#1fbf75", "#2b8cff", "#d977ff"];
    levelEffects.innerHTML = "";
    for (let i = 0; i < count; i += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.top = `${-20 + Math.random() * 30}px`;
      piece.style.background =
        colors[Math.floor(Math.random() * colors.length)];
      piece.style.setProperty(
        "--confetti-x",
        `${(Math.random() - 0.5) * 240}px`,
      );
      piece.style.animationDelay = `${Math.random() * 0.5}s`;
      levelEffects.appendChild(piece);
    }
    const cleanup = () => {
      levelEffects.innerHTML = "";
    };
    registerEffectCleanup(cleanup);
    levelEffectTimers.push(setTimeout(cleanup, 6500));
  };

  const spawnBubblesAndStars = () => {
    levelEffects.innerHTML = "";
    for (let i = 0; i < 14; i += 1) {
      const bubble = document.createElement("span");
      bubble.className = "bubble";
      bubble.style.left = `${Math.random() * 100}%`;
      bubble.style.bottom = "0";
      bubble.style.animationDelay = `${Math.random() * 0.8}s`;
      levelEffects.appendChild(bubble);
    }
    for (let i = 0; i < 10; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 100}%`;
      star.style.animationDelay = `${Math.random() * 1.2}s`;
      levelEffects.appendChild(star);
    }
    const cleanup = () => {
      levelEffects.innerHTML = "";
    };
    registerEffectCleanup(cleanup);
    levelEffectTimers.push(setTimeout(cleanup, 6200));
  };

  const spawnRings = () => {
    levelEffects.innerHTML = "";
    const ring = document.createElement("span");
    ring.className = "ring";
    levelEffects.appendChild(ring);
    const cleanup = () => {
      levelEffects.innerHTML = "";
    };
    registerEffectCleanup(cleanup);
    levelEffectTimers.push(setTimeout(cleanup, 6000));
  };

  const getLevelKey = (score) => {
    if (score >= 30) return "amazing";
    if (score >= 20) return "excellent";
    if (score >= 15) return "good";
    return "tryagain";
  };

  const resetSelection = () => {
    state.selectedSeconds = 0;
    state.sumLimit = null;
    state.allowZero = null;
    state.questionTimeLimit = 2000;
    state.questionPool = [];
    state.questionIndex = 0;
    btnStart.disabled = true;
    btnStart.setAttribute("aria-disabled", "true");
    timeButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    sumButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    zeroButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    timeLimitButtons.forEach((btn) => btn.setAttribute("aria-pressed", "false"));
    updateStartButtonState();
  };

  const init = () => {
    applyOrientationLayout();
    resetSelection();
    showScreen("home");
  };

  window.addEventListener("resize", applyOrientationLayout);
  window.addEventListener("orientationchange", applyOrientationLayout);

  init();
})();
