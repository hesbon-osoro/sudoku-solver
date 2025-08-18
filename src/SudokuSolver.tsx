import React, { useState, useEffect, useCallback } from 'react';
import './sudoku_solver.css';
/**
 * Mini Sudoku Solver Component
 * This component implements a 6x6 Sudoku solver with 2x3 regions.
 * It allows users to input numbers, validate the grid, and solve the puzzle.
 */
type Grid = number[][];

export default function SudokuSolver() {
  const [grid, setGrid] = useState<Grid>(
    Array.from({ length: 6 }, () => Array(6).fill(0))
  );
  const [solveTime, setSolveTime] = useState<number | null>(null);
  const [backtrackCount, setBacktrackCount] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const isComplete = grid.flat().every(cell => cell !== 0);

  // Validate entire grid whenever it changes
  useEffect(() => {
    let conflict = false;

    // Check all cells for conflicts
    grid.forEach((row, rowIdx) => {
      row.forEach((val, colIdx) => {
        if (val !== 0 && !validateCell(grid, rowIdx, colIdx, false)) {
          conflict = true;
        }
      });
    });

    setHasConflict(conflict);
    if (conflict) {
      setError('Conflict detected in puzzle');
    } else {
      setError(null);
    }
  }, [grid]);

  const validateCell = (
    grid: Grid,
    row: number,
    col: number,
    setErrorState: boolean = true
  ): boolean => {
    const value = grid[row][col];
    if (value === 0) return true;

    // Check row
    for (let i = 0; i < 6; i++) {
      if (i !== col && grid[row][i] === value) {
        if (setErrorState) setError(`Duplicate ${value} in row ${row + 1}`);
        return false;
      }
    }

    // Check column
    for (let i = 0; i < 6; i++) {
      if (i !== row && grid[i][col] === value) {
        if (setErrorState) setError(`Duplicate ${value} in column ${col + 1}`);
        return false;
      }
    }

    // Check region
    const startRow = Math.floor(row / 2) * 2;
    const startCol = Math.floor(col / 3) * 3;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        const checkRow = startRow + r;
        const checkCol = startCol + c;
        if (
          checkRow !== row &&
          checkCol !== col &&
          grid[checkRow][checkCol] === value
        ) {
          if (setErrorState) setError(`Duplicate ${value} in region`);
          return false;
        }
      }
    }

    return true;
  };

  const handleChange = (row: number, col: number, value: string) => {
    const num = parseInt(value) || 0;
    const newGrid = grid.map(r => [...r]);
    newGrid[row][col] = num > 6 ? 6 : num < 0 ? 0 : num;

    setGrid(newGrid);
    setSolveTime(null);
    setBacktrackCount(0);

    // Immediate validation for the changed cell only
    if (num !== 0) {
      validateCell(newGrid, row, col);
    }
  };

  const solveSudoku = useCallback(async (grid: Grid): Promise<boolean> => {
    let backtracks = 0;
    let shouldContinue = true;

    const solve = (): boolean => {
      if (!shouldContinue) return false;

      for (let row = 0; row < 6 && shouldContinue; row++) {
        for (let col = 0; col < 6 && shouldContinue; col++) {
          if (grid[row][col] === 0) {
            for (let num = 1; num <= 6 && shouldContinue; num++) {
              grid[row][col] = num;

              if (validateCell(grid, row, col, false)) {
                if (solve()) {
                  return true;
                }
                backtracks++;
              }

              grid[row][col] = 0;
            }
            return false;
          }
        }
      }
      return true;
    };

    const result = solve();
    setBacktrackCount(backtracks);
    return result;
  }, []);

  const handleSolve = async () => {
    if (hasConflict) {
      setError('Please resolve conflicts before solving');
      return;
    }

    setIsSolving(true);
    setError(null);
    setBacktrackCount(0);

    const startTime = performance.now();
    const newGrid = grid.map(row => [...row]);
    const solved = await solveSudoku(newGrid);

    if (solved) {
      setSolveTime(performance.now() - startTime);
      setGrid(newGrid);
    } else {
      setError('No solution exists for this puzzle!');
    }

    setIsSolving(false);
  };
  const handleSave = () => {
    const isFilled = grid.flat().every(cell => cell !== 0);
    if (!isFilled || hasConflict) {
      setError('Complete the puzzle correctly before saving');
      return;
    }
    alert('Puzzle saved successfully!');
  };
  const handleReset = () => {
    setGrid(Array.from({ length: 6 }, () => Array(6).fill(0)));
    setSolveTime(null);
    setBacktrackCount(0);
    setError(null);
  };

  const getCellClass = (row: number, col: number, value: number): string => {
    const classes = ['sudoku-cell'];
    if (row % 2 === 0) classes.push('region-top');
    if (col % 3 === 0) classes.push('region-left');
    if (value !== 0) classes.push(`highlight-${value}`);
    return classes.join(' ');
  };

  return (
    <div className="sudoku-container">
      <div className="sudoku-card">
        <div className="sudoku-header">
          <div className="header-content">
            <img
              src="./6x6logo.png"
              alt="6×6 Sudoku Solver"
              className="sudoku-logo"
            />
            <div className="stats-container">
              <div className="stat-pair">
                <span className="stat-label">STATUS</span>
                <span className="stat-value">
                  {solveTime ? 'Solved' : 'Ready'}
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-pair">
                <span className="stat-label">TIME</span>
                <span className="stat-value">
                  {solveTime ? `${(solveTime / 1000).toFixed(2)}s` : '—'}
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-pair">
                <span className="stat-label">BACKTRACKS</span>
                <span className="stat-value">{backtrackCount}</span>
              </div>
            </div>
          </div>
          <p className="grid-description">6×6 grid with 2×3 regions</p>
        </div>

        <div className="sudoku-content">
          <div className="sudoku-grid">
            {grid.map((row, rIdx) =>
              row.map((val, cIdx) => (
                <input
                  key={`${rIdx}-${cIdx}`}
                  type="number"
                  min="1"
                  max="6"
                  value={val === 0 ? '' : val}
                  onChange={e => handleChange(rIdx, cIdx, e.target.value)}
                  className={getCellClass(rIdx, cIdx, val)}
                  disabled={isSolving}
                />
              ))
            )}
          </div>

          {error && <div className="warning-message">{error}</div>}

          <div className="sudoku-buttons">
            <button
              onClick={handleSolve}
              disabled={isSolving}
              className="sudoku-button solve"
            >
              {isSolving ? (
                <>
                  <svg
                    className="spinner"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      opacity="0.25"
                    ></circle>
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      opacity="0.75"
                    ></path>
                  </svg>
                  Solving...
                </>
              ) : (
                'Solve'
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={!isComplete}
              className="sudoku-button save"
            >
              Save
            </button>
            <button onClick={handleReset} className="sudoku-button reset">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
