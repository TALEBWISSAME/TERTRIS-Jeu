# Tetris — Arcade néon

## Présentation

Ce projet est une version de Tetris jouable dans un navigateur. Le plateau mesure
10 colonnes sur 20 lignes et utilise les sept pièces classiques. Les lignes
complètes disparaissent et le score évolue selon le nombre de lignes supprimées.

## Fonctionnalités

- Mode solo.
- Mode multijoueur local avec un joueur humain et de 1 à 3 adversaires.
- Trois niveaux d'adversaires contrôlés par une IA : Débutant, Intermédiaire et Expert.
- Affichage du score, du niveau, des lignes, de la prochaine pièce et de l'état de chaque partie.
- Parties et décisions de l'IA Débutante reproductibles à partir d'une graine.
- Interface responsive au style arcade néon.

## Adversaires IA et simulations

Les trois niveaux choisissent parmi les placements légaux :

- **Débutant** choisit un placement au hasard; le choix est reproductible avec
  la même graine.
- **Intermédiaire** privilégie les lignes complétées et pénalise les trous et
  les colonnes trop hautes.
- **Expert** pondère la hauteur cumulée, les lignes supprimées, les trous et
  l'irrégularité des colonnes. Il peut aussi anticiper la prochaine pièce.

Les adversaires déplacent leur pièce progressivement. Leur délai est de 300 ms
pour le niveau Débutant, 200 ms pour Intermédiaire et 100 ms pour Expert.

Pour lancer les simulations sans interface graphique :

```sh
node scripts/simulate.js
```

Le script exécute 20 parties par niveau avec les mêmes graines (202 à 221) et
affiche la moyenne des lignes supprimées. Chaque partie est limitée à 1 000
pièces. Lors de la dernière exécution, les 20 parties expertes ont atteint
cette limite; leur moyenne est donc tronquée et doit être interprétée avec
prudence.

## Mode multijoueur et podium

Le mode multijoueur oppose le joueur humain à un, deux ou trois adversaires IA.
Le dernier joueur encore en jeu gagne. À la fin, l'interface affiche le gagnant
et le classement des trois premières places. Les joueurs éliminés sont classés
dans l'ordre inverse de leur élimination. Si tous sont éliminés, la partie se
termine sans gagnant. Le mode solo reste disponible sans podium.

## Technologies

- JavaScript ES2022 avec modules ES.
- HTML5 et Canvas pour l'affichage du jeu.
- CSS pour la mise en page et les animations.
- Vitest et `@vitest/coverage-v8` pour les tests et la couverture.

Le projet n'utilise pas de framework ni de bibliothèque graphique.

## Prérequis

- Node.js et npm pour installer les dépendances et lancer les tests.
- Python 3 pour démarrer un serveur HTTP local et jouer dans le navigateur.

## Installation

Depuis le dossier du projet, installer les dépendances :

```sh
npm install
```

## Lancer le jeu en local

Le projet ne définit pas de commande npm pour servir la page. Depuis la racine
du projet, démarrer le serveur statique Python :

```powershell
py -m http.server 8000
```

Puis ouvrir <http://localhost:8000> dans un navigateur. Pour arrêter le serveur,
utiliser `Ctrl+C` dans le terminal où il tourne.

Sur un système où la commande `py` n'est pas disponible, utiliser :

```sh
python -m http.server 8000
```

## Tests

Exécuter l'ensemble des tests :

```sh
npm test
```

Exécuter les tests avec le rapport de couverture :

```sh
npm run coverage
```

## Organisation des dossiers

- `src/core/` : logique du jeu sans accès au DOM ni au Canvas; contient le
  moteur, la grille, les pièces, le score, les parties, le gestionnaire et les IA.
- `src/ui/` : rendu Canvas, commandes clavier et synchronisation des couleurs.
- `tests/` : tests Vitest du moteur, de l'interface et des IA.
- `docs/` : spécification et documents du projet.
- `index.html` : page du jeu.
- `styles.css` : présentation visuelle.
- `main.js` : relie le moteur, l'interface, les commandes et les parties.

## Commandes clavier

- **Flèche gauche** : déplacer la pièce à gauche.
- **Flèche droite** : déplacer la pièce à droite.
- **Flèche haut** : tourner la pièce.
- **Flèche bas** : accélérer sa descente.
- **P** : mettre en pause ou reprendre.

Les boutons **Démarrer**, **Pause** et **Recommencer** sont également disponibles
dans l'interface.
