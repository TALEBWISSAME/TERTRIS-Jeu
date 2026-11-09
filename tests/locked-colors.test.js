import { describe, expect, it } from "vitest";
import { clearFullRows, createGrid, GRID_HEIGHT, GRID_WIDTH, placePiece } from "../src/core/grid.js";
import { applyLockedPiece } from "../src/ui/locked-colors.js";

function createColorGrid() {
    return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

describe("synchronisation des couleurs verrouillées", () => {
    it("associe la couleur à la pièce réellement verrouillée", () => {
        const grid = createGrid();
        const piece = { type: "T", matrix: [[1, 1], [0, 1]], x: 3, y: 4 };
        const nextGrid = placePiece(grid, piece.matrix, piece.x, piece.y);

        const result = applyLockedPiece(grid, createColorGrid(), piece, nextGrid);

        expect(result.lockedColors[4].slice(3, 5)).toEqual(["T", "T"]);
        expect(result.lockedColors[5][4]).toBe("T");
        expect(result.removedRows).toEqual([]);
    });

    it("retire les couleurs des lignes complètes et garde la grille synchronisée", () => {
        const grid = createGrid();
        const colors = createColorGrid();
        for (const x of [0, 1, 2, 3, 6, 7, 8, 9]) {
            grid[GRID_HEIGHT - 1][x] = 1;
            colors[GRID_HEIGHT - 1][x] = "J";
        }
        colors[GRID_HEIGHT - 1][4] = null;
        colors[GRID_HEIGHT - 1][5] = null;
        grid[GRID_HEIGHT - 2] = Array(GRID_WIDTH).fill(1);
        grid[GRID_HEIGHT - 2][5] = 0;
        grid[GRID_HEIGHT - 2][9] = 0;
        colors[GRID_HEIGHT - 2] = Array(GRID_WIDTH).fill("J");
        colors[GRID_HEIGHT - 2][5] = null;
        colors[GRID_HEIGHT - 2][9] = null;
        const piece = {
            type: "T",
            matrix: [[0, 1], [1, 1]],
            x: 4,
            y: GRID_HEIGHT - 2,
        };
        const lockedGrid = placePiece(grid, piece.matrix, piece.x, piece.y);
        const { grid: nextGrid, clearedRows } = clearFullRows(lockedGrid);

        const result = applyLockedPiece(grid, colors, piece, nextGrid);

        expect(clearedRows).toBe(1);
        expect(result.removedRows).toHaveLength(1);
        expect(result.removedRows[0]).toEqual(["J", "J", "J", "J", "T", "T", "J", "J", "J", "J"]);
        expect(result.lockedColors[0]).toEqual(Array(GRID_WIDTH).fill(null));
        expect(result.lockedColors[GRID_HEIGHT - 1][5]).toBe("T");
        expect(result.lockedColors[GRID_HEIGHT - 1][9]).toBeNull();
        expect(result.lockedColors.flat().filter(Boolean)).toHaveLength(9);
    });

    it("préserve les instantanés des lignes pour plusieurs lignes simultanées", () => {
        const grid = createGrid();
        const colors = createColorGrid();
        for (const y of [GRID_HEIGHT - 2, GRID_HEIGHT - 1]) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (x !== 4 && x !== 5) {
                    grid[y][x] = 1;
                    colors[y][x] = y === GRID_HEIGHT - 2 ? "L" : "S";
                }
            }
        }
        const piece = { type: "O", matrix: [[1, 1], [1, 1]], x: 4, y: GRID_HEIGHT - 2 };
        const lockedGrid = placePiece(grid, piece.matrix, piece.x, piece.y);
        const nextGrid = clearFullRows(lockedGrid).grid;

        const result = applyLockedPiece(grid, colors, piece, nextGrid);

        expect(result.removedRows).toHaveLength(2);
        expect(result.removedRows[0].every(color => color === "L" || color === "O")).toBe(true);
        expect(result.removedRows[1].every(color => color === "S" || color === "O")).toBe(true);
        expect(result.lockedColors.slice(0, 2)).toEqual([
            Array(GRID_WIDTH).fill(null),
            Array(GRID_WIDTH).fill(null),
        ]);
        expect(result.lockedColors.map(row => row.map(color => color ? 1 : 0))).toEqual(nextGrid);
    });

    it("rejette un verrouillage hors limites ou en collision", () => {
        const grid = createGrid();
        const colors = createColorGrid();
        const outOfBoundsPiece = { type: "I", matrix: [[1]], x: -1, y: 0 };
        const collidingPiece = { type: "O", matrix: [[1]], x: 2, y: 3 };

        expect(() => applyLockedPiece(grid, colors, outOfBoundsPiece, grid)).toThrow(
            "La pièce ne peut pas être synchronisée hors de la grille ou en collision.",
        );

        grid[3][2] = 1;
        colors[3][2] = "J";
        expect(() => applyLockedPiece(grid, colors, collidingPiece, grid)).toThrow(
            "La pièce ne peut pas être synchronisée hors de la grille ou en collision.",
        );
    });
});
