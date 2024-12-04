import React, { useState, useEffect, useCallback } from 'react';

// Tetris piece shapes
const SHAPES = [
  [[1, 1, 1, 1]],
  [[1, 1], [1, 1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 1, 0], [0, 1, 1]],
  [[0, 1, 1], [1, 1, 0]]
];

// Cyberpunk-inspired color palette
const COLORS = [
  'bg-gradient-to-br from-cyan-500 to-blue-800', 
  'bg-gradient-to-br from-purple-700 to-pink-600', 
  'bg-gradient-to-br from-green-400 to-emerald-900', 
  'bg-gradient-to-br from-indigo-600 to-purple-900', 
  'bg-gradient-to-br from-yellow-400 to-orange-600', 
  'bg-gradient-to-br from-red-500 to-pink-500', 
  'bg-gradient-to-br from-teal-400 to-blue-700'
];

function App() {
  const BOARD_WIDTH = 10;
  const BOARD_HEIGHT = 20;

  const [gameStarted, setGameStarted] = useState(false);
  const [board, setBoard] = useState(
    Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState(null);
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  // Generate a new random piece
  const getRandomPiece = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    return {
      shape: SHAPES[shapeIndex],
      color: COLORS[shapeIndex]
    };
  }, []);

  // Initialize the game
  const initGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill().map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(getRandomPiece());
    setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2), y: 0 });
    setScore(0);
    setLevel(1);
    setIsGameOver(false);
    setGameStarted(true);
  }, [getRandomPiece]);

  // Check if a move is valid
  const isValidMove = useCallback((piece, position) => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x;
          const newY = position.y + y;

          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT || 
            (newY >= 0 && board[newY][newX])
          ) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Move piece down
  const movePieceDown = useCallback(() => {
    if (!currentPiece) return;

    const newPosition = { 
      x: currentPosition.x, 
      y: currentPosition.y + 1 
    };

    if (isValidMove(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    } else {
      // Piece has landed, merge it with the board
      const newBoard = [...board];
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPosition.y + y;
            const boardX = currentPosition.x + x;
            if (boardY >= 0) {
              newBoard[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }

      // Check for completed lines
      const completedLines = newBoard.reduce((lines, row, index) => {
        return row.every(cell => cell !== 0) ? [...lines, index] : lines;
      }, []);

      // Calculate score based on number of lines cleared
      if (completedLines.length > 0) {
        const scoreMultipliers = [0, 100, 300, 500, 800];
        const lineScore = scoreMultipliers[completedLines.length] * level;
        setScore(prev => prev + lineScore);

        // Increase level every 5 lines
        if (Math.floor(score / 1000) + 1 > level) {
          setLevel(prev => prev + 1);
        }

        // Remove completed lines and add new empty lines at the top
        completedLines.forEach(() => {
          newBoard.splice(0, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        });
      }

      setBoard(newBoard);
      
      // Check for game over
      const newPiece = getRandomPiece();
      if (!isValidMove(newPiece, { x: Math.floor(BOARD_WIDTH / 2), y: 0 })) {
        setIsGameOver(true);
        setGameStarted(false);
      } else {
        setCurrentPiece(newPiece);
        setCurrentPosition({ x: Math.floor(BOARD_WIDTH / 2), y: 0 });
      }
    }
  }, [board, currentPiece, currentPosition, getRandomPiece, isValidMove, level, score]);

  // Rotate piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece) return;

    const rotatedShape = currentPiece.shape[0].map((val, index) => 
      currentPiece.shape.map(row => row[index]).reverse()
    );

    const rotatedPiece = { 
      ...currentPiece, 
      shape: rotatedShape 
    };

    if (isValidMove(rotatedPiece, currentPosition)) {
      setCurrentPiece(rotatedPiece);
    }
  }, [currentPiece, currentPosition, isValidMove]);

  // Move piece left or right
  const movePieceHorizontal = useCallback((direction) => {
    if (!currentPiece) return;

    const newPosition = { 
      x: currentPosition.x + direction, 
      y: currentPosition.y 
    };

    if (isValidMove(currentPiece, newPosition)) {
      setCurrentPosition(newPosition);
    }
  }, [currentPiece, currentPosition, isValidMove]);

  // Game controls
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyDown = (e) => {
      if (isGameOver) return;
      switch(e.key) {
        case 'ArrowDown':
          movePieceDown();
          break;
        case 'ArrowLeft':
          movePieceHorizontal(-1);
          break;
        case 'ArrowRight':
          movePieceHorizontal(1);
          break;
        case 'ArrowUp':
          rotatePiece();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePieceDown, movePieceHorizontal, rotatePiece, isGameOver, gameStarted]);

  // Auto move down every second (with speed increasing by level)
  useEffect(() => {
    if (!gameStarted || isGameOver) return;

    const gameLoop = setInterval(() => {
      movePieceDown();
    }, Math.max(100, 1000 - (level * 100)));

    return () => clearInterval(gameLoop);
  }, [movePieceDown, gameStarted, isGameOver, level]);

  // Render the board
  const renderBoard = () => {
    const boardWithCurrentPiece = board.map(row => [...row]);

    if (currentPiece) {
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardY = currentPosition.y + y;
            const boardX = currentPosition.x + x;
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              boardWithCurrentPiece[boardY][boardX] = currentPiece.color;
            }
          }
        }
      }
    }

    return boardWithCurrentPiece.map((row, rowIndex) => (
      <div key={rowIndex} className="flex">
        {row.map((cell, cellIndex) => (
          <div 
            key={cellIndex} 
            className={`
              w-8 h-8 border-2 border-opacity-20 border-white 
              ${cell ? cell + ' shadow-lg' : 'bg-gray-900 bg-opacity-50'}
              transition-all duration-200 ease-in-out
            `}
          />
        ))}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <div className="flex w-full max-w-6xl">
        {/* Game Board */}
        <div className="w-1/2 flex items-center justify-center">
          <div className="
            border-4 
            border-cyan-500 
            border-opacity-30 
            rounded-xl 
            overflow-hidden 
            shadow-[0_0_30px_rgba(0,255,255,0.2)]
          ">
            {renderBoard()}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-1/2 pl-12 flex flex-col justify-center">
          {/* Stylish Tetris Title */}
          <h1 className="
            text-6xl 
            font-bold 
            mb-12 
            text-transparent 
            bg-clip-text 
            bg-gradient-to-r 
            from-cyan-400 
            to-blue-600
            drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]
          ">
            TETRIS
          </h1>

          {/* Score and Level Display */}
          {gameStarted && (
            <div className="
              text-2xl 
              mb-8 
              text-white 
              bg-black 
              bg-opacity-50 
              px-6 
              py-3 
              rounded-lg 
              border-2 
              border-cyan-500 
              border-opacity-50
              shadow-[0_0_20px_rgba(0,255,255,0.3)]
            ">
              <div>SCORE: <span className="text-cyan-300">{score}</span></div>
              <div>LEVEL: <span className="text-purple-300">{level}</span></div>
            </div>
          )}

          {/* Start Button */}
          {!gameStarted && (
            <button 
              onClick={initGame}
              className="
                relative 
                px-8 
                py-4 
                text-2xl 
                font-bold 
                text-white 
                overflow-hidden 
                rounded-lg 
                group
              "
            >
              {/* Glowing Background Effect */}
              <span className="
                absolute 
                inset-0 
                w-full 
                h-full 
                bg-gradient-to-br 
                from-cyan-500 
                to-blue-600 
                opacity-0 
                group-hover:opacity-100 
                transition-opacity 
                duration-500 
                rounded-lg
              "></span>

              {/* Border Glow Effect */}
              <span className="
                absolute 
                inset-0 
                w-full 
                h-full 
                border-2 
                border-cyan-500 
                animate-pulse 
                group-hover:opacity-0 
                transition-opacity 
                duration-500 
                rounded-lg
              "></span>

              {/* Button Text */}
              <span className="
                relative 
                z-10 
                text-cyan-300 
                group-hover:text-white 
                transition-colors 
                duration-300
              ">
                START GAME
              </span>
            </button>
          )}

          {/* Game Over */}
          {isGameOver && (
            <div className="
              text-red-400 
              text-3xl 
              mt-8 
              text-center 
              bg-black 
              bg-opacity-70 
              p-6 
              rounded-xl 
              border-2 
              border-red-600 
              border-opacity-50
              animate-bounce
            ">
              GAME OVER
              <div className="
                text-xl
                text-white
                mt-4
              ">
                Final Score: <span className="text-cyan-300">{score}</span>
              </div>
              <button 
                onClick={initGame} 
                className="
                  block 
                  mt-4 
                  mx-auto 
                  px-6 
                  py-3 
                  bg-gradient-to-r 
                  from-cyan-500 
                  to-blue-600 
                  text-white 
                  rounded-lg 
                  hover:scale-105 
                  transition-transform 
                  duration-300
                "
              >
                RESTART
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;