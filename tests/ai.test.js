import { describe, expect, it, vi } from "vitest";
import {
    AIPlayer,
    AI_MOVE_INTERVALS_MS,
    chooseBeginnerPlacement,
    chooseExpertPlacement,
    chooseIntermediatePlacement,
    evaluateExpertFeatures,
    findLegalPlacements,
} from "../src/core/ai.js";
import { canPlacePiece, createGrid, GRID_HEIGHT, GRID_WIDTH } from "../src/core/grid.js";
import { createGame, createSeededRandom } from "../src/core/game.js";
import { GameInstance } from "../src/core/game-instance.js";
import { PIECES } from "../src/core/piece.js";

describe("énumération des placements légaux", () => {
    it("trouve des placements valides et au plus bas sur une grille vide", () => {
        const grid = createGrid();
        const placements = findLegalPlacements(grid, PIECES.T);

        expect(placements.length).toBeGreaterThan(0);
        for (const { matrix, x, y } of placements) {
            expect(canPlacePiece(grid, matrix, x, y)).toBe(true);
            expect(canPlacePiece(grid, matrix, x, y + 1)).toBe(false);
        }
    });

    it("inclut les placements qui touchent les bords gauche et droit", () => {
        const placements = findLegalPlacements(createGrid(), [[1]]);

        expect(placements.map(placement => placement.x)).toEqual(
            Array.from({ length: GRID_WIDTH }, (_, x) => x),
        );
        expect(placements.every(placement => placement.y === GRID_HEIGHT - 1)).toBe(true);
    });

    it("respecte les collisions avec les blocs déjà présents", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1][4] = 1;

        const placements = findLegalPlacements(grid, [[1]]);
        const atColumnFour = placements.filter(placement => placement.x === 4);

        expect(atColumnFour).toHaveLength(1);
        expect(atColumnFour[0].y).toBe(GRID_HEIGHT - 2);
        expect(placements.every(({ x, y }) => grid[y][x] === 0)).toBe(true);
    });

    it("énumère les rotations distinctes et élimine celles des pièces symétriques", () => {
        const squarePlacements = findLegalPlacements(createGrid(), PIECES.O);
        const teePlacements = findLegalPlacements(createGrid(), PIECES.T);

        expect([...new Set(squarePlacements.map(placement => placement.rotation))]).toEqual([0]);
        expect([...new Set(teePlacements.map(placement => placement.rotation))]).toEqual([0, 1, 2, 3]);
        expect(teePlacements.every(({ matrix }) => matrix.length === 3)).toBe(true);
    });

    it("ne modifie ni la grille ni la matrice fournie", () => {
        const game = createGame({ seed: 123 });
        const gridBefore = game.grid.map(row => [...row]);
        const pieceBefore = game.currentPiece.matrix.map(row => [...row]);

        const placements = findLegalPlacements(game.grid, game.currentPiece.matrix);

        expect(placements.length).toBeGreaterThan(0);
        expect(game.grid).toEqual(gridBefore);
        expect(game.currentPiece.matrix).toEqual(pieceBefore);
    });

    it("retourne une liste vide lorsque la grille est bloquée", () => {
        const grid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(1));

        expect(findLegalPlacements(grid, PIECES.T)).toEqual([]);
    });
});

describe("IA Débutant", () => {
    it("choisit un placement légal", () => {
        const grid = createGrid();
        const piece = PIECES.T;
        const placement = chooseBeginnerPlacement(grid, piece, () => 0.5);

        expect(placement).not.toBeNull();
        expect(canPlacePiece(grid, placement.matrix, placement.x, placement.y)).toBe(true);
        expect(canPlacePiece(grid, placement.matrix, placement.x, placement.y + 1)).toBe(false);
    });

    it("reproduit son choix avec la même graine", () => {
        const grid = createGrid();
        const first = chooseBeginnerPlacement(grid, PIECES.L, createSeededRandom(321));
        const repeated = chooseBeginnerPlacement(grid, PIECES.L, createSeededRandom(321));

        expect(repeated).toEqual(first);
    });

    it("peut choisir des placements différents selon le tirage aléatoire", () => {
        const grid = createGrid();
        const first = chooseBeginnerPlacement(grid, PIECES.T, () => 0);
        const last = chooseBeginnerPlacement(grid, PIECES.T, () => 0.999999);

        expect(last).not.toEqual(first);
    });

    it("retourne null sans consommer le générateur lorsqu'aucun placement n'est possible", () => {
        const blockedGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(1));
        const random = vi.fn(() => 0.5);

        expect(chooseBeginnerPlacement(blockedGrid, PIECES.T, random)).toBeNull();
        expect(random).not.toHaveBeenCalled();
    });

    it("ne modifie ni la grille ni la pièce fournie", () => {
        const game = createGame({ seed: 678 });
        const gridBefore = game.grid.map(row => [...row]);
        const pieceBefore = game.currentPiece.matrix.map(row => [...row]);

        const placement = chooseBeginnerPlacement(
            game.grid,
            game.currentPiece.matrix,
            createSeededRandom(9),
        );

        expect(placement).not.toBeNull();
        expect(game.grid).toEqual(gridBefore);
        expect(game.currentPiece.matrix).toEqual(pieceBefore);
    });

    it("refuse les générateurs absents ou les tirages hors de l'intervalle valide", () => {
        expect(() => chooseBeginnerPlacement(createGrid(), PIECES.T, null)).toThrow(TypeError);
        expect(() => chooseBeginnerPlacement(createGrid(), PIECES.T, () => 1)).toThrow(RangeError);
    });
});

describe("IA Intermédiaire", () => {
    it("choisit un placement légal", () => {
        const grid = createGrid();
        const placement = chooseIntermediatePlacement(grid, PIECES.T);

        expect(placement).not.toBeNull();
        expect(canPlacePiece(grid, placement.matrix, placement.x, placement.y)).toBe(true);
    });

    it("préfère compléter une ligne", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(1);
        grid[GRID_HEIGHT - 1][4] = 0;

        const placement = chooseIntermediatePlacement(grid, [[1]]);

        expect(placement.x).toBe(4);
    });

    it("évite d'augmenter la hauteur maximale lorsqu'une colonne moins haute est disponible", () => {
        const grid = createGrid();
        for (let y = GRID_HEIGHT - 5; y < GRID_HEIGHT; y++) {
            grid[y][0] = 1;
        }

        const placement = chooseIntermediatePlacement(grid, [[1]]);

        expect(placement.x).toBe(1);
        expect(placement.y).toBe(GRID_HEIGHT - 1);
    });

    it("pénalise les trous créés par un placement", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 2][0] = 1;

        const placement = chooseIntermediatePlacement(grid, [[1]]);

        expect(placement.x).toBe(1);
        expect(placement.y).toBe(GRID_HEIGHT - 1);
    });

    it("résout les égalités de façon déterministe", () => {
        const first = chooseIntermediatePlacement(createGrid(), [[1]]);
        const repeated = chooseIntermediatePlacement(createGrid(), [[1]]);

        expect(first).toEqual(repeated);
        expect(first.x).toBe(0);
    });

    it("reproduit la décision pour une même grille et une même pièce", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1][3] = 1;
        const first = chooseIntermediatePlacement(grid, PIECES.S);

        expect(chooseIntermediatePlacement(grid, PIECES.S)).toEqual(first);
    });

    it("ne modifie ni la grille ni la pièce d'origine", () => {
        const game = createGame({ seed: 246 });
        const gridBefore = game.grid.map(row => [...row]);
        const pieceBefore = game.currentPiece.matrix.map(row => [...row]);

        const placement = chooseIntermediatePlacement(game.grid, game.currentPiece.matrix);

        expect(placement).not.toBeNull();
        expect(game.grid).toEqual(gridBefore);
        expect(game.currentPiece.matrix).toEqual(pieceBefore);
    });

    it("retourne null lorsqu'aucun placement n'est possible", () => {
        const blockedGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(1));

        expect(chooseIntermediatePlacement(blockedGrid, PIECES.T)).toBeNull();
    });
});

describe("IA Experte", () => {
    it("calcule correctement les quatre caractéristiques et leur score pondéré exact", () => {
        const grid = createGrid();
        grid[18][0] = 1;
        grid[19][0] = 1;
        grid[17][1] = 1;
        grid[19][1] = 1;

        const features = evaluateExpertFeatures(grid, 2);

        expect(features).toMatchObject({
            aggregateHeight: 5,
            linesCleared: 2,
            holes: 1,
            irregularity: 4,
        });

        expect(features.score).toBeCloseTo(-2.11);
    });

    it("choisit un placement légal", () => {
        const grid = createGrid();
        const placement = chooseExpertPlacement(grid, PIECES.T);

        expect(placement).not.toBeNull();
        expect(canPlacePiece(grid, placement.matrix, placement.x, placement.y)).toBe(true);
    });

    it("préfère un placement qui supprime une ligne", () => {
        const grid = createGrid();
        grid[GRID_HEIGHT - 1] = Array(GRID_WIDTH).fill(1);
        grid[GRID_HEIGHT - 1][4] = 0;

        const placement = chooseExpertPlacement(grid, [[1]]);

        expect(placement.x).toBe(4);
    });

    it("anticipe le placement de la prochaine pièce lorsqu'elle est connue", () => {
        const grid = createGrid();
        const bottomRows = [
            [0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
            [1, 0, 1, 0, 0, 0, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        ];
        bottomRows.forEach((row, index) => {
            grid[GRID_HEIGHT - bottomRows.length + index] = row;
        });

        const immediate = chooseExpertPlacement(grid, PIECES.J);
        const anticipated = chooseExpertPlacement(grid, PIECES.J, PIECES.O);

        expect(immediate).toMatchObject({ rotation: 3, x: 3 });
        expect(anticipated).toMatchObject({ rotation: 1, x: 5 });
    });

    it("ne suppose pas de prochaine pièce lorsqu'elle est inconnue", () => {
        const grid = createGrid();
        const withoutNextPiece = chooseExpertPlacement(grid, PIECES.L);
        const explicitlyUnknown = chooseExpertPlacement(grid, PIECES.L, null);

        expect(explicitlyUnknown).toEqual(withoutNextPiece);
    });

    it("résout les égalités de façon déterministe et reproduit sa décision", () => {
        const first = chooseExpertPlacement(createGrid(), [[1]]);
        const repeated = chooseExpertPlacement(createGrid(), [[1]]);

        expect(first).toEqual(repeated);
        expect(first.x).toBe(0);
    });

    it("ne modifie ni les grilles ni les pièces d'origine", () => {
        const game = createGame({ seed: 975 });
        const gridBefore = game.grid.map(row => [...row]);
        const currentPieceBefore = game.currentPiece.matrix.map(row => [...row]);
        const nextPieceBefore = PIECES.O.map(row => [...row]);

        const placement = chooseExpertPlacement(
            game.grid,
            game.currentPiece.matrix,
            nextPieceBefore,
        );

        expect(placement).not.toBeNull();
        expect(game.grid).toEqual(gridBefore);
        expect(game.currentPiece.matrix).toEqual(currentPieceBefore);
        expect(nextPieceBefore).toEqual(PIECES.O);
    });

    it("retourne null lorsqu'aucun placement légal n'existe", () => {
        const blockedGrid = Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(1));

        expect(chooseExpertPlacement(blockedGrid, PIECES.T)).toBeNull();
    });
});

describe("AIPlayer", () => {
    it.each([
        ["beginner", 300],
        ["intermediate", 200],
        ["expert", 100],
    ])("associe le niveau %s au délai de %i ms", (difficulty, intervalMs) => {
        const player = new AIPlayer({ difficulty, random: createSeededRandom(32) });

        expect(player.moveIntervalMs).toBe(intervalMs);
        expect(AI_MOVE_INTERVALS_MS[difficulty]).toBe(intervalMs);
    });

    it.each(["beginner", "intermediate", "expert"])(
        "produit une décision légale et jouable pour le niveau %s",
        difficulty => {
            const instance = new GameInstance({ seed: 56 });
            const player = new AIPlayer({
                difficulty,
                random: createSeededRandom(78),
            });
            const gridBefore = instance.grid.map(row => [...row]);
            const pieceBefore = instance.currentPiece.matrix.map(row => [...row]);
            const decision = player.decide(
                instance.grid,
                instance.currentPiece.matrix,
                PIECES[instance.nextPieceType],
            );

            expect(decision).toEqual({
                rotation: expect.any(Number),
                colonne: expect.any(Number),
            });
            expect(instance.grid).toEqual(gridBefore);
            expect(instance.currentPiece.matrix).toEqual(pieceBefore);

            const placement = findLegalPlacements(
                instance.grid,
                instance.currentPiece.matrix,
            ).find(candidate =>
                candidate.rotation === decision.rotation
                && candidate.x === decision.colonne
            );
            expect(placement).toBeDefined();
            expect(instance.playPlacement(placement)).toBe(instance);
        },
    );

    it("refuse un niveau inconnu et un générateur aléatoire invalide", () => {
        expect(() => new AIPlayer({ difficulty: "impossible" })).toThrow(RangeError);
        expect(() => new AIPlayer({ difficulty: "beginner", random: 1 })).toThrow(TypeError);
    });
});
