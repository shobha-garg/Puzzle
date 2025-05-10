const puzzleContainer = document.getElementById("puzzle-container");
const piecesContainer = document.getElementById("pieces");
const message = document.getElementById("message");
const nextButton = document.getElementById("next-button");
const title = document.getElementById("title");
const confettiSound = document.getElementById("confetti-sound"); // Get audio element

const puzzles = [
    { image: "../static/img.jpg", rows: 3, cols: 4 },
    { image: "../static/img2.JPG", rows: 3, cols: 4 }
];

let currentPuzzleIndex = 0;
const TOTAL_IMAGE_WIDTH = 600;
const TOTAL_IMAGE_HEIGHT = 400;
let PUZZLE_CONTAINER_GAP = 3;

document.addEventListener("DOMContentLoaded", () => {
    const rootStyle = getComputedStyle(document.documentElement);
    const cssGap = rootStyle.getPropertyValue('--puzzle-container-gap');
    if (cssGap) PUZZLE_CONTAINER_GAP = parseInt(cssGap.trim(), 10) || 3;

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
    const pieceHeight = TOTAL_IMAGE_HEIGHT / rows;
    for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
        positions.push({ x: col * pieceWidth, y: row * pieceHeight });
    }
    }
    return positions;
}

function loadPuzzle(puzzleData) {
    piecesContainer.classList.remove("hidden");
    puzzleContainer.classList.remove("completed");
    puzzleContainer.classList.remove("hidden"); // Ensure puzzle container is visible
    title.classList.remove("hidden"); // Ensure title is visible

    puzzleContainer.style.borderColor = '';
    puzzleContainer.style.padding = '5px';
    puzzleContainer.style.gap = `${PUZZLE_CONTAINER_GAP}px`;

    clearBoard(puzzleData.rows, puzzleData.cols);
    nextButton.style.display = "none"; // Hide button, will be shown on completion
    nextButton.classList.remove("hidden"); // Remove hidden class if applied previously
    piecesContainer.innerHTML = '';

    const numPieces = puzzleData.rows * puzzleData.cols;
    const piecePositions = generatePositions(puzzleData.cols, puzzleData.rows);
    const pieceWidth = TOTAL_IMAGE_WIDTH / puzzleData.cols;
    const pieceHeight = TOTAL_IMAGE_HEIGHT / puzzleData.rows;

    const pieceOrderToDisplay = shuffleArray([...Array(numPieces).keys()]);

    pieceOrderToDisplay.forEach(originalIndex => {
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.id = `piece-${originalIndex}`;
    piece.draggable = true;
    piece.dataset.correctIndex = originalIndex;

    piece.style.backgroundImage = `url('/static/${puzzleData.image}')`;
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
}

function clearBoard(rows, cols) {
    puzzleContainer.innerHTML = '';
    const pieceWidth = TOTAL_IMAGE_WIDTH / cols;
    const pieceHeight = TOTAL_IMAGE_HEIGHT / rows;

    puzzleContainer.style.gridTemplateColumns = `repeat(${cols}, ${pieceWidth}px)`;
    puzzleContainer.style.gridTemplateRows = `repeat(${rows}, ${pieceHeight}px)`;
    puzzleContainer.style.width = `${cols * pieceWidth + (cols - 1) * PUZZLE_CONTAINER_GAP + (2*5)}px`; // 5px padding on each side
    puzzleContainer.style.height = `${rows * pieceHeight + (rows - 1) * PUZZLE_CONTAINER_GAP + (2*5)}px`; // 5px padding on each side
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

        if (dropzone.firstChild && dropzone.firstChild !== piece) {
        piecesContainer.appendChild(dropzone.firstChild);
        }
        if (!dropzone.firstChild || dropzone.firstChild !== piece) {
            dropzone.appendChild(piece);
        }
        checkCompletion();
    };
    puzzleContainer.appendChild(dropzone);
    }
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
    nextButton.style.display = "inline-block"; // Show the button
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

nextButton.addEventListener("click", () => {
    if (currentPuzzleIndex < puzzles.length - 1) {
    currentPuzzleIndex++;
    loadPuzzle(puzzles[currentPuzzleIndex]);
    } else {
    // Final message sequence
    title.classList.add("hidden");
    puzzleContainer.classList.add("hidden");
    // piecesContainer should already be hidden if last puzzle was completed, but ensure it
    piecesContainer.classList.add("hidden");
    nextButton.classList.add("hidden"); // Hide next button with transition

    // Play sound
    if (confettiSound) {
        confettiSound.currentTime = 0; // Rewind to start
        confettiSound.play().catch(error => {
        console.warn("Audio playback failed. User interaction might be required or sound file issue.", error);
        });
    }

    message.style.display = "block"; // Make it part of layout
    setTimeout(() => { // Trigger transition
        message.classList.add("visible");
    }, 10); // Small delay for browser to apply display:block before transition
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}