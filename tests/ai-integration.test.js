import { describe, expect, it } from "vitest";
import {
    chooseBeginnerPlacement,
    chooseExpertPlacement,
    chooseIntermediatePlacement,
} from "../src/core/ai.js";
import { GameManager } from "../src/core/game-manager.js";
import { createGame, movePiece } from "../src/core/game.js";
import { createGrid } from "../src/core/grid.js";
import { PIECES } from "../src/core/piece.js";

const AI_CHOOSERS = {
    beginner: (player, game) => chooseBeginnerPlacement(
        game.grid,
        game.currentPiece.matrix,
        player.aiRandom,
    ),
    intermediate: (_player, game) =>
        chooseIntermediatePlacement(game.grid, game.currentPiece.matrix),
    expert: (_player, game) => chooseExpertPlacement(
        game.grid,
        game.currentPiece.matrix,
        game.nextPieceType ? PIECES[game.nextPieceType] : undefined,
    ),
};

describe("intégration des IA adverses", () => {
    it.each(["beginner", "intermediate", "expert"])(
        "exécute réellement une décision %s et verrouille la pièce par le moteur",
        difficulty => {
            const manager = new GameManager({ opponents: 1, difficulty, seed: 44 });
            const opponent = manager.opponents[0];
            const game = opponent.game;
            game.state.grid = createGrid();
            const previousPiece = game.currentPiece;
            const choose = AI_CHOOSERS[difficulty];
            const placement = choose(opponent, game);

            expect(placement).not.toBeNull();
            game.playPlacement(placement);

            expect(game.grid.flat().filter(cell => cell === 1)).toHaveLength(4);
            expect(game.currentPiece).not.toBe(previousPiece);
            expect(game.status).toBe("playing");
            expect(game.score).toBe(0);
            expect(game.linesCleared).toBe(0);
        },
    );

    it("conserve le verrouillage, la suppression de ligne et le score du moteur", () => {
        const manager = new GameManager({ opponents: 1, difficulty: "intermediate", seed: 7 });
        const game = manager.opponents[0].game;
        game.state.grid = createGrid();
        game.currentPiece.matrix = [[1]];
        game.currentPiece.x = 0;
        game.currentPiece.y = 0;
        game.state.grid[19] = Array(10).fill(1);
        game.state.grid[19][0] = 0;

        const placement = chooseIntermediatePlacement(game.grid, game.currentPiece.matrix);
        game.playPlacement(placement);

        expect(game.linesCleared).toBe(1);
        expect(game.score).toBe(100);
        expect(game.grid[19]).toEqual(Array(10).fill(0));
    });

    it("ne change pas le fonctionnement du mode solo", () => {
        const solo = createGame({ seed: 123 });
        const initialX = solo.currentPiece.x;

        movePiece(solo, -1);

        expect(solo.currentPiece.x).toBe(initialX - 1);
        expect(solo.score).toBe(0);
        expect(solo.linesCleared).toBe(0);
    });
});
