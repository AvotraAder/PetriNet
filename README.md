# 🚦 Simulation de Réseau de Petri - Feu Tricolore

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-success?style=for-the-badge)

Une application web interactive et moderne qui simule l'architecture de contrôle d'un feu tricolore (section unique) à l'aide d'un **Réseau de Petri (RdP)**. Basée sur un modèle mathématique strict : $R = (P, T, Pre, Post)$.


---

## ✨ Fonctionnalités

* 🎨 **Design Moderne & Responsive** : Interface épurée s'adaptant parfaitement aux écrans d'ordinateurs et de mobiles.
* 🌓 **Mode Sombre / Clair** : Bascule fluide entre le Dark Mode et le Light Mode, avec sauvegarde des préférences de l'utilisateur.
* ⚙️ **Graphe SVG Interactif** : Génération vectorielle du graphe. Les transitions franchissables s'illuminent en vert, et les conflits structurels en violet. Le franchissement manuel se fait par un simple clic.
* ▶️ **Lecture Automatique** : Mode de simulation autonome avec un slider pour ajuster la vitesse de franchissement en temps réel.
* 🚥 **Rendu Physique** : Visualisation "néon" synchronisée de l'état réel du feu (Rouge, Orange, Vert).
* 📊 **Suivi Mathématique** : Affichage dynamique du marquage courant $M$, des matrices d'incidence (Pré $W-$ et Post $W+$), et de l'historique des franchissements.

---

## 🛠️ Technologies Utilisées

Ce projet a été développé en **Vanilla Code** (sans aucun framework externe ni bibliothèque), garantissant des performances optimales et une compatibilité maximale :
* **HTML5** (Structure sémantique et intégration SVG)
* **CSS3** (Variables CSS, Grid/Flexbox, Transitions, Glassmorphism)
* **JavaScript ES6** (Logique métier du RdP, manipulation du DOM, boucle de rendu)

---

## 🧠 Comprendre le Modèle (Réseau de Petri)

Le système modélise le cycle classique d'un feu de signalisation.

### 📍 Places (États)

* **Ra** / **Re** : Rouge Allumé / Rouge Éteint
* **Oa** / **Oe** : Orange Allumé / Orange Éteint
* **Va** / **Ve** : Vert Allumé / Vert Éteint

### 🔄 Cycle de fonctionnement

Le feu démarre à l'état initial : **Rouge allumé** (`Ra=1`, `Oe=1`, `Ve=1`).
La séquence théorique de fonctionnement est la suivante :
👉 `Ra` (Rouge) ➔ `Oa` (Orange) ➔ `Va` (Vert) ➔ `Oa` (Orange) ➔ `Ra` (Rouge)...

### ⚡ Conflit Structurel

La place **Oa (Orange allumé)** est traversée deux fois dans le cycle (avant et après le vert). Ainsi, les transitions `Oa ➔ Va` et `Oa ➔ Ra` se disputent le même jeton. L'interface met en évidence ce conflit (en violet) lorsque les deux voies sont mathématiquement possibles.


## 📄 Licence

Distribué sous la licence MIT. Voir le fichier `LICENSE` pour plus d'informations.
