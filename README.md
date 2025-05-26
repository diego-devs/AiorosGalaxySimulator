# Procedural Galaxy Simulator 🌠

Hola! this is a dynamic, interactive galaxy simulator built with pure HTML, CSS, and JavaScript. Explore procedurally generated star systems, planets, and the potential for life, all rendered directly in your browser without external libraries or image files.

## ✨ Features

* **Procedural Galaxy Generation:** Create new galaxies with a configurable number of stars.
* **Realistic Star Types:** Stars are generated with various types (Red Dwarf, Yellow Dwarf, Blue Giant, White Dwarf, Neutron Star, Black Hole) and proportional sizes/colors.
* **Dynamic Planetary Systems:** Each star can host up to 10 celestial objects, including planets and asteroid belts, all randomly generated.
* **Diverse Planet Types:** Discover Rocky, Gas Giant, Water World, and Ice Planet types, each with varied sizes.
* **Habitable Zones:** Stars have calculated habitable zones based on their type and size. Planets within this zone have a chance to harbor life.
* **Procedural Life Generation:**
    * Life can emerge on suitable planets within habitable zones.
    * Organisms are classified by complexity levels (Level 1: Basic Microorganisms to Level 5: Intelligent Civilizations).
    * Civilizations are rare and more likely in systems around Yellow Dwarf stars.
* **Interactive Canvas:**
    * Click on a star in the galaxy view to open a detailed information panel.
* **Detailed Information Modal:**
    * View comprehensive information about selected stars, planets, or life forms.
    * **Clickable Entities:** Navigate seamlessly by clicking on planet names or life form descriptions within the modal to view their specific details.
* **Galaxy Statistics:**
    * View relevant statistics for the generated galaxy:
        * Number of planets in habitable zones.
        * Number of planets with life.
        * Number of detected civilizations.
    * **Pie Charts:** Visual distribution of star types and planet types across the galaxy.
* **Procedural Visuals:** All stars, planets, and organism representations are drawn using CSS and JavaScript (on Canvas or as styled HTML elements in the modal), requiring no external image files.
* **Configurable Generation:** Control the number of stars and the base probability of life before generating a new galaxy.
* **Celestial Body List:** An overview list of all discovered stars and their planets, allowing for quick navigation and expansion.

## 🚀 Live Demo (Placeholder)

[Live Demo here , `[https://your-username.github.io/procedural-galaxy-simulator/](https://mediumorchid-turkey-187846.hostingersite.com/)`](#)

## 🛠️ Technologies Used

    * Galaxy and celestial body generation.
    * Physics calculations (simplified for habitable zones).
    * DOM manipulation and event handling.
    * Procedural drawing on HTML Canvas for the galaxy view.
    * Procedural generation of HTML/CSS visuals for the detail modal.
    * Statistics calculation and pie chart rendering.

## ⚙️ How to Run Locally

1.  **Clone the repository (or download the files):**
    ```bash
    git clone [https://github.com/your-username/procedural-galaxy-simulator.git](https://github.com/your-username/procedural-galaxy-simulator.git)
    cd procedural-galaxy-simulator
    ```
    (Replace `your-username/procedural-galaxy-simulator` with your actual repository URL)
    Alternatively, download the ZIP file and extract it.

2.  **Open `index.html`:**
    Navigate to the project directory and open the `index.html` file in your preferred web browser (e.g., Chrome, Firefox, Edge, Safari).

That's it! You can now generate and explore galaxies.

## 📁 File Structure
