# Générateurs d'assets

Les fond topographiques et le tracé de la randonnée ne sont pas dessinés à la main :
ils sont produits par ces scripts. Chacun utilise une graine aléatoire fixe, donc
relancer un script reproduit exactement le même résultat — c'est vérifié.

Dépendances : `numpy`, `scipy`, `matplotlib` pour les générateurs, `Pillow` pour les
`build_*` — toutes déjà présentes sur cette machine.

| Script | Produit | Reproductible |
|---|---|---|
| `gen_map.py` | `assets/home/src/trail-map.svg` | ✅ identique à l'octet près |
| `gen_route.py` | l'attribut `d` des deux tracés, réécrit dans `index.html` | ✅ identique à l'octet près |
| `gen_topo.py` | `assets/home/src/hero-topo-raw.svg` | ⚠️ voir ci-dessous |
| `gen_favicon.py` | `favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, à la racine | ✅ déterministe |
| `build_projects.py` | les 17 `.webp` de `assets/home/projects/` | ✅ déterministe |
| `build_jm.py` | les 25 `.webp` de `assets/jm/` | ✅ déterministe |
| `build_jimizz.py` | les 17 `.webp` de `assets/jimizz/` | ✅ déterministe |
| `bump_version.py` | le numéro `v0.N` du bandeau et les `?v=` du CSS et du JS, dans les quatre pages — à lancer avant chaque commit | ✅ idempotent |
| `build_social.py`, `build_shots.py` | plus rien : la refonte de `projet-jm.html` a emporté la facette qui les affichait | — |

```bash
python3 tools/gen_map.py
```

## Contraintes à préserver

**`gen_map.py`** — la tuile de 2400px doit rester *périodique* : chaque octave de bruit est
lissée avec `mode="wrap"`, et la première ligne/colonne est dupliquée à la fin pour que les
valeurs soient identiques de part et d'autre de la couture, pas seulement voisines. C'est ce
qui permet de la répéter en `background-repeat` sur 7200px pour 202 Ko au lieu d'une image
unique énorme. Les traits doivent rester dans le bleu marine du site.

**`gen_route.py`** — spine Catmull-Rom passant par des lacets placés à la main, puis déplacée
le long de la *normale* par un bruit fractal multi-octaves, atténué à zéro aux deux
extrémités. C'est ce qui lui donne l'allure d'une trace GPS réelle plutôt que d'une courbe
dessinée. Le tracé ne doit pas se recouper et ne comporte pas de boucle. Le script réécrit
les deux `<path>` de `index.html` (`trail__track` et `trail__track-done`), qui doivent
toujours porter le même `d`.

**`build_projects.py`** — le seul script du dossier qui ne DESSINE rien : il ne fait que
préparer des visuels fournis. Sa particularité est de **ne porter aucune taille en dur**.
La taille d'export de chaque pièce est calculée à partir du `width: %` lu dans
`css/style.css`, et l'appariement classe → fichier vient des `src` d'`index.html`. Une
pièce agrandie dans le CSS est donc réexportée plus grande à la relance suivante, sans
qu'on ait à y penser.

La cible vaut **deux fois la taille d'affichage** (densité d'écran 2). Tant que les
sources restent les exports de maquette en 1x, le script les agrandit — Lanczos puis
masque flou : ça nettoie les bords, ça n'invente pas de détail.

Il le **dit** en fin de passe : la liste des pièces agrandies, leur facteur, et l'échelle
d'export Figma qui ferait cesser l'agrandissement — et de même celles dont la source
manque, qu'il laisse en place plutôt que d'effacer. C'est la seule façon de distinguer une
sortie honnête d'une sortie à la bonne taille dont la moitié des pixels est inventée : le
fichier produit, lui, a l'air identique dans les deux cas.

Les sources sont aujourd'hui des exports **@3x**, donc tout est réduit et rien n'est
agrandi. Seules les trois icônes de carte n'ont plus de PNG d'origine : leur `.webp` est
conservé tel quel, et le script le signale.

**Où déposer.** Dans `assets/home/src/projects/`, hors dépôt. Le script ramasse aussi ce
qui traîne dans `assets/home/projects/png/` et l'y range de lui-même — c'est le dossier
naturel quand on dépose à côté des fichiers servis, et le seul d'où une source de 1,2 Mo
partirait dans le dépôt public.

**`build_jm.py` et `build_jimizz.py`** — même mécanique que `build_projects.py`, page par
page, et la même règle : **aucune taille en dur**. Une pièce posée en pourcentage tient sa
taille du `width: %` lu dans `css/style.css` ; seules les cases de grille, qui ne portent
aucun pourcentage, ont leur nombre dans le manifeste du script. Aucun des deux n'agrandit
jamais — une source trop petite sort à sa taille native et sa ligne apparaît dans le
rapport de fin de passe, avec l'échelle d'export Figma qui corrigerait.

Deux différences avec `build_projects.py`, toutes deux documentées dans l'en-tête des
scripts :

- `build_jm.py` porte le **traitement de la couverture** : la photo est ramenée à une teinte
  plate à opacité variable sans emporter le tampon « Jacquie & Michel », retrouvé par ce qui
  le distingue de la photo — c'est le seul endroit saturé ou quasi blanc. Aucune coordonnée
  à tenir à jour ;
- `build_jimizz.py` compresse l'**alpha avec perte** (`ALPHA_QUALITY = 70`) : les trois
  écrans du dashboard portent une ombre douce qui pèse plus lourd que la capture, et
  l'écart mesuré au-dessus de l'encre de la page est de 0,2 niveau sur 255. Il garde les
  alpha, en revanche, et il le faut : ils portent l'arrondi des captures, l'ombre des
  écrans et le dégradé des mises en scène.

**Où déposer, pour les deux :** `assets/jm/src/` et `assets/jimizz/src/`, hors dépôt.

**`gen_favicon.py`** — le seul script qui écrit à la **racine** du dépôt, et pas dans
`assets/` : ses trois fichiers n'appartiennent à aucune page, et deux d'entre eux sont
sondés par des agents à un chemin fixe (`/favicon.ico`, `/apple-touch-icon.png`) sans que
le `<head>` soit jamais lu.

La marque est le **W de Clash Display à la graisse 700**, celle du logo du header, en crème
sur un carré d'encre. Son contour n'est écrit nulle part : il est extrait de
`fonts/ClashDisplay-Variable.ttf`, donc changer de police ou de graisse se fait dans le
script et l'icône suit. Un `<text>` dans le SVG ne marcherait pas — une icône de favori est
rendue hors de toute page, sans feuille de style ni `@font-face` à charger.

Trois choses à ne pas défaire :

- **le SVG et les PNG sont dessinés deux fois, avec les mêmes nombres.** Aucun rastériseur
  SVG n'est installé sur cette machine, et en ajouter un pour trois fichiers serait cher
  payé : le PNG redessine le glyphe avec Pillow en reprenant `FILL` et `OPTICAL`, donc les
  deux sorties se superposent. Si tu touches à la géométrie, touche aux deux constantes et
  pas à l'une des deux branches ;
- **chaque taille de l'ICO est rendue pour elle-même**, jamais réduite depuis la plus
  grande : à 16 px, un W de 48 px réduit perd ses fûts. Le supersampling 8x puis la
  réduction Lanczos font tout l'anticrénelage, et c'est lui qui rend la lettre lisible ;
- **l'`apple-touch-icon` est OPAQUE et sans arrondi.** iOS applique son propre masque : un
  PNG déjà arrondi laisserait un liseré, et un alpha laisserait des bords clairs.

Changer de lettre tient en une constante — `MARK = "V"` donne le V de « Vincent », qui
remplit mieux le carré parce qu'il est moins large.

## Limite connue

`gen_topo.py` sort un SVG matplotlib brut de 204 Ko, alors que l'asset livré
(`assets/home/hero/topo.svg`) fait 132 Ko. Une passe de nettoyage a eu lieu entre les deux et
n'a pas été conservée. Le script reste utile pour régénérer un champ de courbes différent,
mais son résultat n'est pas directement l'asset final.
