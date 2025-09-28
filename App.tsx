
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Puzzle, GridCell, CellPosition, GameStatus, Difficulty } from './types';
import { CellType } from './types';
import GameHeader from './components/GameHeader';
import GameBoard from './components/GameBoard';
import NumberPad from './components/NumberPad';
import GameOverlay from './components/GameOverlay';
import LoadingSpinner from './components/LoadingSpinner';

const MAX_MISTAKES = 3;

const getDifficultyForLevel = (lvl: number): Difficulty => {
  if (lvl > 5) return 'Hard';
  if (lvl > 2) return 'Medium';
  return 'Easy';
};

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>('LOADING');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [boardState, setBoardState] = useState<GridCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [wrongInputCell, setWrongInputCell] = useState<CellPosition | null>(null);
  const [preloadedPuzzle, setPreloadedPuzzle] = useState<{ puzzle: Puzzle; difficulty: Difficulty } | null>(null);

  useEffect(() => {
    const savedHighScore = localStorage.getItem('mathCrosswordHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('mathCrosswordHighScore', String(score));
    }
  }, [score, highScore]);

  const fetchPuzzleFromAI = async (difficultyToFetch: Difficulty): Promise<Puzzle> => {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        grid: {
          type: Type.ARRAY,
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['GIVEN', 'INPUT', 'EMPTY'] },
                value: { type: Type.STRING },
              },
               required: ['type', 'value'],
            },
          },
        },
        solution: {
          type: Type.ARRAY,
          items: {
              type: Type.OBJECT,
              properties: {
                  key: { 
                      type: Type.STRING,
                      description: 'The coordinate of an INPUT cell, e.g. "row,col"'
                  },
                  value: { 
                      type: Type.NUMBER,
                      description: 'The correct number for that cell.'
                  },
              },
              required: ['key', 'value'],
          }
        },
        keypad: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
        },
      },
      required: ['grid', 'solution', 'keypad'],
    };

    const prompt = `Create a number puzzle for difficulty: ${difficultyToFetch}.
The grid must be 8x8.
The puzzle should be a grid with some numbers pre-filled, some empty cells for the user to fill, and some non-playable blank spaces. The numbers can be multi-digit.
The grid should be sparse and form an interesting, non-rectangular shape.
Use these cell types and values:
- 'GIVEN': For pre-filled numbers. The 'value' property must be a string containing the number.
- 'INPUT': For empty cells the user must fill in. The 'value' property must be an empty string "".
- 'EMPTY': For blank, non-playable spaces that define the shape of the puzzle. The 'value' property must be an empty string "".

The response must be a valid JSON object matching the provided schema.
- 'grid': An 8x8 array representing the puzzle board.
- 'solution': An array of objects for each 'INPUT' cell. Each object must have a 'key' (a "row,col" string) and a 'value' (the correct number). There must be at least 5 INPUT cells.
- 'keypad': An array of 15 numbers. It must contain all the correct numbers for the solution, plus some distractor numbers. The numbers should be shuffled.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    interface PuzzleResponse {
      grid: GridCell[][];
      solution: Array<{ key: string; value: number }>;
      keypad: number[];
    }
    const puzzleResponse = JSON.parse(response.text) as PuzzleResponse;

    if (
        !puzzleResponse ||
        !Array.isArray(puzzleResponse.grid) || puzzleResponse.grid.length !== 8 ||
        !puzzleResponse.grid.every(row => Array.isArray(row) && row.length === 8 && row.every(cell => typeof cell.type === 'string' && typeof cell.value === 'string')) ||
        !Array.isArray(puzzleResponse.solution) || puzzleResponse.solution.length === 0 ||
        !Array.isArray(puzzleResponse.keypad) || puzzleResponse.keypad.length === 0
    ) {
        console.error("Invalid puzzle format received from API:", puzzleResponse);
        throw new Error("Invalid puzzle format from API");
    }
    
    const solutionMap = puzzleResponse.solution.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {} as Record<string, number>);

    return {
        grid: puzzleResponse.grid,
        solution: solutionMap,
        keypad: puzzleResponse.keypad
    };
  };

  const preloadPuzzle = useCallback(async (forLevel: number) => {
    if (preloadedPuzzle) return; // A puzzle is already preloaded

    const nextDifficulty = getDifficultyForLevel(forLevel);
    try {
      const puzzleData = await fetchPuzzleFromAI(nextDifficulty);
      setPreloadedPuzzle({ puzzle: puzzleData, difficulty: nextDifficulty });
    } catch (error) {
      console.error("Failed to preload puzzle:", error);
      // Fail silently, don't disrupt the user.
    }
  }, [preloadedPuzzle]);

  const generatePuzzle = useCallback(async (currentDifficulty: Difficulty) => {
    setGameStatus('LOADING');
    setSelectedCell(null);
    try {
      const puzzleData = await fetchPuzzleFromAI(currentDifficulty);
      setPuzzle(puzzleData);
      setBoardState(puzzleData.grid);
      setGameStatus('PLAYING');
      setMistakes(0);
      preloadPuzzle(level + 1);
    } catch (error) {
      console.error("Failed to generate puzzle:", error);
      setGameStatus('ERROR');
    }
  }, [level, preloadPuzzle]);

  const startNewGame = useCallback(() => {
    const currentDifficulty = getDifficultyForLevel(level);
    setDifficulty(currentDifficulty);

    if (preloadedPuzzle && preloadedPuzzle.difficulty === currentDifficulty) {
      setPuzzle(preloadedPuzzle.puzzle);
      setBoardState(preloadedPuzzle.puzzle.grid);
      setGameStatus('PLAYING');
      setMistakes(0);
      setSelectedCell(null);
      setPreloadedPuzzle(null);
      preloadPuzzle(level + 1);
    } else {
      generatePuzzle(currentDifficulty);
    }
  }, [level, preloadedPuzzle, generatePuzzle, preloadPuzzle]);

  const retryLevel = useCallback(() => {
    if (!puzzle) {
      startNewGame();
      return;
    }
    setBoardState(puzzle.grid);
    setMistakes(0);
    setSelectedCell(null);
    setGameStatus('PLAYING');
  }, [puzzle, startNewGame]);


  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus !== 'PLAYING') return;
    const cell = boardState[row][col];
    if (cell && cell.type === CellType.INPUT) {
      setSelectedCell({ row, col });
    } else {
      setSelectedCell(null);
    }
  };

  const handleNumberPadClick = (num: number) => {
    if (!selectedCell || gameStatus !== 'PLAYING' || !puzzle) return;

    const { row, col } = selectedCell;
    const solutionKey = `${row},${col}`;

    if (puzzle.solution[solutionKey] === num) {
      const newBoardState = boardState.map(r => r.map(c => ({...c})));
      newBoardState[row][col] = { type: CellType.GIVEN, value: String(num) };
      setBoardState(newBoardState);
      setScore(prev => prev + 10);
      setSelectedCell(null);

      const isWon = Object.keys(puzzle.solution).every(key => {
        const [r, c] = key.split(',').map(Number);
        return newBoardState[r][c].type === CellType.GIVEN || newBoardState[r][c].type === CellType.REVEALED;
      });

      if (isWon) {
        setGameStatus('WON');
        setScore(prev => prev + 100);
      }
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      setWrongInputCell(selectedCell);
      setTimeout(() => setWrongInputCell(null), 300);
      if (newMistakes >= MAX_MISTAKES) {
        const solutionBoard = boardState.map((r, rowIndex) =>
          r.map((c, colIndex) => {
            const currentSolutionKey = `${rowIndex},${colIndex}`;
            if (c.type === CellType.INPUT) {
               const correctValue = puzzle.solution[currentSolutionKey];
               if (c.value !== String(correctValue)) {
                 return { ...c, value: String(correctValue), type: CellType.REVEALED };
               }
            }
            return c;
          })
        );
        setBoardState(solutionBoard);
        setGameStatus('LOST');
      }
    }
  };

  const goToNextLevel = () => {
    setLevel(prev => prev + 1);
  };

  const startOverFromLevel1 = () => {
    setScore(0);
    setLevel(1);
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 text-slate-800">
      <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4">
        <GameHeader
          level={level}
          score={score}
          highScore={highScore}
          mistakes={mistakes}
          maxMistakes={MAX_MISTAKES}
          onRestart={startNewGame}
          difficulty={difficulty}
        />
        <div className="relative">
          {gameStatus === 'LOADING' && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <LoadingSpinner />
            </div>
          )}
          {(gameStatus === 'WON' || gameStatus === 'LOST' || gameStatus === 'ERROR') && 
            <GameOverlay 
              status={gameStatus} 
              onNextLevel={goToNextLevel} 
              onRestart={startNewGame}
              onRetry={retryLevel}
              onRestartFromLevel1={startOverFromLevel1}
              difficulty={difficulty}
            />
          }
          <GameBoard
            grid={boardState}
            onCellClick={handleCellClick}
            selectedCell={selectedCell}
            wrongInputCell={wrongInputCell}
          />
        </div>
        <NumberPad
          numbers={puzzle?.keypad || []}
          onNumberClick={handleNumberPadClick}
          disabled={gameStatus !== 'PLAYING'}
        />
      </div>
       <footer className="text-center mt-4 text-xs text-gray-500">
        <p>Math Crossword Puzzle generated with Gemini</p>
      </footer>
    </div>
  );
};

export default App;
