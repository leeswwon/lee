
export enum CellType {
  GIVEN = 'GIVEN',
  INPUT = 'INPUT',
  EMPTY = 'EMPTY',
  REVEALED = 'REVEALED',
}

export interface GridCell {
  type: CellType;
  value: string | null;
}

export interface Puzzle {
  grid: GridCell[][];
  solution: Record<string, number>; // key: "row,col", value: correct number
  keypad: number[];
}

export interface CellPosition {
  row: number;
  col: number;
}

export type GameStatus = 'LOADING' | 'PLAYING' | 'WON' | 'LOST' | 'ERROR';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
