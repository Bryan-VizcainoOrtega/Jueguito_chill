let totalMoney = 0;       // Dinero acumulado (persistente entre partidas)
let bonusTime = 0;        // Tiempo extra a aplicar en la siguiente partida
let matchesFound = 0;
let timeLeft;             // Se inicializa en initGame
let timerInterval;
let timerStarted = false; // Bandera para iniciar el temporizador solo al voltear la primera carta
let firstCard = null;
let secondCard = null;
let lockBoard = false;

/* 
  Array de emojis empresariales/tecnológicos:
  💼, 📈, 💻, 📱, 🏢, 🚀, 📊, 🖥️, 🤖, 🔧, 📝, 📡
*/
const emojis = ['💼', '📈', '💻', '📱', '🏢', '🚀', '📊', '🖥️', '🤖', '🔧', '📝', '📡'];
let cardValues = [];

// Referencias a elementos del DOM
const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startScreen = document.getElementById('start-screen');
const gameContainer = document.getElementById('game-container');
const endScreen = document.getElementById('end-screen');
const endTitle = document.getElementById('end-title');
const endMessage = document.getElementById('end-message');
const storeScreen = document.getElementById('store-screen');
const quizScreen = document.getElementById('quiz-screen');
const narrativeContainer = document.getElementById('narrative-container');
const narrativeTitle = document.getElementById('narrative-title');
const narrativeText = document.getElementById('narrative-text');
const continueBtn = document.getElementById('continue-btn');
const quizContainer = document.getElementById('quiz-container');
const quizForm = document.getElementById('quiz-form');
const quizQuestion = document.getElementById('quiz-question');

// Botones de las pantallas
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const storeBtn = document.getElementById('store-btn');
const buyBonusBtn = document.getElementById('buy-bonus-btn');
const cancelStoreBtn = document.getElementById('cancel-store-btn');

// Referencias a los audios
const flipSound = document.getElementById('flip-sound');
const matchSound = document.getElementById('match-sound');
const errorSound = document.getElementById('error-sound');
const winSound = document.getElementById('win-sound');
const loseSound = document.getElementById('lose-sound');

// Función para mezclar un array (algoritmo Fisher-Yates)
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Formatea el tiempo en formato MM:SS
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m < 10 ? "0" + m : m}:${s < 10 ? "0" + s : s}`;
}

// Actualiza la visualización de dinero y temporizador
function updateScoreboard() {
  scoreDisplay.textContent = `Dinero: ${totalMoney} 💵`;
  timerDisplay.textContent = `Tiempo: ${formatTime(timeLeft)}`;
}

// Inicializa el juego (80 segundos base + bonus)
function initGame() {
  matchesFound = 0;
  timerStarted = false; // Resetea la bandera para iniciar el temporizador al voltear la primera carta
  timeLeft = 80 + bonusTime;
  bonusTime = 0;
  updateScoreboard();
  clearInterval(timerInterval);
  
  // Crea y mezcla las cartas (6 pares -> 12 tarjetas)
  cardValues = shuffle(emojis.slice(0, 6).concat(emojis.slice(0, 6)));
  
  // Limpia el tablero y genera las tarjetas
  gameBoard.innerHTML = '';
  cardValues.forEach(value => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.value = value;
    card.innerHTML = `
      <div class="card-inner">
        <div class="card-front">${value}</div>
        <div class="card-back">❓</div>
      </div>
    `;
    card.addEventListener('click', flipCard);
    gameBoard.appendChild(card);
  });
  
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

// Inicia el temporizador
function startTimer() {
  timerStarted = true;
  timerInterval = setInterval(() => {
    timeLeft--;
    updateScoreboard();
    if(timeLeft <= 0) {
      clearInterval(timerInterval);
      loseGame();
    }
  }, 1000);
}

// Función para voltear una tarjeta
function flipCard() {
  if (lockBoard) return;
  if (this.classList.contains('flipped')) return;
  if (this === firstCard) return;
  
  this.classList.add('flipped');
  
  // Reproduce el sonido de voltear
  flipSound.currentTime = 0;
  flipSound.play();
  
  // Inicia el temporizador en la primera carta volteada
  if (!timerStarted) {
    startTimer();
  }
  
  if (!firstCard) {
    firstCard = this;
    return;
  }
  
  secondCard = this;
  checkForMatch();
}

// Verifica si las dos tarjetas coinciden
function checkForMatch() {
  const isMatch = firstCard.dataset.value === secondCard.dataset.value;
  if (isMatch) {
    totalMoney += 10;
    matchesFound++;
    matchSound.currentTime = 0;
    matchSound.play();
    disableCards();
    updateScoreboard();
    if(matchesFound === cardValues.length / 2) {
      winGame();
    }
  } else {
    totalMoney = Math.max(0, totalMoney - 1);
    updateScoreboard();
    setTimeout(() => {
      errorSound.currentTime = 0;
      errorSound.play();
    }, 600);
    unflipCards();
  }
}

// Deshabilita las tarjetas que hicieron match
function disableCards() {
  firstCard.removeEventListener('click', flipCard);
  secondCard.removeEventListener('click', flipCard);
  resetBoard();
}

// Si no coinciden, se vuelven a voltear tras 1 segundo
function unflipCards() {
  lockBoard = true;
  setTimeout(() => {
    firstCard.classList.remove('flipped');
    secondCard.classList.remove('flipped');
    resetBoard();
  }, 1000);
}

// Reinicia las variables de control de tarjetas
function resetBoard() {
  [firstCard, secondCard] = [null, null];
  lockBoard = false;
}

// Arreglo de narrativas de despliegue (casos empresariales) – cada historia describe un escenario de implementación de sistemas sin mencionar explícitamente la estrategia:
const deploymentStories = [
  {
    story: "Una empresa de e-commerce experimentó una falla crítica en su sistema de pagos durante una campaña de alto volumen. Ante la urgencia de restaurar el servicio, la dirección decidió intervenir de forma inmediata, aplicando una actualización en el entorno productivo.",
    type: "directa",
    continuation: "La acción rápida permitió reestablecer el servicio, resaltando la necesidad de mecanismos preventivos."
  },
  {
    story: "Una compañía financiera planificaba actualizar su plataforma de gestión de inversiones. Se optó por comenzar con un piloto en un entorno controlado, extender la actualización a una región y, tras evaluar los resultados, implementarla en toda la organización.",
    type: "fases",
    continuation: "El enfoque escalonado permitió identificar y corregir problemas en cada etapa, asegurando una transición fluida."
  },
  {
    story: "Una empresa de software estaba a punto de lanzar un nuevo sistema de gestión interna. Primero lo implementaron en la sede central para afinar los parámetros, y una vez comprobado su rendimiento, lo desplegaron en las diferentes sucursales.",
    type: "local",
    continuation: "Esta estrategia permitió adaptar el sistema a las particularidades de cada oficina, minimizando riesgos."
  },
  {
    story: "Una corporación tecnológica se enfrentaba al desafío de modernizar su infraestructura. Para evaluar la mejor opción, pusieron a prueba dos versiones de su sistema simultáneamente: una que mantenía la solución existente y otra con una arquitectura renovada, cada una operando en entornos de prueba.",
    type: "paralelo",
    continuation: "El análisis comparativo entre ambas alternativas facilitó la toma de decisiones, considerando rendimiento y costos."
  }
];

let currentStory = null;

// Muestra la pantalla de narrativa y prepara el quiz
function showQuizScreen() {
  let randomIndex = Math.floor(Math.random() * deploymentStories.length);
  currentStory = deploymentStories[randomIndex];
  narrativeTitle.textContent = "Desafío Estratégico";
  narrativeText.textContent = currentStory.story;
  quizScreen.style.display = 'flex';
  narrativeContainer.style.display = 'block';
  quizContainer.style.display = 'none';
}

// Función llamada al ganar el juego
function winGame() {
  clearInterval(timerInterval);
  winSound.currentTime = 0;
  winSound.play();
  setTimeout(() => {
    showQuizScreen();
  }, 500);
}

// Función llamada al perder el juego (tiempo agotado)
function loseGame() {
  lockBoard = true;
  loseSound.currentTime = 0;
  loseSound.play();
  setTimeout(() => {
    endScreen.style.display = 'flex';
    endTitle.textContent = 'Desafío Fallido';
    const loseMessages = [
      'Cada revés es una oportunidad para aprender.',
      'No te rindas: el verdadero crecimiento nace del esfuerzo.',
      'Los obstáculos impulsan la mejora continua.'
    ];
    endMessage.textContent = loseMessages[Math.floor(Math.random() * loseMessages.length)];
  }, 500);
}

// Reinicia el juego (oculta pantallas superpuestas y reinicia el tablero)
function restartGame() {
  quizScreen.style.display = 'none';
  endScreen.style.display = 'none';
  storeScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  initGame();
}

// Lógica de la tienda: Comprar bonus de +10 segundos por 20 dinero
function buyBonus() {
  if(totalMoney >= 20) {
    totalMoney -= 20;
    bonusTime = 10; // Se sumarán 10 segundos en la siguiente partida
    updateScoreboard();
    alert("¡Has adquirido +10 segundos para la próxima partida!");
    restartGame();
  } else {
    alert("No cuentas con suficiente dinero para este bonus.");
  }
}

// Eventos para iniciar, reiniciar y acceder a la tienda
startBtn.addEventListener('click', () => {
  startScreen.style.opacity = '0';
  setTimeout(() => {
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    initGame();
  }, 800);
});

restartBtn.addEventListener('click', restartGame);
storeBtn.addEventListener('click', () => {
  endScreen.style.display = 'none';
  storeScreen.style.display = 'flex';
});
buyBonusBtn.addEventListener('click', buyBonus);
cancelStoreBtn.addEventListener('click', () => {
  storeScreen.style.display = 'none';
  endScreen.style.display = 'flex';
});

// Al pulsar "Continuar" se oculta la narrativa y se muestra el quiz
continueBtn.addEventListener('click', () => {
  narrativeContainer.style.display = 'none';
  quizContainer.style.display = 'block';
});

// Evento para procesar la respuesta del quiz
quizForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const selectedOption = document.querySelector('input[name="quiz-option"]:checked');
  if (!selectedOption) {
    alert("Por favor, selecciona una opción.");
    return;
  }
  const answer = selectedOption.value;
  let bonusAmount, penaltyAmount;
  if (answer === currentStory.type) {
    bonusAmount = Math.max(5, Math.floor(totalMoney * 0.1));
    totalMoney += bonusAmount;
    alert("¡Correcto! " + currentStory.continuation + "\nHas ganado " + bonusAmount + " dinero extra.");
  } else {
    penaltyAmount = Math.max(10, Math.floor(totalMoney * 0.2));
    totalMoney = Math.max(0, totalMoney - penaltyAmount);
    alert("Incorrecto. La estrategia correcta fue distinta.\n" 
          + currentStory.continuation + "\nHas perdido " + penaltyAmount + " dinero.");
  }
  updateScoreboard();
  quizForm.reset();
  restartGame();
});
