
import React from 'react';
import type { Difficulty } from '../types';
import { HeartIcon, RefreshCwIcon } from './Icons';

interface GameHeaderProps {
  level: number;
  score: number;
  highScore: number;
  mistakes: number;
  maxMistakes: number;
  onRestart: () => void;
  difficulty: Difficulty;
}

const DifficultyBadge: React.FC<{ difficulty: Difficulty }> = ({ difficulty }) => {
  const colors = {
    Easy: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Hard: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[difficulty]}`}>
      {difficulty}
    </span>
  );
};


const GameHeader: React.FC<GameHeaderProps> = ({
  level,
  score,
  highScore,
  mistakes,
  maxMistakes,
  onRestart,
  difficulty
}) => {
  return (
    <div className="flex justify-between items-center w-full">
      <div className='flex items-center gap-2'>
        <button onClick={onRestart} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
          <RefreshCwIcon className="w-5 h-5" />
        </button>
         <DifficultyBadge difficulty={difficulty} />
      </div>

      <div className="text-center">
        <div className="text-sm font-semibold text-gray-500">LEVEL</div>
        <div className="text-2xl font-bold text-gray-900">{level}</div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-gray-500">SCORE</div>
        <div className="flex items-baseline justify-center gap-1">
            <div className="text-2xl font-bold text-gray-900">{score}</div>
            <div className="text-sm text-gray-400 font-medium">/ {highScore}</div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {[...Array(maxMistakes)].map((_, i) => (
          <HeartIcon
            key={i}
            className={`w-6 h-6 ${i < maxMistakes - mistakes ? 'text-red-500 fill-current' : 'text-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default GameHeader;
