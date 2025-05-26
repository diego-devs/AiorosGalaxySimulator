document.addEventListener('DOMContentLoaded', () => {
    // --- INITIAL CONFIGURATION AND DOM REFERENCES ---
    const galaxyCanvasElement = document.getElementById('galaxyCanvas');
    const ctx = galaxyCanvasElement.getContext('2d');
    const numStarsSlider = document.getElementById('numStarsSlider');
    const numStarsValueSpan = document.getElementById('numStarsValue');
    const lifeChanceSlider = document.getElementById('lifeChanceSlider');
    const lifeChanceValueSpan = document.getElementById('lifeChanceValue');
    const generateGalaxyButton = document.getElementById('generateGalaxyButton');
    
    const entityDetailModal = document.getElementById('entityDetailModal');
    const closeModalButton = document.getElementsByClassName('close-modal-button')[0];
    const modalEntityNameHeader = document.getElementById('modalEntityName');
    const modalEntityDetailsDiv = document.getElementById('modalEntityDetails');
    const modalEntityRelatedListSectionDiv = document.getElementById('modalEntityRelatedListSection');
    const modalRelatedListTitleHeader = document.getElementById('modalRelatedListTitle');
    const modalEntityRelatedListUl = document.getElementById('modalEntityRelatedList');
    
    const discoveredPlanetsContainerDiv = document.getElementById('discoveredPlanetsContainer');

    // Statistics Elements
    const statHabitablePlanetsSpan = document.getElementById('statHabitablePlanets');
    const statPlanetsWithLifeSpan = document.getElementById('statPlanetsWithLife');
    const statCivilizationsSpan = document.getElementById('statCivilizations');
    const starTypesChartCanvas = document.getElementById('starTypesChart');
    const planetTypesChartCanvas = document.getElementById('planetTypesChart');
    const starTypesChartLegendDiv = document.getElementById('starTypesChartLegend');
    const planetTypesChartLegendDiv = document.getElementById('planetTypesChartLegend');

    galaxyCanvasElement.width = 800;
    galaxyCanvasElement.height = 600;
    let currentGalaxy = null;

    // Colors for charts (can be taken from classes or defined here)
    const STAR_COLORS_CHART = {
        'Red Dwarf': '#ff7f50',
        'Yellow Dwarf': '#ffd700',
        'Blue Giant': '#add8e6',
        'White Dwarf': '#f0f8ff',
        'Neutron Star': '#c0c0c0',
        'Black Hole': '#333333'
    };

    const PLANET_COLORS_CHART = {
        'Rocky': '#a0522d',
        'Gas Giant': '#deb887',
        'Water World': '#1e90ff',
        'Ice Planet': '#add8e6'
    };

    // --- CLASS DEFINITIONS ---

    class Galaxy {
        constructor(numStars, baseLifeChance) {
            this.stars = [];
            this.numStars = numStars;
            this.baseLifeChance = baseLifeChance / 100; // Convert percentage to decimal
            this.generateStars();
        }

        generateStars() {
            this.stars = [];
            for (let i = 0; i < this.numStars; i++) {
                const x = Math.random() * galaxyCanvasElement.width;
                const y = Math.random() * galaxyCanvasElement.height;
                // Star names are unique and used as identifiers
                this.stars.push(new Star(`Star ${i + 1}`, x, y, this.baseLifeChance));
            }
        }

        draw() {
            ctx.clearRect(0, 0, galaxyCanvasElement.width, galaxyCanvasElement.height); // Clear canvas
            // Subtle galaxy background
            ctx.fillStyle = '#050510';
            ctx.fillRect(0,0, galaxyCanvasElement.width, galaxyCanvasElement.height);
            // Draw some very subtle and random "nebulas" or star dust
            for(let i=0; i<50; i++) {
                ctx.fillStyle = `rgba(${Math.random()*50+50}, ${Math.random()*50+50}, ${Math.random()*50+100}, ${Math.random()*0.05})`;
                ctx.beginPath();
                ctx.arc(Math.random()*galaxyCanvasElement.width, Math.random()*galaxyCanvasElement.height, Math.random()*100+50, 0, Math.PI*2);
                ctx.fill();
            }
            this.stars.forEach(star => star.draw(ctx));
        }

        getStarAtPosition(x, y) {
            for (const star of this.stars) {
                const distance = Math.sqrt((x - star.x)**2 + (y - star.y)**2);
                if (distance < star.visualSize / 2 + 3) { // +3 for a bit more click margin
                    return star;
                }
            }
            return null;
        }

        // Method to calculate global statistics
        calculateStatistics() {
            let habitablePlanets = 0;
            let planetsWithLife = 0;
            let civilizations = 0;
            const starTypes = {};
            const planetTypes = {};

            this.stars.forEach(star => {
                starTypes[star.type] = (starTypes[star.type] || 0) + 1;
                star.celestialObjects.forEach(obj => {
                    if (obj instanceof Planet) {
                        planetTypes[obj.type] = (planetTypes[obj.type] || 0) + 1;
                        if (obj.isInHabitableZone()) {
                            habitablePlanets++;
                        }
                        if (obj.hasLife) {
                            planetsWithLife++;
                            if (obj.organisms.some(org => org.complexityLevel === 5)) {
                                civilizations++;
                            }
                        }
                    }
                });
            });
            return { habitablePlanets, planetsWithLife, civilizations, starTypes, planetTypes };
        }
    }

    class Star {
        constructor(name, x, y, galaxyBaseLifeChance) {
            this.name = name; // Unique name, e.g., "Star 1"
            this.x = x;
            this.y = y;
            this.galaxyBaseLifeChance = galaxyBaseLifeChance;
            // this.typeData is assigned within generateType
            this.type = this.generateType(); 
            this.actualSize = this.generateActualSize(); // e.g., in solar radii
            this.visualSize = this.calculateVisualSize(); // Size in pixels on canvas
            this.color = this.typeData.color; 
            this.habitableZone = this.calculateHabitableZone(); // { min, max, text } in AU
            this.celestialObjects = []; // Planets or AsteroidBelts
            this.generatePlanetarySystem();
        }

        generateType() {
            const types = [
                { name: 'Red Dwarf', probability: 0.75, color: STAR_COLORS_CHART['Red Dwarf'], brightness: 0.7 },
                { name: 'Yellow Dwarf', probability: 0.10, color: STAR_COLORS_CHART['Yellow Dwarf'], brightness: 1.0 },
                { name: 'Blue Giant', probability: 0.01, color: STAR_COLORS_CHART['Blue Giant'], brightness: 1.5 },
                { name: 'White Dwarf', probability: 0.08, color: STAR_COLORS_CHART['White Dwarf'], brightness: 0.5 },
                { name: 'Neutron Star', probability: 0.005, color: STAR_COLORS_CHART['Neutron Star'], brightness: 0.3 },
                { name: 'Black Hole', probability: 0.005, color: STAR_COLORS_CHART['Black Hole'], brightness: 0.1 },
            ];
            const rand = Math.random();
            let cumulativeProbability = 0;
            for (const type of types) {
                cumulativeProbability += type.probability;
                if (rand < cumulativeProbability) {
                    this.typeData = type; // Store type data for color, brightness etc.
                    return type.name;
                }
            }
            this.typeData = types[0]; // Fallback
            return types[0].name;
        }

        generateActualSize() { 
            switch (this.type) {
                case 'Red Dwarf': return Math.random() * 0.4 + 0.1;    // 0.1 - 0.5 R☉
                case 'Yellow Dwarf': return Math.random() * 0.4 + 0.8; // 0.8 - 1.2 R☉
                case 'Blue Giant': return Math.random() * 10 + 10;      // 10 - 20 R☉
                case 'White Dwarf': return Math.random() * 0.01 + 0.008; // Very small
                case 'Neutron Star': return Math.random() * 0.00002 + 0.00001; // Even smaller
                case 'Black Hole': return Math.random() * 0.00001 + 0.000001; // Event Horizon radius
                default: return 1;
            }
        }

        calculateVisualSize() {
            let baseSize = 3;
            if (this.type === 'Blue Giant') baseSize = 10 + Math.random() * 5;
            else if (this.type === 'Yellow Dwarf') baseSize = 5 + Math.random() * 3;
            else if (this.type === 'Red Dwarf') baseSize = 3 + Math.random() * 2;
            else baseSize = 2 + Math.random();
            return baseSize * (this.typeData.brightness || 1); 
        }
        
        calculateHabitableZone() { 
            let minAU = 0, maxAU = 0;
            // Simplified calculation based on type and size. Not astrophysically accurate.
            switch (this.type) {
                case 'Red Dwarf': minAU = 0.1 * this.actualSize; maxAU = 0.4 * this.actualSize; break;
                case 'Yellow Dwarf': minAU = 0.7 * this.actualSize; maxAU = 1.5 * this.actualSize; break;
                case 'Blue Giant': minAU = 10 * this.actualSize; maxAU = 50 * this.actualSize; break;
                default: return { min: 0, max: 0, text: "Non-conventional" };
            }
            return { 
                min: parseFloat(minAU.toFixed(2)), 
                max: parseFloat(maxAU.toFixed(2)), 
                text: `${parseFloat(minAU.toFixed(2))} - ${parseFloat(maxAU.toFixed(2))} AU (approx.)` 
            };
        }

        generatePlanetarySystem() {
            const numObjects = Math.floor(Math.random() * 11); // 0 to 10 objects
            let currentOrbitalDistance = 0.1; // Start close to the star

            for (let i = 0; i < numObjects; i++) {
                currentOrbitalDistance += (Math.random() * 0.5 + 0.2) * (this.actualSize + 1); 
                // Avoid planets too far for small/medium stars
                if (currentOrbitalDistance > this.habitableZone.max * 3 && this.type !== 'Blue Giant') break; 

                // Planet names are unique within a star system: Planet StarName-OrbitIndex
                const objectNameSuffix = `${this.name}-${i+1}`;
                if (Math.random() < 0.2 && i > 0) { // 20% chance of asteroid belt (not the first object)
                    this.celestialObjects.push(new AsteroidBelt(`Belt ${objectNameSuffix}`, parseFloat(currentOrbitalDistance.toFixed(2))));
                } else {
                    this.celestialObjects.push(new Planet(`Planet ${objectNameSuffix}`, parseFloat(currentOrbitalDistance.toFixed(2)), this, this.galaxyBaseLifeChance));
                }
            }
            this.celestialObjects.sort((a, b) => a.orbitalDistance - b.orbitalDistance);
        }

        draw(ctx) { 
            // Glow effect
            const glowRadius = this.visualSize * 1.5 + 2; 
            const gradient = ctx.createRadialGradient(this.x, this.y, this.visualSize / 4, this.x, this.y, glowRadius);
            gradient.addColorStop(0, this.color); 
            gradient.addColorStop(0.3, `${this.color}aa`); // Semi-transparent
            gradient.addColorStop(1, `${this.color}00`);   // Fully transparent

            ctx.beginPath();
            ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.closePath();
            
            // Star core
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.visualSize / 2, 0, Math.PI * 2);
            if (this.type === 'Black Hole') {
                 ctx.fillStyle = '#000'; 
            } else {
                const coreGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.visualSize / 2);
                coreGradient.addColorStop(0, '#fff'); // Bright center
                coreGradient.addColorStop(0.5, this.color);
                coreGradient.addColorStop(1, this.color);
                ctx.fillStyle = coreGradient;
            }
            ctx.fill();
            ctx.closePath();
        }

        getModalVisualRepresentation() {
            return `<div class="star-visual-modal" style="background-color: ${this.color}; box-shadow: 0 0 8px ${this.color}, 0 0 12px ${this.color}a0, 0 0 15px ${this.color}70;"></div>`;
        }
    }

    class Planet {
        constructor(name, orbitalDistance, parentStar, galaxyBaseLifeChance) {
            this.name = name; // Unique name, e.g., "Planet Star 1-1"
            this.parentStar = parentStar;
            this.orbitalDistance = orbitalDistance; // In AU or relative metric
            this.type = this.generateType();
            this.size = this.generateSize(); // Relative (e.g., 0.5 Earth, 10 Jupiter)
            this.hasLife = false;
            this.organisms = [];
            this.galaxyBaseLifeChance = galaxyBaseLifeChance;
            this.determineLife();
        }

        generateType() { 
            const types = ['Rocky', 'Gas Giant', 'Water World', 'Ice Planet'];
            return types[Math.floor(Math.random() * types.length)];
        }

        generateSize() { // Example: in Earth radii (R⊕)
            switch (this.type) {
                case 'Rocky': return Math.random() * 1.5 + 0.3; 
                case 'Gas Giant': return Math.random() * 10 + 5;   
                case 'Water World': return Math.random() * 2 + 0.5;    
                case 'Ice Planet': return Math.random() * 3 + 1;     
                default: return 1;
            }
        }

        isInHabitableZone() { 
            const hz = this.parentStar.habitableZone;
            return this.orbitalDistance >= hz.min && this.orbitalDistance <= hz.max && (this.type === 'Rocky' || this.type === 'Water World');
        }

        determineLife() { 
            if (this.isInHabitableZone()) {
                const lifeChanceMultiplier = (this.type === 'Rocky' || this.type === 'Water World') ? 1.5 : 0.5;
                const finalLifeChance = this.galaxyBaseLifeChance * lifeChanceMultiplier;
                if (Math.random() < finalLifeChance) {
                    this.hasLife = true;
                    this.generateOrganisms();
                }
            }
        }

        generateOrganisms() { 
            this.organisms = [];
            const numOrganismTypes = Math.floor(Math.random() * 3) + 1; // 1 to 3 types
            for (let i = 0; i < numOrganismTypes; i++) {
                let level;
                const randLevel = Math.random();
                // Civilizations are very rare, more likely in solar-type systems
                if (randLevel < 0.02 && this.parentStar.type === 'Yellow Dwarf') level = 5; 
                else if (randLevel < 0.15) level = 4;
                else if (randLevel < 0.4) level = 3;
                else if (randLevel < 0.7) level = 2;
                else level = 1;
                this.organisms.push(new Organism(level, i)); // Pass index as part of ID
                if (level === 5) break; // If civilization, it's the only dominant "type"
            }
        }

        getModalVisualRepresentation() {
            let color = PLANET_COLORS_CHART[this.type] || '#808080'; // Default gray
            let additionalStyles = '';
            switch (this.type) {
                case 'Gas Giant': additionalStyles = `background: repeating-linear-gradient(45deg, ${color}, ${color} 5px, ${shadeColor(color, -20)} 5px, ${shadeColor(color, -20)} 10px);`; break;
                case 'Water World': additionalStyles = `background: radial-gradient(circle, ${shadeColor(color, 30)} 60%, ${color} 100%);`; break;
                case 'Ice Planet': additionalStyles = `border: 2px solid ${shadeColor(color, 20)}; box-shadow: inset 0 0 5px ${shadeColor(color, -10)}, 0 0 3px ${color};`; break;
                case 'Rocky': additionalStyles = `background-image: radial-gradient(circle at 20% 20%, ${shadeColor(color, 10)} 1px, transparent 2px), radial-gradient(circle at 80% 70%, ${shadeColor(color, -10)} 1px, transparent 2px);`; break;
            }
            return `<div class="planet-visual-modal" style="background-color: ${color}; ${additionalStyles}"></div>`;
        }
    }

    class AsteroidBelt { 
        constructor(name, orbitalDistance) {
            this.name = name; // Unique name
            this.type = "Asteroid Belt";
            this.orbitalDistance = orbitalDistance;
            this.size = "Variable"; 
            this.hasLife = false; // Asteroid belts typically don't host life in this model
            this.organisms = [];
        }
        getModalVisualRepresentation() {
            return `<div class="asteroid-visual-modal"></div>`; // Styled by CSS
        }
    }

    class Organism { 
        constructor(complexityLevel, indexInPlanet) {
            this.complexityLevel = complexityLevel;
            // Organism ID could be PlanetName-OrganismIndex for uniqueness if needed for direct lookup
            this.id = indexInPlanet; // Simple index for now, context provided by planet
            this.description = this.generateDescription();
        }

        generateDescription() {
            // Descriptions are now in English
            switch (this.complexityLevel) {
                case 1: return `Microorganisms (${['Unicellular Bacteria', 'Archaeal Extremophiles', 'Simple Viruses'][Math.floor(Math.random()*3)]})`;
                case 2: return `Simple Multicellular Life (${['Algal Colonies', 'Filamentous Fungi', 'Small Flatworms'][Math.floor(Math.random()*3)]})`;
                case 3: return `Complex Life (${['Rooted Plants', 'Exoskeletal Insectoids', 'Shelled Marine Creatures'][Math.floor(Math.random()*3)]})`;
                case 4: return `Advanced Life (${['Furred Mammaloids', 'Reptilian Hunters', 'Intelligent Avians'][Math.floor(Math.random()*3)]})`;
                case 5: return `Intelligent Civilization (${['City Builders', 'Emergent Space Travelers', 'Global Consciousness Networks'][Math.floor(Math.random()*3)]})`;
                default: return "Unknown Lifeform";
            }
        }
        getModalVisualRepresentation() {
            let style = 'background-color: #90ee90; border-radius: 50%;'; // Level 1: LightGreen, circle
            switch (this.complexityLevel) {
                case 2: style = 'background-color: #3cb371; width: 10px; height: 18px; border-radius: 40% 40% 20% 20% / 60% 60% 30% 30%;'; break; // MediumSeaGreen, droplet/leaf shape
                case 3: style = 'background-color: #2e8b57; clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);'; break; // SeaGreen, diamond
                case 4: style = 'background-color: #006400; clip-path: polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%);'; break; // DarkGreen, trapezoid
                case 5: style = 'background: conic-gradient(gold, orange, gold, orange, gold); border-radius:50%; box-shadow: 0 0 5px gold; clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);'; break; // Gold, star shape
            }
            return `<div class="organism-visual-modal" style="${style}"></div>`;
        }
    }

    // --- UTILITY, UI, AND STATS FUNCTIONS ---

    // Utility to shade colors (for visual effects)
    function shadeColor(hexColor, percent) { 
        let R = parseInt(hexColor.substring(1,3),16);
        let G = parseInt(hexColor.substring(3,5),16);
        let B = parseInt(hexColor.substring(5,7),16);
        R = parseInt(R * (100 + percent) / 100);
        G = parseInt(G * (100 + percent) / 100);
        B = parseInt(B * (100 + percent) / 100);
        R = Math.min(255, Math.max(0, R));  
        G = Math.min(255, Math.max(0, G));  
        B = Math.min(255, Math.max(0, B));  
        const RR = R.toString(16).padStart(2, '0');
        const GG = G.toString(16).padStart(2, '0');
        const BB = B.toString(16).padStart(2, '0');
        return `#${RR}${GG}${BB}`;
    }

    function updateSliderValues() {
        numStarsValueSpan.textContent = numStarsSlider.value;
        lifeChanceValueSpan.textContent = `${lifeChanceSlider.value}%`;
    }

    function generateNewGalaxy() {
        const numStars = parseInt(numStarsSlider.value);
        const lifeChance = parseInt(lifeChanceSlider.value);
        currentGalaxy = new Galaxy(numStars, lifeChance);
        currentGalaxy.draw();
        updateDiscoveredPlanetsList();
        
        const stats = currentGalaxy.calculateStatistics();
        updateStatisticsDisplay(stats);
    }
    
    // Central function to display entity details in the modal
    function showEntityDetails(entity, entityType) {
        if (!entity) {
            console.error("Invalid entity for showing details:", entity, entityType);
            entityDetailModal.style.display = "none";
            return;
        }

        let modalTitle = "";
        let mainContentHtml = "";
        
        modalEntityNameHeader.textContent = "";
        modalEntityDetailsDiv.innerHTML = "";
        modalEntityRelatedListUl.innerHTML = "";
        modalEntityRelatedListSectionDiv.style.display = 'block'; // Default to show related list section

        if (entityType === 'star') {
            modalTitle = `Star: ${entity.name}`;
            const starVisualHtml = entity.getModalVisualRepresentation();
            mainContentHtml = `
                <div class="entity-info-header">
                    ${starVisualHtml}
                    <p><strong>Type:</strong> ${entity.type}</p>
                </div>
                <p><strong>Actual Size (approx.):</strong> ${entity.actualSize.toFixed(4)} R☉</p>
                <p><strong>Habitable Zone:</strong> ${entity.habitableZone.text}</p>
                <p><strong>Objects in System:</strong> ${entity.celestialObjects.length}</p>
            `;
            modalRelatedListTitleHeader.textContent = "Planets and Objects in System:";
            if (entity.celestialObjects.length > 0) {
                entity.celestialObjects.forEach(obj => {
                    const listItem = document.createElement('li');
                    const objectVisualHtml = obj.getModalVisualRepresentation();
                    let lifeInfoHtml = '';
                    let objectNameHtml = `<strong>${obj.name}</strong>`; // Default name display

                    if (obj instanceof Planet) {
                        // Make planet name clickable
                        objectNameHtml = `<strong class="clickable-entity" data-type="planet" data-star-name="${entity.name}" data-planet-name="${obj.name}">${obj.name}</strong>`;
                        
                        if (obj.hasLife && obj.organisms.length > 0) {
                            lifeInfoHtml += `<p><strong>Life Detected:</strong> Yes</p><ul>`;
                            obj.organisms.forEach((org, index) => {
                                const organismVisualHtml = org.getModalVisualRepresentation();
                                // Make organism description clickable
                                const organismNameHtml = `<span class="clickable-entity" data-type="organism" data-star-name="${entity.name}" data-planet-name="${obj.name}" data-organism-id="${org.id}">${org.description}</span>`;
                                lifeInfoHtml += `<li>${organismVisualHtml} ${organismNameHtml} (Level ${org.complexityLevel})</li>`;
                            });
                            lifeInfoHtml += `</ul>`;
                        } else {
                            lifeInfoHtml = `<p><strong>Life Detected:</strong> No</p>`;
                        }
                    }
                    listItem.innerHTML = `
                        <div class="entity-info-header">
                            ${objectVisualHtml}
                            <p>${objectNameHtml} (${obj.type})</p>
                        </div>
                        <p><strong>Orbital Distance:</strong> ${obj.orbitalDistance} AU (approx.)</p>
                        <p><strong>Size:</strong> ${typeof obj.size === 'number' ? obj.size.toFixed(2) + ' R⊕' : obj.size}</p>
                        ${obj instanceof Planet && obj.isInHabitableZone ? `<p><strong>In Habitable Zone:</strong> ${obj.isInHabitableZone() ? 'Yes' : 'No'}</p>` : ''}
                        ${lifeInfoHtml}
                    `;
                    modalEntityRelatedListUl.appendChild(listItem);
                });
            } else {
                modalEntityRelatedListUl.innerHTML = '<li>No objects detected in this system.</li>';
            }

        } else if (entityType === 'planet') {
            modalTitle = `Planet: ${entity.name}`;
            const planetVisualHtml = entity.getModalVisualRepresentation();
            // Make parent star name clickable
            const parentStarNameHtml = `<span class="clickable-entity" data-type="star" data-star-name="${entity.parentStar.name}">${entity.parentStar.name}</span>`;
            mainContentHtml = `
                <div class="entity-info-header">
                    ${planetVisualHtml}
                    <p><strong>Type:</strong> ${entity.type}</p>
                </div>
                <p><strong>Parent Star:</strong> ${parentStarNameHtml} (${entity.parentStar.type})</p>
                <p><strong>Orbital Distance:</strong> ${entity.orbitalDistance} AU (approx.)</p>
                <p><strong>Size:</strong> ${entity.size.toFixed(2)} R⊕</p>
                <p><strong>In Habitable Zone:</strong> ${entity.isInHabitableZone() ? 'Yes' : 'No'}</p>
            `;
            modalRelatedListTitleHeader.textContent = "Detected Life Forms:";
            if (entity.hasLife && entity.organisms.length > 0) {
                entity.organisms.forEach((org, index) => {
                    const listItem = document.createElement('li');
                    const organismVisualHtml = org.getModalVisualRepresentation();
                    // Make organism description clickable
                    const organismNameHtml = `<span class="clickable-entity" data-type="organism" data-star-name="${entity.parentStar.name}" data-planet-name="${entity.name}" data-organism-id="${org.id}">${org.description}</span>`;
                    listItem.innerHTML = `
                        <div class="entity-info-header">
                            ${organismVisualHtml}
                            <p>${organismNameHtml} (Level ${org.complexityLevel})</p>
                        </div>
                    `;
                    modalEntityRelatedListUl.appendChild(listItem);
                });
            } else {
                modalEntityRelatedListUl.innerHTML = '<li>No complex life detected or no life forms registered.</li>';
            }

        } else if (entityType === 'organism') {
            modalTitle = `Life Form: ${entity.description.split('(')[0].trim()}`;
            const organismVisualHtml = entity.getModalVisualRepresentation();
            // Make host planet name clickable (entity._hostPlanet was added when organism was selected)
            const hostPlanetNameHtml = `<span class="clickable-entity" data-type="planet" data-star-name="${entity._hostPlanet.parentStar.name}" data-planet-name="${entity._hostPlanet.name}">${entity._hostPlanet.name}</span>`;
            mainContentHtml = `
                <div class="entity-info-header">
                    ${organismVisualHtml}
                    <p><strong>Description:</strong> ${entity.description}</p>
                </div>
                <p><strong>Complexity Level:</strong> ${entity.complexityLevel}</p>
                <p><strong>Inhabits:</strong> Planet ${hostPlanetNameHtml}</p>
                <p><strong>Star System:</strong> <span class="clickable-entity" data-type="star" data-star-name="${entity._hostPlanet.parentStar.name}">${entity._hostPlanet.parentStar.name}</span></p>
            `;
            modalEntityRelatedListSectionDiv.style.display = 'none'; // Hide related list section for organisms
        }

        modalEntityNameHeader.textContent = modalTitle;
        modalEntityDetailsDiv.innerHTML = mainContentHtml;
        entityDetailModal.style.display = "block";
    }

    function updateDiscoveredPlanetsList() { 
        discoveredPlanetsContainerDiv.innerHTML = '';
        if (!currentGalaxy || currentGalaxy.stars.length === 0) {
            discoveredPlanetsContainerDiv.innerHTML = '<p>No stars to display. Generate a galaxy.</p>';
            return;
        }

        const starsUl = document.createElement('ul');
        currentGalaxy.stars.forEach(star => {
            const realPlanets = star.celestialObjects.filter(obj => obj instanceof Planet);
            const asteroidBelts = star.celestialObjects.filter(obj => obj instanceof AsteroidBelt);
            // Only show stars with planets or asteroid belts
            if (realPlanets.length === 0 && asteroidBelts.length === 0) return; 

            const starLi = document.createElement('li');
            const starVisualMini = `<span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${star.color}; margin-right:5px; vertical-align: middle;"></span>`;
            let objectsInfo = `${realPlanets.length} planet(s)`;
            if (asteroidBelts.length > 0) {
                objectsInfo += `, ${asteroidBelts.length} belt(s)`;
            }
            // Make star entry itself clickable to show details
            starLi.innerHTML = `${starVisualMini}<strong class="clickable-entity" data-type="star" data-star-name="${star.name}">${star.name}</strong> (${star.type}) - ${objectsInfo}`;
            
            const objectsUl = document.createElement('ul');
            objectsUl.style.display = 'none'; // Hidden by default

            star.celestialObjects.forEach(obj => {
                const objectLi = document.createElement('li');
                let visualIndicator = '';
                 if (obj instanceof Planet) {
                    switch (obj.type) {
                        case 'Rocky': visualIndicator = `<span style="color:${PLANET_COLORS_CHART['Rocky']};">🪨</span>`; break;
                        case 'Gas Giant': visualIndicator = `<span style="color:${PLANET_COLORS_CHART['Gas Giant']};">💨</span>`; break;
                        case 'Water World': visualIndicator = `<span style="color:${PLANET_COLORS_CHART['Water World']};">💧</span>`; break;
                        case 'Ice Planet': visualIndicator = `<span style="color:${PLANET_COLORS_CHART['Ice Planet']};">❄️</span>`; break;
                    }
                    // Make planet name clickable in this list too
                    objectLi.innerHTML = `${visualIndicator} <span class="clickable-entity" data-type="planet" data-star-name="${star.name}" data-planet-name="${obj.name}">${obj.name}</span> (${obj.type})`;
                    if (obj.hasLife) {
                        objectLi.classList.add('has-life');
                        objectLi.innerHTML += ' 🌱'; // Life indicator
                    }
                } else if (obj instanceof AsteroidBelt) {
                    visualIndicator = `<span style="color:#999;">☄️</span>`;
                    objectLi.innerHTML = `${visualIndicator} ${obj.name} (${obj.type})`; // Asteroid belts are not clickable for details in this list for now
                }
                objectsUl.appendChild(objectLi);
            });

            if (objectsUl.children.length > 0) {
                starLi.appendChild(objectsUl);
                // Event listener to expand/collapse the list of objects under a star
                starLi.addEventListener('click', (event) => {
                    // Prevent if the click was on a clickable entity within the starLi (like the star name itself)
                    if (event.target.closest('.clickable-entity')) {
                        // The modal click handler will take care of this
                        return; 
                    }
                    event.stopPropagation();
                    const sublist = starLi.querySelector('ul');
                    if (sublist) {
                        sublist.style.display = sublist.style.display === 'none' ? 'block' : 'none';
                    }
                });
                starsUl.appendChild(starLi);
            }
        });
        discoveredPlanetsContainerDiv.appendChild(starsUl);
    }
    
    function updateStatisticsDisplay(stats) {
        statHabitablePlanetsSpan.textContent = stats.habitablePlanets;
        statPlanetsWithLifeSpan.textContent = stats.planetsWithLife;
        statCivilizationsSpan.textContent = stats.civilizations;

        const starDataForChart = Object.entries(stats.starTypes).map(([label, value]) => ({ label, value }));
        drawPieChart(starTypesChartCanvas, starDataForChart, STAR_COLORS_CHART, starTypesChartLegendDiv);

        const planetDataForChart = Object.entries(stats.planetTypes).map(([label, value]) => ({ label, value }));
        drawPieChart(planetTypesChartCanvas, planetDataForChart, PLANET_COLORS_CHART, planetTypesChartLegendDiv);
    }

    function drawPieChart(canvasElement, data, colors, legendElement) {
        const chartCtx = canvasElement.getContext('2d');
        chartCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        legendElement.innerHTML = ''; // Clear legend

        if (data.length === 0) {
            chartCtx.fillStyle = "#555";
            chartCtx.textAlign = "center";
            chartCtx.font = "14px Arial";
            chartCtx.fillText("No data to display", canvasElement.width / 2, canvasElement.height / 2);
            return;
        }

        const totalValue = data.reduce((sum, item) => sum + item.value, 0);
        if (totalValue === 0) {
            chartCtx.fillStyle = "#555";
            chartCtx.textAlign = "center";
            chartCtx.font = "14px Arial";
            chartCtx.fillText("No valid data", canvasElement.width / 2, canvasElement.height / 2);
            return;
        }

        const centerX = canvasElement.width / 2;
        const centerY = canvasElement.height / 2;
        const radius = Math.min(canvasElement.width, canvasElement.height) / 2 * 0.8; // 80% of available radius

        let startAngle = -Math.PI / 2; // Start from the top

        data.forEach(item => {
            const percentage = item.value / totalValue;
            const sliceAngle = percentage * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;

            chartCtx.beginPath();
            chartCtx.moveTo(centerX, centerY);
            chartCtx.arc(centerX, centerY, radius, startAngle, endAngle);
            chartCtx.closePath();
            chartCtx.fillStyle = colors[item.label] || '#cccccc'; // Default color if not found
            chartCtx.fill();

            // Add to legend
            const legendItemSpan = document.createElement('span');
            const colorBoxSpan = document.createElement('span');
            colorBoxSpan.className = 'color-box';
            colorBoxSpan.style.backgroundColor = colors[item.label] || '#cccccc';
            legendItemSpan.appendChild(colorBoxSpan);
            legendItemSpan.appendChild(document.createTextNode(`${item.label}: ${item.value} (${(percentage * 100).toFixed(1)}%)`));
            legendElement.appendChild(legendItemSpan);
            
            startAngle = endAngle;
        });
    }

    // --- EVENT LISTENERS ---
    numStarsSlider.addEventListener('input', updateSliderValues);
    lifeChanceSlider.addEventListener('input', updateSliderValues);
    generateGalaxyButton.addEventListener('click', generateNewGalaxy);

    closeModalButton.onclick = function() { entityDetailModal.style.display = "none"; }
    window.onclick = function(event) { if (event.target == entityDetailModal) { entityDetailModal.style.display = "none"; } }

    // Click on galaxy canvas to select a star
    galaxyCanvasElement.addEventListener('click', (event) => {
        const rect = galaxyCanvasElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (currentGalaxy) {
            const clickedStar = currentGalaxy.getStarAtPosition(x, y);
            if (clickedStar) { 
                showEntityDetails(clickedStar, 'star'); 
            }
        }
    });

    // Click listener for clickable entities WITHIN the modal or discovered planets list
    function handleEntityClick(event) {
        const target = event.target.closest('.clickable-entity');
        if (!target || !currentGalaxy) return;

        event.stopPropagation(); 

        const type = target.dataset.type;
        const starName = target.dataset.starName;
        const planetName = target.dataset.planetName;
        const organismId = target.dataset.organismId !== undefined ? parseInt(target.dataset.organismId) : undefined;

        let selectedEntity = null;
        let parentStarForContext = currentGalaxy.stars.find(s => s.name === starName);

        if (type === 'star') {
            selectedEntity = parentStarForContext;
        } else if (type === 'planet' && parentStarForContext) {
            selectedEntity = parentStarForContext.celestialObjects.find(p => p.name === planetName && p instanceof Planet);
        } else if (type === 'organism' && parentStarForContext && planetName && organismId !== undefined) {
            const parentPlanet = parentStarForContext.celestialObjects.find(p => p.name === planetName && p instanceof Planet);
            if (parentPlanet && parentPlanet.organisms) {
                selectedEntity = parentPlanet.organisms.find(org => org.id === organismId);
                if (selectedEntity) {
                    selectedEntity._hostPlanet = parentPlanet; // Add host planet context for the modal
                }
            }
        }

        if (selectedEntity) {
            showEntityDetails(selectedEntity, type);
        } else {
            console.warn("Could not find the clicked entity with data:", target.dataset);
        }
    }
    
    entityDetailModal.addEventListener('click', handleEntityClick);
    discoveredPlanetsContainerDiv.addEventListener('click', handleEntityClick); // Also listen on the main list

    // --- INITIALIZATION ---
    function initializeApp() {
        updateSliderValues();
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        ctx.font = "16px Arial";
        ctx.fillText("Configure and generate a galaxy to begin.", galaxyCanvasElement.width / 2, galaxyCanvasElement.height / 2);
        updateDiscoveredPlanetsList(); // Clear the list initially
        // Initialize stats and charts as empty/default
        updateStatisticsDisplay({ habitablePlanets: 0, planetsWithLife: 0, civilizations: 0, starTypes: {}, planetTypes: {} });
    }

    initializeApp();

}); // End of DOMContentLoaded