# 🚦 Petri Net Simulation - Traffic Light

An interactive, modern web application that simulates the control architecture of a single-section traffic light using a **Petri Net (PN)**. Based on a strict mathematical model: $R = (P, T, Pre, Post)$.

---

## ✨ Features

* 🎨 **Modern & Responsive Design**: Clean interface perfectly adapted for desktop and mobile screens.
* 🌓 **Dark / Light Mode**: Smooth toggling between Dark and Light Mode, with user preference saving.
* ⚙️ **Interactive SVG Graph**: Vector graph generation. Enabled transitions light up in green, and structural conflicts in purple. Manual firing is done with a single click.
* ▶️ **Auto-Play**: Autonomous simulation mode with a slider to adjust the firing speed in real-time.
* 🚥 **Physical Rendering**: Synchronized "neon" visualization of the actual traffic light state (Red, Yellow, Green).
* 📊 **Mathematical Tracking**: Dynamic display of the current marking $M$, incidence matrices (Pre $W-$ and Post $W+$), and firing history.

---

## 🛠️ Technologies Used

This project was built entirely with **Vanilla Code** (no external frameworks or libraries), ensuring optimal performance and maximum compatibility:

* **HTML5** (Semantic structure and SVG integration)
* **CSS3** (CSS Variables, Grid/Flexbox, Transitions, Glassmorphism)
* **JavaScript ES6** (Petri Net business logic, DOM manipulation, rendering loop)

---

## 🧠 Understanding the Model (Petri Net)

The system models a standard traffic light cycle.

### 📍 Places (States)

* **Ra** / **Re**: Red On / Red Off
* **Oa** / **Oe**: Yellow On / Yellow Off
* **Va** / **Ve**: Green On / Green Off

### 🔄 Operating Cycle

The traffic light starts at the initial state: **Red on** (`Ra=1`, `Oe=1`, `Ve=1`).
The theoretical operating sequence is as follows:
👉 `Ra` (Red) ➔ `Oa` (Yellow) ➔ `Va` (Green) ➔ `Oa` (Yellow) ➔ `Ra` (Red)...

### ⚡ Structural Conflict

The **Oa (Yellow on)** place is traversed twice in the cycle (before and after green). Therefore, the `Oa ➔ Va` and `Oa ➔ Ra` transitions compete for the same token. The interface highlights this conflict (in purple) when both paths are mathematically possible.

---

## 📄 License

Distributed under the MIT License. See the `LICENSE` file for more information.