import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Trophy, Gamepad2 } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: string;
  score: number;
  gameOver: boolean;
  isPaused: boolean;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const GAME_SPEED = 150;

const SnakeGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: INITIAL_FOOD,
    direction: 'RIGHT',
    score: 0,
    gameOver: false,
    isPaused: false,
  });

  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    setGameState(prevState => {
      if (prevState.gameOver || prevState.isPaused) return prevState;

      const { snake, direction, food, score } = prevState;
      const head = { ...snake[0] };

      // Move head based on direction
      switch (direction) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        toast.error(`Game Over! Final Score: ${score}`);
        return { ...prevState, gameOver: true };
      }

      // Check self collision
      if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        toast.error(`Game Over! Final Score: ${score}`);
        return { ...prevState, gameOver: true };
      }

      const newSnake = [head, ...snake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 10;
        const newFood = generateFood(newSnake);
        
        // Update high score
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('snakeHighScore', newScore.toString());
          toast.success(`New High Score: ${newScore}!`);
        } else {
          toast.success(`Score: ${newScore}`);
        }

        return {
          ...prevState,
          snake: newSnake,
          food: newFood,
          score: newScore,
        };
      } else {
        // Remove tail if no food eaten
        newSnake.pop();
        return {
          ...prevState,
          snake: newSnake,
        };
      }
    });
  }, [generateFood, highScore]);

  // Game loop
  useEffect(() => {
    if (isPlaying && !gameState.gameOver && !gameState.isPaused) {
      gameLoopRef.current = setInterval(moveSnake, GAME_SPEED);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameState.gameOver, gameState.isPaused, moveSnake]);

  // Handle keyboard input
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!isPlaying || gameState.gameOver) return;

    const { direction } = gameState;
    let newDirection = direction;

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (direction !== 'DOWN') newDirection = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (direction !== 'UP') newDirection = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (direction !== 'RIGHT') newDirection = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (direction !== 'LEFT') newDirection = 'RIGHT';
        break;
      case ' ':
        event.preventDefault();
        togglePause();
        return;
    }

    if (newDirection !== direction) {
      setGameState(prev => ({ ...prev, direction: newDirection }));
    }
  }, [isPlaying, gameState.gameOver, gameState.direction]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw snake
    gameState.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? '#10b981' : '#059669';
      ctx.fillRect(
        segment.x * cellSize + 1,
        segment.y * cellSize + 1,
        cellSize - 2,
        cellSize - 2
      );
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(
      gameState.food.x * cellSize + 1,
      gameState.food.y * cellSize + 1,
      cellSize - 2,
      cellSize - 2
    );
  }, [gameState]);

  const startGame = () => {
    setGameState({
      snake: INITIAL_SNAKE,
      food: generateFood(INITIAL_SNAKE),
      direction: 'RIGHT',
      score: 0,
      gameOver: false,
      isPaused: false,
    });
    setIsPlaying(true);
    toast.success('Game Started! Use arrow keys or WASD to move');
  };

  const togglePause = () => {
    if (!isPlaying || gameState.gameOver) return;
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    toast.info(gameState.isPaused ? 'Game Resumed' : 'Game Paused');
  };

  const resetGame = () => {
    setIsPlaying(false);
    setGameState({
      snake: INITIAL_SNAKE,
      food: INITIAL_FOOD,
      direction: 'RIGHT',
      score: 0,
      gameOver: false,
      isPaused: false,
    });
    toast.info('Game Reset');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
            <Gamepad2 className="h-8 w-8 text-green-400" />
            Snake Game
          </h1>
          <p className="text-slate-300">Use arrow keys or WASD to control the snake</p>
        </div>

        {/* Game Stats */}
        <div className="flex justify-center gap-4 mb-6">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-slate-400 text-sm">Score</p>
                <p className="text-2xl font-bold text-white">{gameState.score}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  <p className="text-slate-400 text-sm">High Score</p>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{highScore}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Canvas */}
        <div className="flex justify-center mb-6">
          <Card className="bg-slate-800/50 border-slate-700 p-4">
            <canvas
              ref={canvasRef}
              width={400}
              height={400}
              className="border border-slate-600 rounded-lg"
            />
          </Card>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {!isPlaying ? (
            <Button
              onClick={startGame}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          ) : (
            <Button
              onClick={togglePause}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              disabled={gameState.gameOver}
            >
              {gameState.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
          )}
          
          <Button
            onClick={resetGame}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 px-6 py-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Game Status */}
        <div className="text-center">
          {gameState.gameOver && (
            <Badge variant="destructive" className="text-lg px-4 py-2 mb-2">
              Game Over!
            </Badge>
          )}
          {gameState.isPaused && !gameState.gameOver && (
            <Badge variant="secondary" className="text-lg px-4 py-2 mb-2">
              Paused
            </Badge>
          )}
          <p className="text-slate-400 text-sm">
            Press Space to pause/resume • Snake length: {gameState.snake.length}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;