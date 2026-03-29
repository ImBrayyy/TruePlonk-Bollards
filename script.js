const STORAGE_KEY = "bollardCountryStats";

const RETRY_WITHIN = 10;

let bollards = [];
let currentQuestion = null;
let answered = false;
let questionNumber = 0;

let retryQueue = [];
let recentlyUsedIds = [];

const bollardImage = document.getElementById("bollard-image");
const resultMessage = document.getElementById("result-message");
const answerButtons = document.querySelectorAll(".answer-button");

async function startGame() {
  try {
    const response = await fetch("data/bollards.json");
    bollards = await response.json();

    if (bollards.length < 4) {
      resultMessage.textContent = "You need at least 4 bollard images in your JSON file.";
      return;
    }

    loadNextQuestion();
  } catch (error) {
    resultMessage.textContent = "Could not load bollards.json. Make sure you are using a local server.";
    console.error(error);
  }
}

function loadNextQuestion() {
  answered = false;
  resultMessage.textContent = "";
  resultMessage.className = "";

  questionNumber += 1;
  currentQuestion = buildQuestion();

  bollardImage.src = currentQuestion.correct.image;
  bollardImage.alt = currentQuestion.correct.country + " bollard";

  answerButtons.forEach((button, index) => {
    button.disabled = false;
    button.textContent = currentQuestion.options[index];
    button.classList.remove("correct", "wrong");

    button.onclick = function () {
      handleAnswer(button.textContent, button);
    };
  });
}

function buildQuestion() {
  let correct = null;

  const dueRetryIndex = retryQueue.findIndex((item) => item.dueQuestion <= questionNumber);

  if (dueRetryIndex !== -1) {
    correct = retryQueue.splice(dueRetryIndex, 1)[0];
  } else {
    const available = bollards.filter(
      (bollard) => !recentlyUsedIds.includes(bollard.id)
    );

    const pool = available.length > 0 ? available : bollards;
    correct = pool[Math.floor(Math.random() * pool.length)];
  }

  recentlyUsedIds.push(correct.id);

  if (recentlyUsedIds.length > 8) {
    recentlyUsedIds.shift();
  }

  const allCountries = [...new Set(bollards.map((bollard) => bollard.country))];
  const wrongCountries = shuffleArray(
    allCountries.filter((country) => country !== correct.country)
  ).slice(0, 3);

  const options = shuffleArray([correct.country, ...wrongCountries]);

  return {
    correct,
    options
  };
}

function handleAnswer(selectedCountry, clickedButton) {
  if (answered) {
    return;
  }

  

  answered = true;

  const wasCorrect = selectedCountry === currentQuestion.correct.country;

  updateCountryStats(currentQuestion.correct.country, wasCorrect);

  if (wasCorrect) {
    clickedButton.classList.add("correct");
  } else {
    clickedButton.classList.add("wrong");
    addToRetryQueue(currentQuestion.correct);

    answerButtons.forEach((button) => {
      if (button.textContent === currentQuestion.correct.country) {
        button.classList.add("correct");
      }
    });
  }

  answerButtons.forEach((button) => {
    button.disabled = true;
  });

  setTimeout(loadNextQuestion, 1500);
}

function addToRetryQueue(bollard) {
  const alreadyQueued = retryQueue.some((item) => item.id === bollard.id);

  if (!alreadyQueued) {
    retryQueue.push({
      ...bollard,
      dueQuestion: questionNumber + Math.floor(Math.random() * RETRY_WITHIN) + 2
    });
  }
}

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function updateCountryStats(country, wasCorrect) {
  const saved = localStorage.getItem(STORAGE_KEY);
  const countryStats = saved ? JSON.parse(saved) : {};

  if (!countryStats[country]) {
    countryStats[country] = {
      correct: 0,
      total: 0
    };
  }

  countryStats[country].total += 1;

  if (wasCorrect) {
    countryStats[country].correct += 1;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(countryStats));
}

startGame();