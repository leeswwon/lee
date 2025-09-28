
import React from 'react';
import type { GridCell, CellPosition } from '../types';
import { CellType } from '../types';

interface GameBoardProps {
  grid: GridCell[][];
  onCellClick: (row: number, col: number) => void;
  selectedCell: CellPosition | null;
  wrongInputCell: CellPosition | null;
}

const GameBoard: React.FC<GameBoardProps> = ({ grid, onCellClick, selectedCell, wrongInputCell }) => {
  if (!grid || grid.length === 0) {
    return <div className="aspect-square w-full bg-gray-200 rounded-lg animate-pulse"></div>;
  }

  const getCellClass = (cell: GridCell, row: number, col: number) => {
    let baseClass = "flex items-center justify-center aspect-square text-lg md:text-xl font-bold rounded-md transition-all duration-150";

    if (cell.type === CellType.EMPTY) {
      return "bg-transparent";
    }

    baseClass += " bg-white border";

    if (cell.type === CellType.GIVEN) {
        baseClass += " border-gray-200 text-gray-900 bg-gray-50";
    } else if (cell.type === CellType.REVEALED) {
        baseClass += " border-gray-200 text-green-600 bg-green-50 font-bold";
    } else if (cell.type === CellType.INPUT) {
        baseClass += " border-gray-300 border-dashed cursor-pointer hover:bg-blue-50";
        if (selectedCell && selectedCell.row === row && selectedCell.col === col) {
            baseClass += " !border-blue-500 !bg-blue-100 border-dashed";
        }
        if (wrongInputCell && wrongInputCell.row === row && wrongInputCell.col === col) {
            baseClass += " animate-shake";
        }
    }

    return baseClass;
  };
  
  return (
    <div className="grid grid-cols-8 gap-1 p-2 bg-white rounded-lg shadow-md" style={{ aspectRatio: '1 / 1' }}>
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={getCellClass(cell, rowIndex, colIndex)}
            onClick={() => onCellClick(rowIndex, colIndex)}
          >
            {cell.value}
          </div>
        ))
      )}
    </div>
  );
};

export default GameBoard;
