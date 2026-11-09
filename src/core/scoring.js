const LINE_SCORES = [0, 100, 300, 500, 800];

function validateLineCount(lines) {
    if (!Number.isInteger(lines) || lines < 0) {
        throw new RangeError("Le nombre de lignes doit être un entier positif ou nul.");
    }
}

/**
 * Retourne les points gagnés pour le nombre de lignes supprimées simultanément.
 * @param {number} linesCleared Nombre entier de lignes supprimées, entre 0 et 4.
 * @returns {number} Points attribués selon le nombre de lignes.
 * @throws {RangeError} Si le nombre de lignes n'est pas compris entre 0 et 4.
 */
export function getLineScore(linesCleared) {
    validateLineCount(linesCleared);
    if (linesCleared >= LINE_SCORES.length) {
        throw new RangeError("Le nombre de lignes supprimées simultanément doit être compris entre 0 et 4.");
    }
    return LINE_SCORES[linesCleared];
}

/**
 * Retourne le niveau correspondant au nombre total de lignes supprimées.
 * Le niveau 1 couvre 0 à 9 lignes, le niveau 2 couvre 10 à 19, etc.
 * @param {number} totalLinesCleared Nombre total de lignes supprimées.
 * @returns {number} Niveau entier, à partir de 1.
 * @throws {RangeError} Si le total n'est pas un entier positif ou nul.
 */
export function getLevel(totalLinesCleared) {
    validateLineCount(totalLinesCleared);
    return Math.floor(totalLinesCleared / 10) + 1;
}
