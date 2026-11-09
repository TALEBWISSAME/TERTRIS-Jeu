# Spécification des joueurs IA

## Règles communes

Les joueurs IA proposent uniquement des placements légaux. Ils analysent une
copie logique de la grille : leurs calculs ne modifient ni la grille de la partie
ni la pièce active. Le `GameManager` associe un joueur IA à une partie
indépendante.

Une décision est calculée avec `decide(grid, piece, next)` et renvoyée sous la
forme `{ rotation, colonne }`. `rotation` est le nombre de quarts de tour
horaires depuis l'orientation reçue. `colonne` est la coordonnée horizontale de
l'origine de la matrice; elle peut être négative si la matrice comporte des
colonnes vides à gauche. La décision vaut `null` si aucun placement légal
n'existe. La prochaine pièce `next` est facultative.

Après avoir choisi sa destination, l'IA ne pose pas directement sa pièce dans la
grille. Elle la positionne à l'orientation et à la colonne choisies, puis le
moteur la fait descendre d'une case et applique les collisions, le verrouillage,
le score et la suppression des lignes comme pour le joueur humain.

Le délai entre deux déplacements d'une case dépend du niveau :

| Niveau | Délai |
|---|---:|
| Débutant | 300 ms |
| Intermédiaire | 200 ms |
| Expert | 100 ms |

Le niveau est affiché sur la carte de l'adversaire.

## Niveaux

### Débutant

Choisit au hasard une rotation et une colonne parmi les placements légaux.
L'aléatoire peut recevoir une graine afin de reproduire les décisions.

### Intermédiaire

Évalue les placements légaux. Il favorise les lignes complétées et pénalise les
trous ainsi que la hauteur du plateau.

### Expert

Évalue les placements selon la formule :

```text
-0.51 * hauteur agrégée
+ 0.76 * lignes supprimées
- 0.36 * trous
- 0.18 * irrégularité des colonnes
```

Quand la prochaine pièce `next` est connue, l'IA évalue aussi les placements
possibles de cette pièce pour anticiper le coup suivant.
