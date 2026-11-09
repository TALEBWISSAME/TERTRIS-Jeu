import { describe, expect, it } from "vitest";
import { GameManager } from "../src/core/game-manager.js";

describe("GameManager", () => {
    it("crée une partie solo avec un joueur humain", () => {
        const manager = new GameManager({ seed: 12 });

        expect(manager.players).toHaveLength(1);
        expect(manager.humanPlayer).toBe(manager.players[0]);
        expect(manager.humanPlayer.role).toBe("human");
        expect(manager.opponents).toHaveLength(0);
        expect(manager.games).toHaveLength(1);
    });

    it.each([1, 2, 3])("crée une partie avec %i adversaire(s)", opponents => {
        const manager = new GameManager({ opponents, seed: 12 });

        expect(manager.players).toHaveLength(opponents + 1);
        expect(manager.humanPlayer.index).toBe(0);
        expect(manager.humanPlayer.role).toBe("human");
        expect(manager.opponents).toHaveLength(opponents);
        expect(manager.opponents.every(player => player.role === "opponent")).toBe(true);
    });

    it.each([-1, 1.5, 4, NaN, "2", null])(
        "refuse le nombre d'adversaires invalide %s",
        opponents => {
            expect(() => new GameManager({ opponents })).toThrow(RangeError);
        },
    );

    it("donne à chaque partie un état et un générateur indépendants", () => {
        const manager = new GameManager({ opponents: 2, seed: 25 });
        const [human, opponent1, opponent2] = manager.games;

        human.grid[19][0] = 1;
        human.currentPiece.x -= 1;
        human.state.score = 500;

        expect(opponent1.grid[19][0]).toBe(0);
        expect(opponent2.grid[19][0]).toBe(0);
        expect(opponent1.currentPiece.x).not.toBe(human.currentPiece.x);
        expect(opponent1.score).toBe(0);
        expect(opponent2.score).toBe(0);
        expect(new Set(manager.games.map(game => game.state.random)).size).toBe(3);
    });

    it("reproduit les mêmes graines de joueur et d'adversaires pour une graine initiale donnée", () => {
        const first = new GameManager({ opponents: 3, seed: 2026 });
        const second = new GameManager({ opponents: 3, seed: 2026 });
        const firstPieces = first.players.map(({ game }) => [
            game.currentPiece.type,
            game.nextPieceType,
        ]);
        const secondPieces = second.players.map(({ game }) => [
            game.currentPiece.type,
            game.nextPieceType,
        ]);

        expect(firstPieces).toEqual(secondPieces);
        expect(first.players.map(({ game }) => game.state.random))
            .not.toEqual(second.players.map(({ game }) => game.state.random));
    });

    it("refuse une graine non entière", () => {
        expect(() => new GameManager({ seed: 2.5 })).toThrow(TypeError);
    });

    it.each(["beginner", "intermediate", "expert"])(
        "attribue la difficulté %s uniquement aux adversaires",
        difficulty => {
            const manager = new GameManager({ opponents: 2, difficulty, seed: 31 });

            expect(manager.humanPlayer.difficulty).toBeNull();
            expect(manager.opponents.map(player => player.difficulty)).toEqual([
                difficulty,
                difficulty,
            ]);
            expect(manager.opponents.every(player => typeof player.aiRandom === "function")).toBe(true);
            expect(manager.opponents.every(player => player.aiPlayer.difficulty === difficulty)).toBe(true);
            expect(manager.opponents.every(player => player.aiPlayer.moveIntervalMs
                === ({ beginner: 300, intermediate: 200, expert: 100 })[difficulty])).toBe(true);
            expect(manager.humanPlayer.aiRandom).toBeNull();
            expect(manager.humanPlayer.aiPlayer).toBeNull();
        },
    );

    it("refuse une difficulté inconnue", () => {
        expect(() => new GameManager({ opponents: 1, difficulty: "impossible" })).toThrow(RangeError);
    });

    it("fournit des générateurs IA indépendants et reproductibles", () => {
        const first = new GameManager({ opponents: 2, seed: 88 });
        const repeated = new GameManager({ opponents: 2, seed: 88 });
        const firstValues = first.opponents.map(player => player.aiRandom());
        const repeatedValues = repeated.opponents.map(player => player.aiRandom());

        expect(new Set(first.opponents.map(player => player.aiRandom)).size).toBe(2);
        expect(firstValues).toEqual(repeatedValues);
        expect(firstValues[0]).not.toBe(firstValues[1]);
    });

    it.each([0, 1, 2, 3])(
        "classe en tête le dernier joueur encore en vie (joueur %i)",
        winnerIndex => {
            const manager = new GameManager({ opponents: 3, seed: 2026 });
            const eliminatedIndexes = manager.players
                .filter(player => player.index !== winnerIndex)
                .map(player => player.index);

            eliminatedIndexes.forEach((index, eliminationIndex) => {
                manager.players[index].game.state.status = "gameover";
                manager.updateResults();

                expect(manager.isFinished).toBe(eliminationIndex === eliminatedIndexes.length - 1);
            });

            expect(manager.winner).toBe(manager.players[winnerIndex]);
            const expectedRanking = [
                manager.players[winnerIndex],
                ...[...eliminatedIndexes].reverse().map(index => manager.players[index]),
            ];
            expect(manager.ranking).toEqual(expectedRanking);
            expect(manager.podium).toEqual(expectedRanking.slice(0, 3));
            expect(manager.podium).toHaveLength(3);
        },
    );

    it("ne désigne pas de gagnant en mode solo et garde les résultats réinitialisés", () => {
        const manager = new GameManager({ seed: 12 });
        manager.humanPlayer.game.state.status = "gameover";

        expect(manager.updateResults()).toEqual([]);
        expect(manager.winner).toBeNull();
        expect(manager.isFinished).toBe(false);

        const restartedManager = new GameManager({ opponents: 2, seed: 13 });
        expect(restartedManager.winner).toBeNull();
        expect(restartedManager.ranking).toEqual([]);
        expect(restartedManager.podium).toEqual([]);
        expect(restartedManager.isFinished).toBe(false);
    });
});
