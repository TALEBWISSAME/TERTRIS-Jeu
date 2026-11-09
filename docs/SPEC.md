
# Spécification fonctionnelle — Tetris

## 1. Objectif
Développer un jeu Tetris jouable dans un navigateur, avec JavaScript ES2022, HTML5 Canvas et CSS, sans framework.

## 2. Règles du jeu
- Grille de 10 colonnes et 20 lignes.
- Sept tétrominos classiques : I, O, T, S, Z, J et L.
- Chaque pièce possède sa propre couleur.
- Les pièces descendent automatiquement.
- Les déplacements et rotations doivent respecter les collisions.
- Une ligne complète disparaît avec une animation.
- La partie se termine lorsqu'une nouvelle pièce ne peut plus apparaître.

## 3. Commandes
- Flèche gauche : déplacer à gauche.
- Flèche droite : déplacer à droite.
- Flèche haut : effectuer une rotation.
- Flèche bas : accélérer la descente.
- P : mettre en pause ou reprendre.

## 4. Score et niveaux
- 1 ligne : 100 points.
- 2 lignes : 300 points.
- 3 lignes : 500 points.
- 4 lignes : 800 points.
- Le niveau augmente toutes les 10 lignes supprimées.
- La vitesse de descente augmente avec le niveau.

## 5. Interface
- Affichage de la grille de jeu.
- Affichage du score, du niveau et du nombre de lignes.
- Aperçu de la prochaine pièce.
- Boutons Démarrer, Pause et Recommencer.
- Message de fin de partie.
- Interface adaptée à différentes tailles d'écran.

## 6. Architecture
- src/core/ : logique du jeu indépendante du DOM et du Canvas.
- src/ui/ : affichage et gestion du clavier.
- main.js : initialisation du jeu.
- tests/ : tests automatisés avec Vitest.

## 7. Tests et reproductibilité
- Tester les déplacements, les rotations, les collisions et le score.
- Utiliser un générateur aléatoire injectable avec une graine pour reproduire les parties.

## 8. Identité visuelle
Le jeu utilisera un style arcade moderne :
- Fond sombre et couleurs lumineuses.
- Effets visuels lors de la suppression des lignes.
- Interface claire et lisible.
- Animations fluides sans gêner le jeu.
