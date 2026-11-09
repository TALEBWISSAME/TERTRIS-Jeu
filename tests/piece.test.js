import { describe, expect, it } from "vitest";
import { rotate } from "../src/core/piece.js";
import { canPlacePiece, createGrid } from "../src/core/grid.js";

describe("rotate", () => {
    it("fait tourner une matrice 2x2 dans le sens horaire", () => {
        expect(rotate([
            [1, 2],
            [3, 4],
        ])).toEqual([
            [3, 1],
            [4, 2],
        ]);
    });

    it("fait tourner une matrice 3x3 dans le sens horaire", () => {
        expect(rotate([
            [1, 2, 3],
            [4, 5, 6],
            [7, 8, 9],
        ])).toEqual([
            [7, 4, 1],
            [8, 5, 2],
            [9, 6, 3],
        ]);
    });

    it("lève une erreur pour une matrice non carrée", () => {
        expect(() => rotate([
            [1, 2, 3],
            [4, 5, 6],
        ])).toThrow("La matrice doit être carrée.");
    });

        it("vérifie les quatre orientations de la pièce T", () => {
        const T = [
            [0, 1, 0],
            [1, 1, 1],
            [0, 0, 0],
        ];  

        const T90 = [
            [0, 1, 0],
            [0, 1, 1],
            [0, 1, 0],
        ];
        const T180 = [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
        const T270 = [
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 0],
        ];


              expect(rotate(T)).toEqual(T90);
        expect(rotate(T90)).toEqual(T180);
        expect(rotate(T180)).toEqual(T270);
        expect(rotate(T270)).toEqual(T);
    });
      it("refuse le placement d'une pièce qui dépasse le bord droit de la grille", () => {
        const grid = createGrid();

        const piece = [
            [1, 1],
            [1, 1],
        ];

        expect(canPlacePiece(grid, piece, 9, 0)).toBe(false);
    });

    it("refuse le placement d'une pièce sur une case déjà occupée", () => {
        const grid = createGrid();
        grid[0][0] = 1;

        const piece = [
            [1, 1],
            [1, 1],
        ];

        expect(canPlacePiece(grid, piece, 0, 0)).toBe(false);
    });
});