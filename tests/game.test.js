import { describe, expect, it } from "vitest";
import {
    createGame,
    createSeededRandom,
    getDropInterval,
    movePiece,
    rotatePiece,
    softDrop,
    tick,
} from "../src/core/game.js";
import { createGrid, GRID_HEIGHT, GRID_WIDTH } from "../src/core/grid.js";
import { PIECES } from "../src/core/piece.js";

function fixedRandom(value = 0) {
    return () => value;
}

function findBottomOccupiedRow(matrix) {
    for (let row = matrix.length - 1; row >= 0; row--) {
        if (matrix[row].includes(1)) {
            return row;
        }
    }
    return -1;
}

function fillRowsBelowCurrentPiece(game, rowsToFill) {
    const pieceBottom = game.currentPiece.y + game.currentPiece.matrix.length;
    const firstRow = GRID_HEIGHT - rowsToFill;
    for (let y = firstRow; y < GRID_HEIGHT; y++) {
        game.grid[y] = Array(GRID_WIDTH).fill(1);
    }

    for (let y = firstRow; y < Math.min(pieceBottom, GRID_HEIGHT); y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (game.currentPiece.matrix[y - game.currentPiece.y]?.[x - game.currentPiece.x] === 1) {
                game.grid[y][x] = 0;
            }
        }
    }
}

describe("moteur de partie", () => {
    it("déplace la pièce à gauche et à droite sans traverser les bords", () => {
        const game = createGame({ random: fixedRandom() });
        const startX = game.currentPiece.x;

        movePiece(game, -1);
        expect(game.currentPiece.x).toBe(startX - 1);

        for (let i = 0; i < GRID_WIDTH; i++) {
            movePiece(game, -1);
        }
        expect(game.currentPiece.x).toBeGreaterThanOrEqual(0);

        for (let i = 0; i < GRID_WIDTH; i++) {
            movePiece(game, 1);
        }
        expect(game.currentPiece.x + game.currentPiece.matrix.length).toBeLessThanOrEqual(GRID_WIDTH);
    });

    it("tourne une pièce horairement si la rotation est libre", () => {
        const game = createGame({ random: fixedRandom(0.3) });
        const original = game.currentPiece.matrix;

        rotatePiece(game);

        expect(game.currentPiece.matrix).not.toEqual(original);
        expect(game.currentPiece.matrix).toEqual([
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0],
        ]);
    });

    it("refuse un déplacement ou une rotation en collision", () => {
        const game = createGame({ random: fixedRandom(0.3) });
        const piece = game.currentPiece;
        const originalX = piece.x;
        const originalMatrix = piece.matrix.map(row => [...row]);
        game.grid[piece.y + 1][piece.x + 3] = 1;

        movePiece(game, 1);
        game.grid[piece.y + 1][piece.x + 3] = 0;
        game.grid[piece.y + 2][piece.x + 1] = 1;
        rotatePiece(game);

        expect(piece.x).toBe(originalX);
        expect(piece.matrix).toEqual(originalMatrix);
    });

    it("verrouille une pièce lorsqu'elle ne peut plus descendre", () => {
        const game = createGame({ random: fixedRandom() });
        const piece = game.currentPiece;
        const occupiedCells = piece.matrix.flat().filter(cell => cell === 1).length;
        const bottomOccupiedRow = findBottomOccupiedRow(piece.matrix);
        piece.y = GRID_HEIGHT - 1 - bottomOccupiedRow;

        tick(game);

        expect(game.grid.flat().filter(cell => cell === 1)).toHaveLength(occupiedCells);
        expect(game.currentPiece).not.toBe(piece);
        expect(game.status).toBe("playing");
    });

    it("supprime une ligne complète et attribue le score correspondant", () => {
        const game = createGame({ random: fixedRandom() });
        const piece = game.currentPiece;
        piece.matrix = [[1]];
        piece.x = 0;
        piece.y = GRID_HEIGHT - 1;
        game.grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(1);
        game.grid[GRID_HEIGHT - 1][0] = 0;

        tick(game);

        expect(game.linesCleared).toBe(1);
        expect(game.score).toBe(100);
        expect(game.grid[GRID_HEIGHT - 1]).toEqual(Array(GRID_WIDTH).fill(0));
    });

    it("met à jour le niveau et la vitesse après dix lignes", () => {
        const game = createGame({ random: fixedRandom() });
        const piece = game.currentPiece;
        piece.matrix = [[1]];
        piece.x = 0;
        piece.y = GRID_HEIGHT - 1;
        fillRowsBelowCurrentPiece(game, 4);
        game.linesCleared = 9;
        game.level = 1;
        game.dropIntervalMs = getDropInterval(1);

        tick(game);

        expect(game.linesCleared).toBe(13);
        expect(game.level).toBe(2);
        expect(game.dropIntervalMs).toBeLessThan(getDropInterval(1));
    });

    it("termine la partie si la prochaine pièce ne peut pas apparaître", () => {
        const game = createGame({ random: fixedRandom() });
        game.currentPiece.matrix = [[1]];
        game.currentPiece.x = 0;
        game.currentPiece.y = GRID_HEIGHT - 1;

        const blockedNextType = game.nextPieceType;
        const nextPiece = PIECES[blockedNextType];
        const spawnX = Math.floor((GRID_WIDTH - nextPiece.length) / 2);
        for (let y = 0; y < nextPiece.length; y++) {
            for (let x = 0; x < nextPiece[y].length; x++) {
                if (nextPiece[y][x] === 1) {
                    game.grid[y][spawnX + x] = 1;
                }
            }
        }

        tick(game);

        expect(game.status).toBe("gameover");
        expect(game.currentPiece).toBeNull();
    });

    it("reproduit la même séquence de pièces avec la même graine", () => {
        const collectSequence = seed => {
            const game = createGame({ random: createSeededRandom(seed) });
            const sequence = [];

            for (let i = 0; i < 6 && game.status === "playing"; i++) {
                sequence.push(game.currentPiece.type, game.nextPieceType);
                game.grid = createGrid();

                const bottomOccupiedRow = findBottomOccupiedRow(game.currentPiece.matrix);
                game.currentPiece.y = GRID_HEIGHT - 1 - bottomOccupiedRow;
                tick(game);
            }
            return sequence;
        };

        expect(collectSequence(12345)).toEqual(collectSequence(12345));
    });

    it("fait descendre la pièce accélérée d'une case et augmente la vitesse par niveau", () => {
        const game = createGame({ random: fixedRandom() });
        const initialY = game.currentPiece.y;

        softDrop(game);

        expect(game.currentPiece.y).toBe(initialY + 1);
        expect(getDropInterval(2)).toBeLessThan(getDropInterval(1));
    });
});
