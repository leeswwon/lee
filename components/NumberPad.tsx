import React from 'react';

interface NumberPadProps {
  numbers: number[];
  onNumberClick: (num: number) => void;
  disabled: boolean;
}

const NumberPad: React.FC<NumberPadProps> = ({ numbers, onNumberClick, disabled }) => {
  // Ensure we have a consistent grid, e.g., 3x5 or similar
  const padSize = 15;
  const displayNumbers = [...new Set(numbers)]; // Remove duplicates for display
  while (displayNumbers.length < padSize && displayNumbers.length > 0) {
    // Fill remaining spots with random numbers from the existing set to ensure a full pad
    displayNumbers.push(displayNumbers[Math.floor(Math.random() * displayNumbers.length)]);
  }
  
  // A simple shuffle to randomize button positions
  const shuffledNumbers = displayNumbers.sort(() => Math.random() - 0.5);

  return (
    <div className="grid grid-cols-5 gap-2">
      {shuffledNumbers.slice(0, padSize).map((num, index) => (
        <button
          key={index}
          onClick={() => onNumberClick(num)}
          disabled={disabled}
          className="flex items-center justify-center p-2 h-12 text-xl font-bold bg-gray-100 rounded-lg border border-gray-200 
                     hover:bg-gray-200 active:scale-95 transform transition-all 
                     disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none"
        >
          {num}
        </button>
      ))}
    </div>
  );
};

export default NumberPad;