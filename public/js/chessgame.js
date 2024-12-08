

const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

// Render the chessboard and pieces
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; // Clear the board before rendering

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", ""); // Required for drag-and-drop
                    }
                });

                pieceElement.addEventListener("dragend", () => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => e.preventDefault());

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSquare);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    // Flip the board if the player is black
    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

// Handle the move logic
const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: "q", // Promote pawn to queen if it reaches the last rank
    };

    const result = chess.move(move); // Validate and execute the move
    if (result) {
        renderBoard(); // Re-render the board on successful move
        socket.emit("move", move); // Send the move to the server
    } else {
        console.log("Invalid move:", move); // Log invalid moves for debugging
    }
};

// Unicode representation of pieces
const getPieceUnicode = (piece) => {
    const unicodePieces = {
        p: "♟", // black pawn
        r: "♜", // black rook
        n: "♞", // black knight
        b: "♝", // black bishop
        q: "♛", // black queen
        k: "♚", // black king
        P: "♙", // white pawn
        R: "♖", // white rook
        N: "♘", // white knight
        B: "♗", // white bishop
        Q: "♕", // white queen
        K: "♔", // white king
    };
    return unicodePieces[piece.type] || "";
};

// Socket event handlers
socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
});

// Initial render
renderBoard();
