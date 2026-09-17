import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyGravity,
  collapseClearedRows,
  compressColumn,
  detectEmptySpaces,
  findFilledRows,
  resolveCascade,
} from './gravity';
import type { PieceType } from './types';

type Cell = PieceType | null;

function column(...cells: Cell[]): Cell[] {
  return cells;
}

function boardOf(...rows: Cell[][]): Cell[][] {
  return rows.map((row) => row.slice());
}

describe('compressColumn', () => {
  it('packs a single gap toward the bottom', () => {
    const { packed, moves } = compressColumn(column('Z', null, 'J'));
    assert.deepEqual(packed, [null, 'Z', 'J']);
    assert.deepEqual(moves, [{ fromY: 0, toY: 1, type: 'Z' }]);
  });

  it('packs consecutive gaps toward the bottom', () => {
    const { packed, moves } = compressColumn(column('Z', null, null, 'J'));
    assert.deepEqual(packed, [null, null, 'Z', 'J']);
    assert.deepEqual(moves, [{ fromY: 0, toY: 2, type: 'Z' }]);
  });

  it('leaves a solid stack unchanged', () => {
    const { packed, moves } = compressColumn(column('Z', 'J', 'S'));
    assert.deepEqual(packed, ['Z', 'J', 'S']);
    assert.deepEqual(moves, []);
  });

  it('preserves top-to-bottom order across multiple gaps', () => {
    const { packed, moves } = compressColumn(column('Z', null, 'J', null, 'S', 'O'));
    assert.deepEqual(packed, [null, null, 'Z', 'J', 'S', 'O']);
    assert.deepEqual(moves, [
      { fromY: 0, toY: 2, type: 'Z' },
      { fromY: 2, toY: 3, type: 'J' },
    ]);
  });

  it('handles a completely empty column', () => {
    const { packed, moves } = compressColumn(column(null, null, null));
    assert.deepEqual(packed, [null, null, null]);
    assert.deepEqual(moves, []);
  });

  it('leaves blocks already on the floor in place', () => {
    const { packed, moves } = compressColumn(column(null, null, 'T'));
    assert.deepEqual(packed, [null, null, 'T']);
    assert.deepEqual(moves, []);
  });
});

describe('applyGravity', () => {
  it('Test 1: single gap in one column', () => {
    const result = applyGravity(boardOf(['Z'], [null], ['J']));
    assert.deepEqual(result.board, boardOf([null], ['Z'], ['J']));
    assert.deepEqual(result.affectedColumns, [0]);
    assert.equal(result.moves[0]?.fromY, 0);
    assert.equal(result.moves[0]?.toY, 1);
  });

  it('Test 2: two consecutive empty cells', () => {
    const result = applyGravity(boardOf(['Z'], [null], [null], ['J']));
    assert.deepEqual(result.board, boardOf([null], [null], ['Z'], ['J']));
  });

  it('Test 3: stacked blocks stay unchanged', () => {
    const board = boardOf(['Z'], ['J'], ['S']);
    const result = applyGravity(board);
    assert.deepEqual(result.board, board);
    assert.deepEqual(result.moves, []);
  });

  it('Test 4: multiple columns fall independently', () => {
    const result = applyGravity(
      boardOf(
        ['Z', 'S', 'T'],
        [null, null, 'T'],
        ['J', 'O', null]
      )
    );
    assert.deepEqual(
      result.board,
      boardOf(
        [null, null, null],
        ['Z', 'S', 'T'],
        ['J', 'O', 'T']
      )
    );
    assert.deepEqual(result.affectedColumns, [0, 1, 2]);
  });

  it('Test 5: multiple consecutive gaps in one column', () => {
    const result = applyGravity(boardOf(['Z'], [null], ['J'], [null], ['S']));
    assert.deepEqual(result.board, boardOf([null], [null], ['Z'], ['J'], ['S']));
  });

  it('Test 6: blocks keep their original order', () => {
    const result = applyGravity(boardOf(['Z'], ['T'], [null], ['J'], [null], ['S']));
    assert.deepEqual(result.board, boardOf([null], [null], ['Z'], ['T'], ['J'], ['S']));
    const fallingTypes = result.moves.map((move) => move.type);
    assert.deepEqual(fallingTypes, ['Z', 'T', 'J']);
  });

  it('only processes affected columns when provided', () => {
    const result = applyGravity(
      boardOf(
        ['Z', 'S'],
        [null, null],
        ['J', 'O']
      ),
      [0]
    );
    assert.deepEqual(
      result.board,
      boardOf(
        [null, 'S'],
        ['Z', null],
        ['J', 'O']
      )
    );
    assert.deepEqual(result.affectedColumns, [0]);
  });
});

describe('detectEmptySpaces', () => {
  it('finds empty cells that sit under a block', () => {
    const gaps = detectEmptySpaces(boardOf(['Z'], [null], ['J'], [null]));
    assert.deepEqual(gaps, [
      { x: 0, y: 1 },
      { x: 0, y: 3 },
    ]);
  });

  it('ignores empty cells above the topmost block', () => {
    const gaps = detectEmptySpaces(boardOf([null], [null], ['J']));
    assert.deepEqual(gaps, []);
  });
});

describe('collapseClearedRows', () => {
  it('does not move blocks when no row was cleared', () => {
    const board = boardOf([null, 'Z', null, 'J'], ['Z', 'Z', null, 'J']);
    const result = collapseClearedRows(board, []);
    assert.deepEqual(result.board, board);
    assert.deepEqual(result.moves, []);
  });

  it('drops rows above a cleared line and keeps existing gaps', () => {
    const result = collapseClearedRows(
      boardOf(
        [null, 'Z', null, 'J'],
        ['Z', 'Z', null, 'J'],
        ['Z', 'Z', 'S', 'J']
      ),
      [2]
    );
    assert.deepEqual(
      result.board,
      boardOf(
        [null, null, null, null],
        [null, 'Z', null, 'J'],
        ['Z', 'Z', null, 'J']
      )
    );
    assert.ok(result.moves.every((move) => move.toY === move.fromY + 1));
  });

  it('preserves block order inside each remaining row', () => {
    const result = collapseClearedRows(
      boardOf(
        ['Z', 'T', null],
        ['J', 'J', 'J']
      ),
      [1]
    );
    assert.deepEqual(result.board, boardOf([null, null, null], ['Z', 'T', null]));
  });
});

describe('resolveCascade', () => {
  it('never auto-flows just because empty cells exist', () => {
    const board = boardOf(
      ['Z', null, 'J'],
      [null, 'T', null],
      ['S', null, 'O']
    );
    const result = resolveCascade(board);
    assert.deepEqual(result.board, board);
    assert.deepEqual(result.waves, []);
  });

  it('clears a full row then shifts remaining rows down', () => {
    const result = resolveCascade(
      boardOf(
        ['I', 'I', null],
        [null, null, 'I'],
        ['J', 'J', 'J']
      )
    );
    assert.deepEqual(
      result.board,
      boardOf(
        [null, null, null],
        ['I', 'I', null],
        [null, null, 'I']
      )
    );
    assert.deepEqual(result.waves[0]?.clearedRows, [2]);
    assert.ok(result.waves[0]?.moves.length > 0);
  });

  it('stops when the board is already stable', () => {
    const board = boardOf(['Z', null], ['J', null], ['S', null]);
    const result = resolveCascade(board);
    assert.deepEqual(result.board, board);
    assert.deepEqual(result.waves, []);
  });

  it('does not loop forever on a full board', () => {
    const result = resolveCascade(boardOf(['Z', 'J'], ['T', 'S']));
    assert.deepEqual(result.board, boardOf([null, null], [null, null]));
    assert.ok(result.waves.length > 0);
    assert.ok(result.waves.length <= 20);
  });
});

describe('findFilledRows', () => {
  it('detects only completely filled rows', () => {
    const board = boardOf(['I', null], ['J', 'J']);
    assert.deepEqual(findFilledRows(board), [1]);
  });
});
