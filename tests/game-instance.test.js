import { describe, expect, it } from "vitest";
import { createGame, movePiece } from "../src/core/game.js";
import { GameInstance } from "../src/core/game-instance.js";
import { PIECES, rotate } from "../src/core/piece.js";

describe("GameInstance", () => {
    it("crée des grilles et des pièces indépendantes", () => {
        const first = new GameInstance({ seed: 1 });
        const second = new GameInstance({ seed: 2 });
        const secondInitialGrid = second.grid.map(row => [...row]);
        const secondInitialX = second.currentPiece.x;

        first.grid[19][0] = 1;
        first.move(-1);

        expect(second.grid).toEqual(secondInitialGrid);
        expect(second.grid[19][0]).toBe(0);
        expect(second.currentPiece.x).toBe(secondInitialX);
        expect(first.grid).not.toBe(second.grid);
        expect(first.currentPiece).not.toBe(second.currentPiece);
    });

    it("conserve un score indépendant par instance", () => {
        const first = new GameInstance({ seed: 1 });
        const second = new GameInstance({ seed: 2 });
        first.state.score = 300;

        expect(first.score).toBe(300);
        expect(second.score).toBe(0);
    });

    it("utilise un générateur seedable propre à chaque instance", () => {
        const first = new GameInstance({ seed: 42 });
        const repeated = new GameInstance({ seed: 42 });
        const other = new GameInstance({ seed: 43 });

        expect(first.currentPiece.type).toBe(repeated.currentPiece.type);
        expect(first.nextPieceType).toBe(repeated.nextPieceType);
        expect(first.state.random).not.toBe(repeated.state.random);
        expect(first.state.random).not.toBe(other.state.random);
    });

    it("expose le déplacement, la rotation et les deux types de descente", () => {
        const instance = new GameInstance({ seed: 1 });
        const initialX = instance.currentPiece.x;
        const initialY = instance.currentPiece.y;

        expect(instance.move(-1)).toBe(instance);
        expect(instance.currentPiece.x).toBe(initialX - 1);
        expect(instance.rotate()).toBe(instance);
        expect(instance.softDrop()).toBe(instance);
        expect(instance.currentPiece.y).toBe(initialY + 1);
        expect(instance.tick()).toBe(instance);
        expect(instance.currentPiece.y).toBe(initialY + 2);
    });

    it("laisse le fonctionnement de createGame et des fonctions solo inchangé", () => {
        const soloGame = createGame({ seed: 123 });
        const instance = new GameInstance({ seed: 123 });

        expect(instance.currentPiece.type).toBe(soloGame.currentPiece.type);
        expect(instance.nextPieceType).toBe(soloGame.nextPieceType);

        const originalX = soloGame.currentPiece.x;
        movePiece(soloGame, -1);
        expect(soloGame.currentPiece.x).toBe(originalX - 1);
        expect(instance.currentPiece.x).not.toBe(soloGame.currentPiece.x);
    });

    it("accepte un générateur injecté sans le partager par défaut", () => {
        const random = () => 0.4;
        const instance = new GameInstance({ random });
        const other = new GameInstance({ seed: 9 });

        expect(instance.state.random).toBe(random);
        expect(instance.currentPiece.type).toBe("T");
        expect(other.state.random).not.toBe(random);
    });

    it("applique un placement final légal via le moteur et met à jour le score", () => {
        const instance = new GameInstance({ seed: 12 });
        const previousPiece = instance.currentPiece;
        instance.currentPiece.matrix = [[1]];
        instance.currentPiece.x = 0;
        instance.currentPiece.y = 19;
        instance.grid[19] = Array(10).fill(1);
        instance.grid[19][0] = 0;

        expect(instance.playPlacement({
            matrix: [[1]],
            x: 0,
            y: 19,
        })).toBe(instance);

        expect(instance.state.grid[19]).toEqual(Array(10).fill(0));
        expect(instance.score).toBe(100);
        expect(instance.linesCleared).toBe(1);
        expect(instance.currentPiece).not.toBe(previousPiece);
    });

    it("refuse un placement illégal sans modifier la partie", () => {
        const instance = new GameInstance({ seed: 22 });
        const gridBefore = instance.grid.map(row => [...row]);
        const pieceBefore = { ...instance.currentPiece, matrix: instance.currentPiece.matrix };

        expect(() => instance.playPlacement({
            matrix: [[1]],
            x: -1,
            y: 19,
        })).toThrow("Le placement doit être une position finale légale.");
        expect(instance.grid).toEqual(gridBefore);
        expect(instance.currentPiece).toEqual(pieceBefore);
    });

    it("refuse une forme qui ne correspond pas à la pièce active", () => {
        const instance = new GameInstance({ seed: 22 });
        instance.currentPiece.matrix = PIECES.T.map(row => [...row]);
        const gridBefore = instance.grid.map(row => [...row]);
        const matrixBefore = instance.currentPiece.matrix.map(row => [...row]);
        const pieceBefore = instance.currentPiece;

        expect(() => instance.playPlacement({
            matrix: [[1]],
            x: 0,
            y: 19,
        })).toThrow("Le placement doit être une position finale légale.");

        expect(instance.grid).toEqual(gridBefore);
        expect(instance.currentPiece).toBe(pieceBefore);
        expect(instance.currentPiece.matrix).toEqual(matrixBefore);
    });

    it("accepte et verrouille une rotation légale de la pièce active", () => {
        const instance = new GameInstance({ seed: 22 });
        instance.currentPiece.matrix = PIECES.T.map(row => [...row]);
        const previousPiece = instance.currentPiece;
        const rotatedMatrix = rotate(instance.currentPiece.matrix);

        expect(instance.playPlacement({
            matrix: rotatedMatrix,
            x: 0,
            y: 17,
        })).toBe(instance);

        expect(instance.grid.flat().filter(cell => cell === 1)).toHaveLength(4);
        expect(instance.currentPiece).not.toBe(previousPiece);
    });
});
