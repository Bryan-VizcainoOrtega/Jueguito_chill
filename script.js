let totalGold = 0;       // Monedas acumuladas (persisten entre partidas)
let bonusTime = 0;       // Tiempo extra a aplicar en la siguiente partida
let matchesFound = 0;
let timeLeft;            // Se inicializa en initGame
let timerInterval;
let timerStarted = false; // Bandera para iniciar el temporizador solo al voltear la primera carta
let firstCard = null;
let secondCard = null;
let lockBoard = false;

/* 
  Array de emojis medievales:
  🗡️, 🛡️, 🐉, 🏹, 👑, 🏰, ⚔️, 🐴, 🧙‍♂️, 🤴, 👸, 🧝
*/
const emojis = ['🗡️', '🛡️', '🐉', '🏹', '👑', '🏰', '⚔️', '🐴', '🧙‍♂️', '🤴', '👸', '🧝'];
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

// Actualiza la visualización de oro y temporizador
function updateScoreboard() {
  scoreDisplay.textContent = `Oro: ${totalGold} 🪙`;
  timerDisplay.textContent = `Tiempo: ${formatTime(timeLeft)}`;
}

// Inicializa el juego (el tiempo base es 80 segundos = 1:20, más bonus si lo hay)
function initGame() {
  matchesFound = 0;
  timerStarted = false; // Resetea la bandera para iniciar el temporizador al voltear la primera carta
  timeLeft = 80 + bonusTime;
  bonusTime = 0;
  updateScoreboard();
  clearInterval(timerInterval);
  
  // Crea y mezcla las cartas (12 pares -> 24 tarjetas)
  cardValues = shuffle(emojis.concat(emojis));
  
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
  
  // Si es la primera carta volteada, inicia el temporizador
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
    totalGold += 10;
    matchesFound++;
    matchSound.currentTime = 0;
    matchSound.play();
    disableCards();
    updateScoreboard();
    if(matchesFound === emojis.length) {
      winGame();
    }
  } else {
    totalGold = Math.max(0, totalGold - 1);
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

// Función llamada al ganar el juego
function winGame() {
  clearInterval(timerInterval);
  winSound.currentTime = 0;
  winSound.play();
  setTimeout(() => {
    showEndScreen(true);
  }, 500);
}

// Función llamada al perder el juego (tiempo agotado)
function loseGame() {
  lockBoard = true;
  loseSound.currentTime = 0;
  loseSound.play();
  setTimeout(() => {
    showEndScreen(false);
  }, 500);
}

// Muestra la pantalla de fin con opciones
function showEndScreen(won) {
  endScreen.style.display = 'flex';
  if(won) {
    endTitle.textContent = '¡Felicidades, has ganado!';
    const winMessages = [
      'La victoria es fruto de la perseverancia.',
      'Cada batalla ganada te hace más sabio.',
      'El valor y la determinación te han llevado a la gloria.'
    ];
    endMessage.textContent = winMessages[Math.floor(Math.random() * winMessages.length)];
  } else {
    endTitle.textContent = 'Has perdido...';
    const loseMessages = [
      'Cada derrota es una lección para el futuro.',
      'No te rindas, el camino hacia la gloria está lleno de desafíos.',
      'Las cicatrices de la derrota forjan a los verdaderos guerreros.'
    ];
    endMessage.textContent = loseMessages[Math.floor(Math.random() * loseMessages.length)];
  }
}

// Reinicia el juego (oculta pantallas superpuestas y reinicia el tablero)
function restartGame() {
  endScreen.style.display = 'none';
  storeScreen.style.display = 'none';
  gameContainer.style.display = 'block';
  initGame();
}

// Lógica de la tienda: Comprar bonus de +10 segundos por 20 monedas
function buyBonus() {
  if(totalGold >= 20) {
    totalGold -= 20;
    bonusTime = 10; // Se sumarán 10 segundos en la siguiente partida
    updateScoreboard();
    alert("¡Has comprado +10 segundos para la próxima partida!");
    restartGame();
  } else {
    alert("No tienes suficientes monedas para comprar este bonus.");
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
