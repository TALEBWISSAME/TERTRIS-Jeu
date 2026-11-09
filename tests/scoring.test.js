import { describe, expect, it } from "vitest";
import { getLevel, getLineScore } from "../src/core/scoring.js";

describe("calcul du score", () => {
    it.each([
        [1, 100],
        [2, 300],
        [3, 500],
        [4, 800],
    ])("attribue %i points de lignes selon la spécification", (lines, score) => {
        expect(getLineScore(lines)).toBe(score);
    });

    it("attribue zéro point lorsqu'aucune ligne n'est supprimée", () => {
        expect(getLineScore(0)).toBe(0);
    });

    it.each([-1, 1.5, 5, NaN, Infinity, "2", null])(
        "rejette un nombre de lignes invalide : %s",
        lines => {
            expect(() => getLineScore(lines)).toThrow(RangeError);
        },
    );
});

describe("calcul du niveau", () => {
    it.each([
        [0, 1],
        [9, 1],
        [10, 2],
        [19, 2],
        [20, 3],
    ])("retourne le niveau attendu après %i lignes supprimées", (lines, level) => {
        expect(getLevel(lines)).toBe(level);
    });

    it.each([-1, 1.5, NaN, Infinity, "10", null])(
        "rejette un total de lignes invalide : %s",
        lines => {
            expect(() => getLevel(lines)).toThrow(RangeError);
        },
    );
});
