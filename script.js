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

// Actualiza la visualización de oro y temporizador
function updateScoreboard() {
  scoreDisplay.textContent = `Oro: ${totalGold} 🪙`;
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
  
  // Crea y mezcla las cartas (8 pares -> 16 tarjetas)
  cardValues = shuffle(emojis.slice(0, 8).concat(emojis.slice(0, 8)));
  
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
    totalGold += 10;
    matchesFound++;
    matchSound.currentTime = 0;
    matchSound.play();
    disableCards();
    updateScoreboard();
    if(matchesFound === cardValues.length / 2) {
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

// Arreglo de narrativas de despliegue
const deploymentStories = [
  {
    story: "El Rey, alarmado por un mensajero que trae noticias de un inminente ataque, ordena reemplazar a los veteranos defensores por una nueva unidad de caballeros entrenados. Sin intermediarios, el reino se fortalece al instante para enfrentar la amenaza.",
    type: "directa",
    continuation: "La seguridad se restablece y la corte celebra una victoria rotunda."
  },
  {
    story: "Una terrible plaga azota las tierras y los sabios del reino invocan de inmediato un hechizo unificado que erradica la enfermedad, dejando atrás antiguas prácticas en favor de una solución inmediata.",
    type: "directa",
    continuation: "La vida renace en cada rincón, y la esperanza se multiplica."
  },
  {
    story: "Al descubrir que un siniestro personaje ha infiltrado la corte, el monarca decide renovar por completo a sus consejeros, optando por una solución rápida para restaurar la justicia y la paz.",
    type: "directa",
    continuation: "El reino recupera su orden y la traición se olvida en el fragor del triunfo."
  },
  {
    story: "Exploradores hallan una cueva oculta donde mora una temible bestia. En vez de lanzarse al combate sin pensar, el reino actúa con cautela: primero estudian la caverna, luego analizan al monstruo y, finalmente, ejecutan una ofensiva meticulosa.",
    type: "fases",
    continuation: "La bestia es vencida y el misterio de la cueva inspira futuras leyendas."
  },
  {
    story: "Ante la amenaza constante de invasiones, el monarca ordena una reconstrucción escalonada de las defensas: se refuerza la muralla sur, se reactivan las torres de vigilancia y, finalmente, se modernizan los sistemas de alerta.",
    type: "fases",
    continuation: "Cada fortificación erige un símbolo de progreso, protegiendo al reino a lo largo del tiempo."
  },
  {
    story: "Cuando una tormenta mágica asola la región norte, el Consejo de Magos actúa progresivamente: primero envían hechiceros para contener el fenómeno, luego erigen barreras protectoras y, finalmente, restablecen el equilibrio natural.",
    type: "fases",
    continuation: "La tormenta se disipa y la armonía regresa, sellando el destino de la región."
  },
  {
    story: "Un astuto mercader prueba una innovadora ruta comercial en una aldea fronteriza. Tras comprobar su éxito en ese enclave, la estrategia se extiende al resto del reino, transformando el comercio.",
    type: "local",
    continuation: "El comercio florece y la prosperidad se derrama por cada rincón del reino."
  },
  {
    story: "En una aldea remota azotada por bandidos, el Consejo real decide enviar refuerzos para evaluar una nueva táctica defensiva, que, al demostrar eficacia, se replica en otras regiones.",
    type: "local",
    continuation: "La seguridad se consolida y las aldeas celebran la nueva era de protección."
  },
  {
    story: "Mientras el método tradicional de recaudar tributos sigue vigente, el monarca introduce una alternativa revolucionaria. Durante un tiempo, ambos sistemas conviven para medir cuál optimiza mejor la obtención de oro.",
    type: "paralelo",
    continuation: "El balance se inclina y se establece una forma más eficiente de sostener el reino."
  },
  {
    story: "Ante una inminente crisis alimentaria, el reino pone en marcha dos estrategias de cultivo al mismo tiempo —la ancestral y una técnica renovada— para determinar, mediante comparación, cuál garantiza la prosperidad del pueblo.",
    type: "paralelo",
    continuation: "Los campos florecen y la abundancia se consolida en cada cosecha."
  },
  {
    story: "Un mago descubre en antiguos pergaminos la profecía de una inminente invasión de criaturas místicas. Primero, convoca una barrera protectora en el corazón del castillo para probar su poder; luego, tras comprobar su eficacia, extiende el conjuro a todas las murallas.",
    type: "fases",
    continuation: "La amenaza se desvanece y la magia del reino se fortalece con cada muro encantado."
  },
  {
    story: "Rumores de un tesoro escondido en las montañas impulsan a un grupo de aventureros a ensayar una novedosa estrategia de exploración. La técnica, aplicada en los picos, se consolida y se adopta en futuras expediciones.",
    type: "local",
    continuation: "El misterio del tesoro se resuelve, abriendo caminos hacia nuevas riquezas."
  },
  {
    story: "Una misteriosa señal emana del bosque encantado, insinuando un poder ancestral. Los guardianes del reino comienzan un experimento en una pequeña sección del bosque; al comprobar su eficacia, extienden la protección a todo el territorio.",
    type: "local",
    continuation: "El bosque se llena de luz y la leyenda del poder ancestral se inscribe en la historia del reino."
  },
  {
    story: "Durante una asamblea, los consejeros proponen reinventar las fortificaciones del reino. Artesanos trabajan en dos frentes: renovando los escudos de los guerreros y reforzando las murallas, permitiendo evaluar la nueva táctica sin alterar la vida cotidiana.",
    type: "paralelo",
    continuation: "La innovación se integra en la estructura real, dando paso a una era de seguridad reforzada."
  },
  {
    story: "Cuando sombras amenazan con invadir el reino, el Consejo convoca a sus mejores estrategas para probar tácticas de defensa y magia en un entorno controlado en una aldea fronteriza.",
    type: "paralelo",
    continuation: "El experimento se convierte en la clave para una defensa unificada, y el reino se alza en glorioso triunfo."
  }
];

let currentStory = null;

// Muestra la pantalla de narrativa y prepara el quiz
function showQuizScreen() {
  let randomIndex = Math.floor(Math.random() * deploymentStories.length);
  currentStory = deploymentStories[randomIndex];
  narrativeTitle.textContent = "¡Has desvelado un secreto!";
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
    // Se muestra la narrativa y luego el quiz en lugar de la pantalla de fin tradicional
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
    endTitle.textContent = 'Has perdido...';
    const loseMessages = [
      'Cada derrota es una lección para el futuro.',
      'No te rindas, el camino hacia la gloria está lleno de desafíos.',
      'Las cicatrices de la derrota forjan a los verdaderos guerreros.'
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
    bonusAmount = Math.max(5, Math.floor(totalGold * 0.1));
    totalGold += bonusAmount;
    alert("¡Correcto! " + currentStory.continuation + "\nHas ganado " + bonusAmount + " monedas extra.");
  } else {
    penaltyAmount = Math.max(10, Math.floor(totalGold * 0.2));
    totalGold = Math.max(0, totalGold - penaltyAmount);
    // En caso de error se muestra la respuesta correcta junto con la justificación
    alert("Incorrecto. La respuesta correcta era: " + currentStory.type + ". " 
          + currentStory.continuation + "\nHas perdido " + penaltyAmount + " monedas.");
  }
  updateScoreboard();
  quizForm.reset();
  restartGame();
});
