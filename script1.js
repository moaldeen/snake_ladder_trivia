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

let diceResults = {};

let players = [];

let activePlayer;

const playerNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

const obstacles = [
    { type: 'snake', start: 97, end: 78 },
    { type: 'snake', start: 95, end: 56 },
    { type: 'snake', start: 88, end: 24 },
    { type: 'snake', start: 62, end: 18 },
    { type: 'snake', start: 48, end: 26 },
    { type: 'snake', start: 36, end: 6 },
    { type: 'snake', start: 32, end: 10 },
    { type: 'ladder', start: 1, end: 38 },
    { type: 'ladder', start: 4, end: 14 },
    { type: 'ladder', start: 8, end: 30 },
    { type: 'ladder', start: 21, end: 42 },
    { type: 'ladder', start: 28, end: 76 },
    { type: 'ladder', start: 50, end: 67 },
    { type: 'ladder', start: 71, end: 92 },
    { type: 'ladder', start: 80, end: 99 }
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

    resetGameBtn.classList.add('hidden');
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
                // Check if the selected choice is correct
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
            id: playerNames[i - 1], // Set the player name based on the array
            current: 0,
            target: 0,
            x: 0,
            y: 0,
            colour: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
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
        updatePlayersInfo(); // Update player information
        resetGame();
    });
};


const updatePlayersInfo = () => {
    const playerInfo = document.getElementById('playerInfo');
    playerInfo.innerHTML = '';
    players.forEach((player) => {
        const playerDiv = document.createElement('div');
        playerDiv.classList.add('player-info');
        playerDiv.style.color = player.colour;
        playerDiv.textContent = player.id; // Use the player's name here
        playerInfo.appendChild(playerDiv);
    });
};

initPlayers(2);
addPlayerInputFields();
updatePlayersInfo();
setPlayerID();
generatePlayerNames(2);
