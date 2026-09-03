# Générateurs d'assets

Les fond topographiques et le tracé de la randonnée ne sont pas dessinés à la main :
ils sont produits par ces scripts. Chacun utilise une graine aléatoire fixe, donc
relancer un script reproduit exactement le même résultat — c'est vérifié.

Dépendances : `numpy`, `scipy`, `matplotlib`, déjà présentes sur cette machine.

| Script | Produit | Reproductible |
|---|---|---|
| `gen_map.py` | `assets/trail-map.svg` | ✅ identique à l'octet près |
| `gen_route.py` | l'attribut `d` des deux tracés, réécrit dans `index.html` | ✅ identique à l'octet près |
| `gen_topo.py` | `assets/hero-topo-raw.svg` | ⚠️ voir ci-dessous |

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

## Limite connue

`gen_topo.py` sort un SVG matplotlib brut de 204 Ko, alors que l'asset livré
(`assets/hero-topo.svg`) fait 132 Ko. Une passe de nettoyage a eu lieu entre les deux et
n'a pas été conservée. Le script reste utile pour régénérer un champ de courbes différent,
mais son résultat n'est pas directement l'asset final.
