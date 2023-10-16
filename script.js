let canvas = document.querySelector('canvas');
let wrapper = document.querySelector('.wrapper');
let resetGameBtn = document.querySelector('#reset');
let diceDisplay = document.querySelector('#diceThrow');
let playerDisplay = document.querySelector('.playerName');
let message = document.querySelector('.message');
let ctx = canvas.getContext('2d');
let height = 500;
let width = 500;
let gridSize = 50;
let gridMid = 25;
let walking, walkSpeed = 450;
let locked = false;
let slideSpeed = .5;
let rolling, rollCount, rollMax, rollSpeed = 85;
let rollingSound = new Audio('dice_sound.wav')
let jumpSound = new Audio('jump.mp3');


let diceResults = {};

let players = [];

let activePlayer;

const playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

const obstacles = [
    { type: 'snake', start: 99, end: 41 },
    { type: 'snake', start: 89, end: 53 },
    { type: 'snake', start: 76, end: 58 },
    { type: 'snake', start: 66, end: 45 },
    { type: 'snake', start: 54, end: 31 },
    { type: 'snake', start: 43, end: 18 },
    { type: 'snake', start: 40, end: 3 },
    { type: 'snake', start: 27, end: 5 },
    { type: 'snake', start: 32, end: 10 },
    { type: 'ladder', start: 4, end: 25 },
    { type: 'ladder', start: 13, end: 46 },
    { type: 'ladder', start: 50, end: 69 },
    { type: 'ladder', start: 42, end: 63 },
    { type: 'ladder', start: 62, end: 81 },
    { type: 'ladder', start: 74, end: 92 },
];

canvas.width = width;
canvas.height = height;
wrapper.style.width = `${width}px`;
ctx.strokeStyle = '#555';
ctx.lineWidth = 2;

const setLocked = (tf) => {
    locked = tf;
};

const boustrophedonWalk = (cols, rows) => {
    let temp = [];
    for (let row = 0; row < rows; row++) {
        let t = Array.apply(null, Array(cols)).map((x, col) => {
            return { id: col + row * cols, y: height - gridSize - row * gridSize, x: col * gridSize };
        });
        t = row % 2 ? t.reverse() : t;
        temp = [...temp, ...t];
    }
    return temp;
};

const drawPlayers = () => {
    ctx.clearRect(0, 0, width, height);
    const positionCounts = {};

    players.forEach((player) => {
        if (player.current > 0) {
            if (positionCounts[player.current]) {
                positionCounts[player.current].push(player.colour);
            } else {
                positionCounts[player.current] = [player.colour];
            }
        }
    });

    for (const position in positionCounts) {
        const colors = positionCounts[position];
        colors.forEach((colour, index) => {
            ctx.fillStyle = colour;
            ctx.beginPath();
            const offsetX = index * 20;
            const offsetY = index * 20;
            ctx.arc(
                players.find((player) => player.current == position).x + gridMid + offsetX,
                players.find((player) => player.current == position).y + gridMid + offsetY,
                16,
                0,
                2 * Math.PI
            );
            ctx.fill();
            ctx.stroke();
        });
    }
};


const walk = async () => {
    let activeCounter = activePlayer.current++;
    let sliding = false;
    activePlayer.x = walkSequence[activeCounter].x;
    activePlayer.y = walkSequence[activeCounter].y;
    drawPlayers();

    if (activeCounter === 99) {
        clearInterval(walking);
        showWinner();
        return;
    }

    if (activePlayer.current >= activePlayer.target) {
        clearInterval(walking);
        const questionData = getRandomQuestion();

        for (let i = 0; i < obstacles.length; i++) {
            if (obstacles[i].start === activePlayer.target) {
                const isCorrect = await displayQuestion(questionData);
                if (isCorrect) {
                    let endSquare = obstacles[i].end;
                    activePlayer.target = obstacles[i].end;
                    slide(activePlayer, walkSequence[endSquare - 1].x, walkSequence[endSquare - 1].y, slideSpeed);
                    sliding = true;
                    jumpSound.play();
                    break;
                }
            }
        }

        if (!sliding) {
            resetTurn();
            togglePlayer();
        }
    }
};

const showWinner = () => {
    const messageElement = document.querySelector(".playerName");

    if (messageElement.innerText.endsWith(" is the winner")) {
        messageElement.innerText = `${activePlayer.id} is the winner`;
    } else {
        messageElement.innerText = `${activePlayer.id} are the winner`;
    }

    resetGameBtn.classList.remove('hidden');
};

const setPlayerID = (msg = '') => {
    playerDisplay.innerHTML = `${activePlayer.id} ${msg}`;
    message.innerHTML = "Click dice to play";
    document.body.classList = `player${activePlayer.id}`;
};

const resetTurn = () => {
    setLocked(false);
};

const slide = (element, dX, dY, dur = 1) => {
    gsap.to(element, { x: dX, y: dY, duration: dur, delay: 0.25, onUpdate: doOnUpdate, onComplete: doOnComplete });
};

const doOnUpdate = () => {
    drawPlayers();
};

const doOnComplete = () => {
    activePlayer.current = activePlayer.target;
    drawPlayers();
    resetTurn();
    togglePlayer();
};

const togglePlayer = () => {
    const currentIndex = players.indexOf(activePlayer);
    activePlayer = players[(currentIndex + 1) % players.length];
    setPlayerID();
};

const rollDice = (evt) => {
    if (evt) evt.preventDefault();
    if (locked) return;
    setLocked(true);

    message.innerHTML = `${activePlayer.id === 'You' ? 'Rolling...' : 'Auto rolling...'}`;

    rollCount = 0;
    rollMax = Math.random() * 10 + 15;
    rolling = setInterval(doRoll, rollSpeed);
};

const doRoll = () => {
    rollingSound.play(); 
    rolled = Math.floor(Math.random() * 6 + 1);

    diceRollDisplay(rolled);
    if (rollCount++ >= rollMax) {
        clearInterval(rolling);
        message.innerHTML = "Moving...";
        activePlayer.target += rolled;
        walking = setInterval(walk, walkSpeed);
    }
};

const diceRollDisplay = (spots) => {
    diceDisplay.classList = `s${spots}`;
};

const resetGame = () => {
    players.forEach((player) => {
        player.current = 0;
        player.target = 0;
        player.x = 0;
        player.y = 0;
    });
    activePlayer = players[0];
    locked = false;
    diceRollDisplay('');
    setPlayerID();

    drawPlayers();

};



diceDisplay.addEventListener('click', rollDice);
resetGameBtn.addEventListener('click', resetGame);

let walkSequence = boustrophedonWalk(10, 10);

const questions = [
    {
        question: "What is the capital of France?",
        choices: ["Paris", "London", "Berlin"],
        correctAnswer: "Paris",
    },
    {
        question: "Which planet is known as the Red Planet?",
        choices: ["Earth", "Mars", "Venus"],
        correctAnswer: "Mars",
    },
    {
        question: "What is 2 + 2?",
        choices: ["3", "4", "5"],
        correctAnswer: "4",
    },
    {
        question: "Which gas do plants absorb from the atmosphere?",
        choices: ["Oxygen", "Carbon Dioxide", "Nitrogen"],
        correctAnswer: "Carbon Dioxide",
    },
];

const getRandomQuestion = () => {
    return questions[Math.floor(Math.random() * questions.length)];
};

const displayQuestion = async (questionData) => {
    return new Promise((resolve, reject) => {
        const questionPopup = document.getElementById('snakeLadderPopup');
        const questionText = document.getElementById('questionText');
        const choicesList = document.getElementById('choices');
        const continueButton = document.getElementById('continueButton');

        const { question, choices, correctAnswer } = questionData;

        questionText.textContent = question;

        choicesList.innerHTML = '';
        choices.forEach((choice, index) => {
            const choiceElement = document.createElement('li');
            choiceElement.textContent = choice;
            choiceElement.classList.add('choice');
            choiceElement.addEventListener('click', () => {
                questionPopup.style.display = 'none';
                
                const isCorrect = choice === correctAnswer;
                resolve(isCorrect);
            });
            choicesList.appendChild(choiceElement);
        });

        questionPopup.style.display = 'flex';
    });
};


const initPlayers = (numPlayers = 2) => {
    players = [];
    for (let i = 1; i <= numPlayers; i++) {
        const player = {
            id: playerNames[i - 1], 
            current: 0,
            target: 0,
            x: 0,
            y: 0,
            colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, 
        };
        players.push(player);
    }
    activePlayer = players[0];
};

const addPlayerInputFields = () => {
    const playerCountSelect = document.getElementById('playerCount');
    playerCountSelect.addEventListener('change', (event) => {
        const numPlayers = parseInt(event.target.value);
        initPlayers(numPlayers);
        addFields(numPlayers);
        updatePlayersInfo(); 
        resetGame();
    });
};

const addFields = (num) => {
    const playerNames = document.getElementById('playerInfoEdit');
    playerNames.innerHTML = '';
    for (let i = 1; i <= num; i++) {
        const playerInput = document.createElement('input');
        playerInput.classList.add('player-edit-field');
        playerInput.setAttribute('type', 'text');
        playerInput.setAttribute('id', `player${i}`);
        playerInput.setAttribute('placeholder', `Player ${i}`);
        playerInput.addEventListener('change', (event) => {
            const playerIndex = parseInt(event.target.id.replace('player', '')) - 1;
            players[playerIndex].id = event.target.value;
            updatePlayersInfo(); 
            resetGame();
        });
        playerNames.appendChild(playerInput);
    }
}


const updatePlayersInfo = () => {
    const playerInfo = document.getElementById('playerInfo');
    playerInfo.innerHTML = '';
    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-info');
        playerDiv.style.color = player.colour;
        playerDiv.textContent = player.id; 
        playerInfo.appendChild(playerDiv);
    });
};

initPlayers(2);
addPlayerInputFields();
addFields(2);
updatePlayersInfo();
setPlayerID();
// generatePlayerNames(2);
