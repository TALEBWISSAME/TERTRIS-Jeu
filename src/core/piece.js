
/**
 * Matrices de départ des sept tétrominos classiques (I, O, T, S, Z, J et L).
 * Les cases valent 1 lorsqu'elles sont occupées et 0 lorsqu'elles sont vides.
 * @type {Record<string, number[][]>}
 */
export const PIECES = {
    I: [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    O: [
        [1, 1],
        [1, 1],
    ],
    T: [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
    ],
    S: [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0],
    ],
    Z: [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0],
    ],
    J: [
        [1, 0, 0],
        [1, 1, 1],

        [0, 0, 0],
    ],
    L: [
        [0, 0, 1],
        [1, 1, 1],  
        [0, 0, 0],
    ],
};


/**
 * Fait tourner une matrice carrée d'un quart de tour horaire.
 * @param {number[][]} matrix Matrice carrée à tourner.
 * @returns {number[][]} Nouvelle matrice tournée; la matrice reçue n'est pas modifiée.
 * @throws {Error} Si la matrice n'est pas carrée.
 */
export function rotate(matrix) {
    const N = matrix.length;
    if (!matrix.every(row => Array.isArray(row) && row.length === N)) {
        throw new Error("La matrice doit être carrée.");
    }
    const result = Array.from({ length: N }, () => Array(N).fill(0));

    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            result[j][N - 1 - i] = matrix[i][j];
        }
    }
    return result;
}






