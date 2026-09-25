# Simulation RDP — Carrefour

Simulation interactive d'un réseau de Petri modélisant un feu tricolore.

## Structure

```
petri-net-simulator/
├── package.json               # dépendances et scripts
├── vite.config.js             # config du bundler (Vite)
├── index.html                 # page HTML racine
└── src/
    ├── main.jsx                # point d'entrée React (monte <App />)
    ├── App.jsx                 # composant racine de l'application
    └── components/
        └── PetriNetSimulator.jsx  # le composant de simulation (logique + rendu + styles)
```

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir l'URL affichée (en général http://localhost:5173).

## Build de production

```bash
npm run build
npm run preview
```

## Notes

- Le modèle du réseau de Petri (places, transitions, marquage initial) est défini
  en haut de `PetriNetSimulator.jsx` : facile à adapter pour un autre carrefour
  ou un autre nombre de feux.
- Le thème clair/sombre est mémorisé dans `localStorage` sous la clé `petri-theme`.
- Les styles sont scopés via la classe `.petri-app`, donc le composant peut être
  intégré dans une app existante sans entrer en conflit avec d'autres styles.
