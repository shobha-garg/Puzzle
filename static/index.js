const puzzleContainer = document.getElementById("puzzle-container");
const piecesContainer = document.getElementById("pieces");
const message = document.getElementById("message");
const nextButton = document.getElementById("next-button");
const title = document.getElementById("title");
const confettiSound = document.getElementById("confetti-sound");
const oopsMessageDiv = document.getElementById("oops-message");

const timerDisplay = document.getElementById("timer-display");
const timeUpMessageDiv = document.getElementById("time-up-message");
const scoreDisplay = document.getElementById("score-display");
const finalScoreSpan = document.getElementById("final-score");

let puzzleTimerInterval = null;
let timeRemaining = 0;
const PUZZLE_TIME_LIMIT = 180;
let oopsTimeoutId = null;

let currentScore = 0;
const POINTS_PER_PUZZLE = 100;
const POINTS_PER_SECOND_REMAINING = 2;

const puzzles = [
    { image: "../static/images/img4.jpg", rows: 3, cols: 4 },
    { image: "../static/images/img5.jpg", rows: 3, cols: 4 },
    { image: "../static/images/img.jpg", rows: 3, cols: 4 },
];

let currentPuzzleIndex = 0;
const TOTAL_IMAGE_WIDTH = 600;
const TOTAL_IMAGE_HEIGHT = 400;
let PUZZLE_CONTAINER_GAP = 3;

document.addEventListener("DOMContentLoaded", () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const cssGap = rootStyle.getPropertyValue('--puzzle-container-gap');
    if (cssGap) PUZZLE_CONTAINER_GAP = parseInt(cssGap.trim(), 10) || 3;

    if (!oopsMessageDiv) console.error("Error: #oops-message element not found.");
    if (!timerDisplay) console.error("Error: #timer-display element not found.");
    if (!timeUpMessageDiv) console.error("Error: #time-up-message element not found.");
    if (!scoreDisplay) console.error("Error: #score-display element not found.");
    if (!finalScoreSpan) console.error("Error: #final-score span element not found.");

    updateScoreDisplay();

    if (puzzles.length > 0) {
        loadPuzzle(puzzles[currentPuzzleIndex]);
    } else {
        console.error("No puzzles defined.");
        title.textContent = "Error: No puzzles configured.";
    }
});

function generatePositions(cols, rows) {
    const positions = [];
    const pieceWidth = TOTAL_IMAGE_WIDTH / cols;
    const pieceHeight = TOTAL_IMAGE_HEIGHT / rows; // CORRECTED
    for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        positions.push({ x: col * pieceWidth, y: row * pieceHeight });
    }
    }
    return positions;
}

function loadPuzzle(puzzleData) {
    oopsMessageDiv.classList.remove("visible");
    if (timeUpMessageDiv) timeUpMessageDiv.classList.remove("visible");
    message.classList.remove("visible");
    message.style.display = "none";

    piecesContainer.classList.remove("hidden");
    puzzleContainer.classList.remove("completed");
    puzzleContainer.classList.remove("hidden");
    title.classList.remove("hidden");
    if (timerDisplay) timerDisplay.classList.remove("hidden");
    if (scoreDisplay) scoreDisplay.classList.remove("hidden");

    puzzleContainer.style.borderColor = '';
    puzzleContainer.style.padding = '5px';
    puzzleContainer.style.gap = `${PUZZLE_CONTAINER_GAP}px`;

    clearBoard(puzzleData.rows, puzzleData.cols);
    nextButton.style.display = "none";
    nextButton.classList.remove("hidden");
    piecesContainer.innerHTML = '';

    const numPieces = puzzleData.rows * puzzleData.cols;
    const piecePositions = generatePositions(puzzleData.cols, puzzleData.rows);
    const pieceWidth = TOTAL_IMAGE_WIDTH / puzzleData.cols;
    const pieceHeight = TOTAL_IMAGE_HEIGHT / puzzleData.rows; // CORRECTED

    const pieceOrderToDisplay = shuffleArray([...Array(numPieces).keys()]);

    pieceOrderToDisplay.forEach(originalIndex => {
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.id = `piece-${originalIndex}`;
    piece.draggable = true;
    piece.dataset.correctIndex = originalIndex;

    piece.style.backgroundImage = `url('../static/${puzzleData.image.startsWith('../static/') ? puzzleData.image.substring('../static/'.length) : puzzleData.image}')`;
    piece.style.backgroundSize = `${TOTAL_IMAGE_WIDTH}px ${TOTAL_IMAGE_HEIGHT}px`;

    const pos = piecePositions[originalIndex];
    piece.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
    piece.style.width = `${pieceWidth}px`;
    piece.style.height = `${pieceHeight}px`;

    piece.ondragstart = e => {
        e.dataTransfer.setData("text/plain", piece.id);
        e.dataTransfer.effectAllowed = "move";
    };
    piecesContainer.appendChild(piece);
    });

    startTimer();
}

function clearBoard(rows, cols) {
    puzzleContainer.innerHTML = '';
    const pieceWidth = TOTAL_IMAGE_WIDTH / cols;
    const pieceHeight = TOTAL_IMAGE_HEIGHT / rows;

    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, ${pieceWidth}px)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${rows}, ${pieceHeight}px)`;
    puzzleContainer.style.width = `${cols * pieceWidth + (cols - 1) * PUZZLE_CONTAINER_GAP + (2 * 5)}px`;
    puzzleContainer.style.height = `${rows * pieceHeight + (rows - 1) * PUZZLE_CONTAINER_GAP + (2 * 5)}px`;
    puzzleContainer.style.gap = `${PUZZLE_CONTAINER_GAP}px`;

    const numDropzones = rows * cols;
    for (let i = 0; i < numDropzones; i++) {
        const dropzone = document.createElement("div");
        dropzone.className = "dropzone";
        dropzone.dataset.index = i;
        dropzone.style.width = `${pieceWidth}px`;
        dropzone.style.height = `${pieceHeight}px`;

        dropzone.ondragover = e => e.preventDefault();
        dropzone.ondrop = e => {
            e.preventDefault();
            const pieceId = e.dataTransfer.getData("text/plain");
            const piece = document.getElementById(pieceId);

            if (!piece) return;
            if (puzzleContainer.classList.contains("completed")) return;

            if (dropzone.firstChild && dropzone.firstChild !== piece) {
                piecesContainer.appendChild(dropzone.firstChild);
            }
            if (!dropzone.firstChild || dropzone.firstChild !== piece) {
                dropzone.appendChild(piece);
            }

            if (piece.dataset.correctIndex !== dropzone.dataset.index) {
                showOopsMessage();
            }
            checkCompletion();
        };
        puzzleContainer.appendChild(dropzone);
    }
}

function showOopsMessage() {
    if (!oopsMessageDiv) return;
    oopsMessageDiv.textContent = "Ding dong! It's wrong.";
    if (oopsTimeoutId) {
        clearTimeout(oopsTimeoutId);
    }
    oopsMessageDiv.classList.add("visible");
    oopsTimeoutId = setTimeout(() => {
        oopsMessageDiv.classList.remove("visible");
    }, 2000);
}

function checkCompletion() {
    const dropzones = document.querySelectorAll(".dropzone");
    let correct = 0;
    const totalPieces = puzzles[currentPuzzleIndex].rows * puzzles[currentPuzzleIndex].cols;

    dropzones.forEach((zone) => {
        const piece = zone.firstChild;
        if (piece && piece.dataset.correctIndex === zone.dataset.index) {
            correct++;
        }
    });

    if (correct === totalPieces && totalPieces > 0) {
        const timeBonus = timeRemaining * POINTS_PER_SECOND_REMAINING;
        currentScore += POINTS_PER_PUZZLE + timeBonus;
        updateScoreDisplay();

        stopTimer();
        nextButton.style.display = "inline-block";
        piecesContainer.classList.add("hidden");
        puzzleContainer.classList.add("completed");
        const cols = puzzles[currentPuzzleIndex].cols;
        const rows = puzzles[currentPuzzleIndex].rows;
        puzzleContainer.style.width = `${cols * (TOTAL_IMAGE_WIDTH / cols)}px`;
        puzzleContainer.style.height = `${rows * (TOTAL_IMAGE_HEIGHT / rows)}px`;
    } else {
        if (puzzleContainer.classList.contains("completed")) {
            piecesContainer.classList.remove("hidden");
            puzzleContainer.classList.remove("completed");
            const cols = puzzles[currentPuzzleIndex].cols;
            const rows = puzzles[currentPuzzleIndex].rows;
            const pieceWidth = TOTAL_IMAGE_WIDTH / cols;
            const pieceHeight = TOTAL_IMAGE_HEIGHT / rows;
            puzzleContainer.style.width = `${cols * pieceWidth + (cols - 1) * PUZZLE_CONTAINER_GAP + (2*5)}px`;
            puzzleContainer.style.height = `${rows * pieceHeight + (rows - 1) * PUZZLE_CONTAINER_GAP + (2*5)}px`;
            puzzleContainer.style.gap = `${PUZZLE_CONTAINER_GAP}px`;
            puzzleContainer.style.borderColor = '';
            puzzleContainer.style.padding = '5px';
        }
    }
}

function startTimer() {
    if (!timerDisplay) return;
    stopTimer();
    timeRemaining = PUZZLE_TIME_LIMIT;
    updateTimerDisplay();
    timerDisplay.classList.remove("hidden");

    puzzleTimerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    if (puzzleTimerInterval) {
        clearInterval(puzzleTimerInterval);
        puzzleTimerInterval = null;
    }
}

function updateTimerDisplay() {
    if (!timerDisplay) return;
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateScoreDisplay() {
    if (scoreDisplay) {
        scoreDisplay.textContent = `Score: ${currentScore}`;
    }
}

function handleTimeUp() {
    stopTimer();
    if (timerDisplay) timerDisplay.classList.add("hidden");
    puzzleContainer.classList.add("completed");
    piecesContainer.classList.add("hidden");
    nextButton.style.display = "none";

    if (timeUpMessageDiv) {
        timeUpMessageDiv.classList.add("visible");
        setTimeout(() => {
            timeUpMessageDiv.classList.remove("visible");
            moveToNextPuzzleOrEnd();
        }, 2500);
    } else {
        moveToNextPuzzleOrEnd();
    }
}

function moveToNextPuzzleOrEnd() {
    if (currentPuzzleIndex < puzzles.length - 1) {
        currentPuzzleIndex++;
        loadPuzzle(puzzles[currentPuzzleIndex]);
    } else {
        title.classList.add("hidden");
        puzzleContainer.classList.add("hidden");
        piecesContainer.classList.add("hidden");
        nextButton.classList.add("hidden");
        if (timerDisplay) timerDisplay.classList.add("hidden");
        if (scoreDisplay) scoreDisplay.classList.add("hidden");

        if (confettiSound) {
            confettiSound.currentTime = 0;
            confettiSound.play().catch(error => {
                console.warn("Audio playback failed.", error);
            });
        }

        if (finalScoreSpan) finalScoreSpan.textContent = currentScore;

        message.style.display = "block";
        setTimeout(() => {
            message.classList.add("visible");
        }, 10);
    }
}

nextButton.addEventListener("click", () => {
    moveToNextPuzzleOrEnd();
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}