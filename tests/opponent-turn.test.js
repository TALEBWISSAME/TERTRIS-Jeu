import { describe, expect, it } from "vitest";
import { GameManager } from "../src/core/game-manager.js";
import { advanceOpponentTurn } from "../src/core/opponent-turn.js";
import { createGrid, GRID_HEIGHT, GRID_WIDTH } from "../src/core/grid.js";

describe("descente des adversaires", () => {
    it.each(["beginner", "intermediate", "expert"])(
        "fait descendre l'IA %s d'une case par étape avant le verrouillage",
        difficulty => {
            const manager = new GameManager({ opponents: 1, difficulty, seed: 44 });
            const opponent = manager.opponents[0];
            const game = opponent.game;
            game.state.grid = createGrid();
            const turn = { piece: null, placement: null };
            const firstPiece = game.currentPiece;

            advanceOpponentTurn(opponent, turn);

            expect(game.currentPiece).toBe(firstPiece);
            expect(game.currentPiece.y).toBe(1);
            expect(game.grid.flat().filter(cell => cell === 1)).toHaveLength(0);

            let steps = 1;
            while (game.currentPiece === firstPiece && steps <= GRID_HEIGHT) {
                const previousY = game.currentPiece.y;
                advanceOpponentTurn(opponent, turn);
                steps++;

                if (game.currentPiece === firstPiece) {
                    expect(game.currentPiece.y).toBe(previousY + 1);
                }
            }

            expect(game.currentPiece).not.toBe(firstPiece);
            expect(steps).toBeGreaterThan(1);
            expect(game.grid.flat().filter(cell => cell === 1)).toHaveLength(4);
            expect(turn).toEqual({ piece: null, placement: null });
        },
    );

    it("utilise le moteur pour verrouiller une pièce et supprimer une ligne", () => {
        const manager = new GameManager({
            opponents: 1,
            difficulty: "intermediate",
            seed: 7,
        });
        const opponent = manager.opponents[0];
        const game = opponent.game;
        game.state.grid = createGrid();
        game.state.grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(1);
        game.state.grid[GRID_HEIGHT - 1][GRID_WIDTH - 1] = 0;
        game.currentPiece.matrix = [[1]];
        game.currentPiece.x = 0;
        game.currentPiece.y = 0;
        const firstPiece = game.currentPiece;
        const turn = { piece: null, placement: null };

        while (game.currentPiece === firstPiece) {
            advanceOpponentTurn(opponent, turn);
        }

        expect(game.linesCleared).toBe(1);
        expect(game.score).toBe(100);
        expect(game.grid[GRID_HEIGHT - 1]).toEqual(Array(GRID_WIDTH).fill(0));
    });
});
