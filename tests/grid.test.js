import { describe, expect, it } from "vitest";
import {
    canPlacePiece,
    clearFullRows,
    createGrid,
    GRID_HEIGHT,
    GRID_WIDTH,
    placePiece,
} from "../src/core/grid.js";

describe("grille", () => {
    it("crée une grille vide de 10 colonnes et 20 lignes", () => {
        const grid = createGrid();

        expect(grid).toHaveLength(GRID_HEIGHT);
        expect(grid.every(row => row.length === GRID_WIDTH)).toBe(true);
        expect(grid.flat().every(cell => cell === 0)).toBe(true);
    });

    it("crée des lignes indépendantes", () => {
        const grid = createGrid();
        grid[0][0] = 1;

        expect(grid[1][0]).toBe(0);
    });

    it("autorise un placement valide et refuse les limites et collisions", () => {
        const grid = createGrid();
        const piece = [
            [1, 1],
            [0, 1],
        ];

        expect(canPlacePiece(grid, piece, 0, 0)).toBe(true);
        expect(canPlacePiece(grid, piece, -1, 0)).toBe(false);
        expect(canPlacePiece(grid, piece, GRID_WIDTH - 1, 0)).toBe(false);
        expect(canPlacePiece(grid, piece, 0, GRID_HEIGHT - 1)).toBe(false);

        const occupiedGrid = placePiece(grid, [[1]], 0, 0);
        expect(canPlacePiece(occupiedGrid, [[1]], 0, 0)).toBe(false);
    });

    it("autorise un placement qui touche les bords droit et inférieur", () => {
        const grid = createGrid();
        const piece = [
            [1, 1],
            [0, 1],
        ];

        expect(canPlacePiece(grid, piece, GRID_WIDTH - 2, GRID_HEIGHT - 2)).toBe(true);
    });

    it("rejette les coordonnées non entières et les matrices de pièce invalides", () => {
        const grid = createGrid();

        expect(() => canPlacePiece(grid, [[1]], 0.5, 0)).toThrow(
            "La position de la pièce doit utiliser des coordonnées entières.",
        );
        expect(() => canPlacePiece(grid, [[1]], 0, Number.NaN)).toThrow(
            "La position de la pièce doit utiliser des coordonnées entières.",
        );
        expect(() => canPlacePiece(grid, [[1, 1]], 0, 0)).toThrow(
            "La pièce doit être une matrice carrée composée de 0 et de 1.",
        );
        expect(() => canPlacePiece(grid, [[2]], 0, 0)).toThrow(
            "La pièce doit être une matrice carrée composée de 0 et de 1.",
        );
    });

    it("rejette une grille de dimensions ou de contenu invalide", () => {
        const grid = createGrid();
        const shortGrid = grid.slice(1);
        const invalidCellGrid = grid.map(row => [...row]);
        invalidCellGrid[0][0] = 2;

        expect(() => canPlacePiece(shortGrid, [[1]], 0, 0)).toThrow(
            "La grille doit contenir 20 lignes de 10 cases binaires.",
        );
        expect(() => canPlacePiece(invalidCellGrid, [[1]], 0, 0)).toThrow(
            "La grille doit contenir 20 lignes de 10 cases binaires.",
        );
    });

    it("verrouille une pièce sans modifier la grille d'origine", () => {
        const grid = createGrid();
        const piece = [
            [1, 1],
            [0, 1],
        ];

        const nextGrid = placePiece(grid, piece, 3, 4);

        expect(nextGrid[4].slice(3, 5)).toEqual([1, 1]);
        expect(nextGrid[5][4]).toBe(1);
        expect(nextGrid[5][3]).toBe(0);
        expect(grid.flat().every(cell => cell === 0)).toBe(true);
        expect(() => placePiece(grid, piece, -1, 0)).toThrow(
            "La pièce ne peut pas être placée à cette position.",
        );
    });

    it("supprime les lignes complètes et ajoute des lignes vides en haut", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(1);
        grid[GRID_HEIGHT - 2][0] = 1;

        const result = clearFullRows(grid);

        expect(result.clearedRows).toBe(1);
        expect(result.grid[0]).toEqual(Array(GRID_WIDTH).fill(0));
        expect(result.grid[GRID_HEIGHT - 1][0]).toBe(1);
        expect(result.grid[GRID_HEIGHT - 1].slice(1)).toEqual(
            Array(GRID_WIDTH - 1).fill(0),
        );
        expect(grid[GRID_HEIGHT - 1]).toEqual(Array(GRID_WIDTH).fill(1));
    });

    it("ne modifie pas la grille lorsqu'aucune ligne n'est complète", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1][0] = 1;
        grid[GRID_HEIGHT - 2][GRID_WIDTH - 1] = 1;

        const result = clearFullRows(grid);

        expect(result.clearedRows).toBe(0);
        expect(result.grid).toEqual(grid);
        expect(result.grid).not.toBe(grid);
        expect(result.grid[0]).not.toBe(grid[0]);
    });

    it("supprime plusieurs lignes simultanément en conservant l'ordre des autres", () => {
        const grid = createGrid();
        grid[0][0] = 1;
        grid[3][1] = 1;
        grid[5] = Array(GRID_WIDTH).fill(1);
        grid[10] = Array(GRID_WIDTH).fill(1);
        grid[15][2] = 1;

        const result = clearFullRows(grid);
        const expectedRemainingRows = grid.filter(row => row.some(cell => cell === 0));

        expect(result.clearedRows).toBe(2);
        expect(result.grid.slice(0, 2)).toEqual([
            Array(GRID_WIDTH).fill(0),
            Array(GRID_WIDTH).fill(0),
        ]);
        expect(result.grid.slice(2)).toEqual(expectedRemainingRows);
        expect(grid[5]).toEqual(Array(GRID_WIDTH).fill(1));
        expect(grid[10]).toEqual(Array(GRID_WIDTH).fill(1));
    });
});
