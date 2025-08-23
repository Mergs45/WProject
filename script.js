// Get references to all necessary DOM elements
const elements = {
    mainApp: document.getElementById('main-app'),
    timeRuler: document.getElementById('time-ruler'),
    marker: document.getElementById('marker'),
    topLabels: document.getElementById('top-labels'),
    bottomLabels: document.getElementById('bottom-labels'),
    ampmSection: document.getElementById('ampm-section'),
    time12hr: document.getElementById('time-12hr'),
    time24hr: document.getElementById('time-24hr'),
};

// State variables
let isDragging = false;
const hourRange = { start: 12, end: 32 }; // Permanent range from 12 PM to 32h

/**
 * Sets the marker and clocks to a specific hour.
 * @param {number} hour - The hour to set.
 */
function setHour(hour) {
    const totalHours = hourRange.end - hourRange.start;
    const hourInScale = hour - hourRange.start;
    const snappedPercentage = totalHours > 0 ? (hourInScale / totalHours) * 100 : 0;
    elements.marker.style.left = `${snappedPercentage}%`;
    updateClocks(hour);
    highlightLabels(hour);
}

/**
 * Generates the hour labels, tick marks, and AM/PM section.
 */
function createRulerElements() {
    // Clear previous elements
    elements.topLabels.innerHTML = ''; 
    elements.bottomLabels.innerHTML = '';
    elements.ampmSection.innerHTML = '';
    Array.from(elements.timeRuler.children).forEach(child => {
        if (child.id !== 'marker') child.remove();
    });

    const totalHours = hourRange.end - hourRange.start;

    for (let i = 0; i <= totalHours; i++) {
        const actualHour = hourRange.start + i;
        const positionPercent = totalHours > 0 ? (i / totalHours) * 100 : 0;

        // Create Tick Marks
        const tick = document.createElement('div');
        tick.className = 'tick-mark';
        if (actualHour % 3 === 0) tick.classList.add('major');
        tick.style.left = `${positionPercent}%`;
        elements.timeRuler.appendChild(tick);

        // Create Top (Extended) Label
        const topLabel = document.createElement('span');
        topLabel.className = 'hour-label absolute';
        topLabel.style.left = `${positionPercent}%`;
        topLabel.textContent = actualHour;
        topLabel.dataset.hour = actualHour; 
        topLabel.addEventListener('click', () => setHour(actualHour));
        // ETIQUETAS AHORA SIEMPRE VISIBLES. Solo se pone en negrita la principal.
        if (actualHour % 3 === 0) { 
            topLabel.classList.add('font-bold', 'text-white');
        }
        elements.topLabels.appendChild(topLabel);

        // Create Bottom (12h) Label
        const bottomLabel = document.createElement('span');
        bottomLabel.className = 'hour-label absolute';
        bottomLabel.style.left = `${positionPercent}%`;
        bottomLabel.dataset.hour = actualHour;
        bottomLabel.addEventListener('click', () => setHour(actualHour));
        let hour12 = actualHour % 12;
        hour12 = hour12 === 0 ? 12 : hour12;
        bottomLabel.textContent = hour12;
        // ETIQUETAS AHORA SIEMPRE VISIBLES. Solo se pone en negrita la principal.
        if (actualHour % 3 === 0) {
            bottomLabel.classList.add('font-bold', 'text-white');
        }
        elements.bottomLabels.appendChild(bottomLabel);
    }
    
    // Combined PM / AM (Extendido) Section
    elements.ampmSection.innerHTML = `
        <div class="w-[60%] border-t-2 border-orange-500 text-orange-400">PM</div>
        <div class="w-[40%] border-t-2 border-rose-500 text-rose-400">AM (Extendido)</div>
    `;
}

/**
 * Updates the digital clock displays based on the selected hour.
 * @param {number} hourExt - The selected hour in extended format.
 */
function updateClocks(hourExt) {
    elements.time24hr.textContent = hourExt;
    const isPM = hourExt >= 12 && hourExt < 24;
    const ampm = isPM ? 'PM' : 'AM';
    let hour12 = hourExt % 12;
    hour12 = hour12 ? hour12 : 12;
    elements.time12hr.textContent = `${hour12} ${ampm}`;
}

/**
 * Highlights the labels for the currently selected hour.
 * @param {number} hour - The hour to highlight.
 */
function highlightLabels(hour) {
    document.querySelectorAll('.hour-label').forEach(l => l.classList.remove('highlighted'));
    document.querySelectorAll(`.hour-label[data-hour="${hour}"]`).forEach(l => l.classList.add('highlighted'));
}

/**
 * Updates the marker's position by snapping it to the nearest hour.
 * @param {number} clientX - The horizontal coordinate of the mouse/touch event.
 */
function updatePosition(clientX) {
    const rulerRect = elements.timeRuler.getBoundingClientRect();
    let x = clientX - rulerRect.left;
    if (x < 0) x = 0;
    if (x > rulerRect.width) x = rulerRect.width;
    const percentage = x / rulerRect.width;
    const totalHours = hourRange.end - hourRange.start;
    const closestHourInScale = Math.round(percentage * totalHours);
    const closestActualHour = hourRange.start + closestHourInScale;
    setHour(closestActualHour);
}

/**
 * Sets the initial marker position based on the current system time.
 */
function setInitialTime() {
    const now = new Date();
    let currentHour = now.getHours();
    if (currentHour < hourRange.start) {
       currentHour = hourRange.start;
    }
    setHour(currentHour);
}

// --- Drag and Drop Event Handlers ---
function startDrag(e) {
    isDragging = true;
    updatePosition(e.touches ? e.touches[0].clientX : e.clientX);
}

function onDrag(e) {
    if (isDragging) {
        e.preventDefault();
        updatePosition(e.touches ? e.touches[0].clientX : e.clientX);
    }
}

function endDrag() { 
    isDragging = false; 
}

// Attach drag listeners
elements.timeRuler.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', onDrag);
document.addEventListener('mouseup', endDrag);
elements.timeRuler.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', onDrag);
document.addEventListener('touchend', endDrag);

// Rebuild the ruler on window resize to adjust labels
window.addEventListener('resize', () => {
    const currentHourStr = document.querySelector('.hour-label.highlighted')?.dataset.hour;
    const currentHour = currentHourStr ? parseInt(currentHourStr, 10) : hourRange.start;
    createRulerElements();
    setHour(currentHour);
});

// --- Initial App Setup ---
function init() {
    createRulerElements();
    setInitialTime();
}

init(); // Run the app setup