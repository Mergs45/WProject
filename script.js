// Get references to all necessary DOM elements
const elements = {
    modeSelector: document.getElementById('mode-selector'),
    mainApp: document.getElementById('main-app'),
    timeRuler: document.getElementById('time-ruler'),
    marker: document.getElementById('marker'),
    topLabels: document.getElementById('top-labels'),
    bottomLabels: document.getElementById('bottom-labels'),
    ampmSection: document.getElementById('ampm-section'),
    time12hr: document.getElementById('time-12hr'),
    time24hr: document.getElementById('time-24hr'),
    navigation: document.getElementById('navigation')
};

// State variables
let isDragging = false;
let currentMode = 'all';
let hourRange = { start: 0, end: 24 };

/**
 * Sets the marker and clocks to a specific hour.
 * @param {number} hour - The hour to set (0-24).
 */
function setHour(hour) {
    const totalHours = hourRange.end - hourRange.start;
    const hourInScale = hour - hourRange.start;
    // Avoid division by zero if totalHours is 0
    const snappedPercentage = totalHours > 0 ? (hourInScale / totalHours) * 100 : 0;
    elements.marker.style.left = `${snappedPercentage}%`;
    updateClocks(hour);
    highlightLabels(hour);
}

/**
 * Generates the hour labels, tick marks, and AM/PM section based on the current mode.
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

        // Create Top (24h) Label
        const topLabel = document.createElement('span');
        topLabel.className = 'hour-label absolute';
        topLabel.style.left = `${positionPercent}%`;
        topLabel.textContent = actualHour;
        topLabel.dataset.hour = actualHour; 
        topLabel.addEventListener('click', () => setHour(actualHour));
        // Responsive label visibility
        if (actualHour % 3 === 0 || totalHours <= 12) { 
            topLabel.classList.add('font-bold', 'text-white');
        } else if (window.innerWidth < 1024 && actualHour % 2 !== 0) { 
            topLabel.classList.add('hidden');
        } else if (window.innerWidth < 768) { 
            topLabel.classList.add('hidden');
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
        // Responsive label visibility
        if (actualHour % 3 === 0 || totalHours <= 12) {
            bottomLabel.textContent = hour12;
            bottomLabel.classList.add('font-bold', 'text-white');
        } else if (window.innerWidth < 1024 && actualHour % 2 !== 0) {
            bottomLabel.classList.add('hidden');
        } else if (window.innerWidth < 768) {
            bottomLabel.classList.add('hidden');
        } else {
            bottomLabel.textContent = hour12;
        }
        elements.bottomLabels.appendChild(bottomLabel);
    }
    
    // AM/PM Section Logic
    if (currentMode === 'all') {
        elements.ampmSection.innerHTML = `
            <div class="w-1/2 border-t-2 border-sky-500 text-sky-400">AM</div>
            <div class="w-1/2 border-t-2 border-orange-500 text-orange-400">PM</div>`;
    } else if (currentMode === 'am') {
        elements.ampmSection.innerHTML = `<div class="w-full border-t-2 border-sky-500 text-sky-400">AM</div>`;
    } else {
        elements.ampmSection.innerHTML = `<div class="w-full border-t-2 border-orange-500 text-orange-400">PM</div>`;
    }
}

/**
 * Updates the digital clock displays based on the selected hour.
 * @param {number} hour24 - The selected hour in 24-hour format.
 */
function updateClocks(hour24) {
    elements.time24hr.textContent = hour24 === 24 ? '24' : hour24;
    const ampm = hour24 >= 12 && hour24 < 24 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
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
 * Sets the initial marker position based on the current system time and selected mode.
 * @param {string} mode - The current view mode ('am', 'pm', or 'all').
 */
function setInitialTime(mode) {
    const now = new Date();
    let currentHour = now.getHours();
    // Adjust initial hour if it falls outside the selected AM/PM range
    if (mode === 'am' && currentHour >= 12) currentHour = 0;
    if (mode === 'pm' && currentHour < 12) currentHour = 12;
    setHour(currentHour);
}

/**
 * Switches the view mode and rebuilds the ruler.
 * @param {string} mode - The new mode to switch to.
 */
function switchMode(mode) {
    currentMode = mode;
    if (mode === 'am') hourRange = { start: 0, end: 12 };
    else if (mode === 'pm') hourRange = { start: 12, end: 24 };
    else hourRange = { start: 0, end: 24 };
    
    // Update active state on navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    createRulerElements();
    setInitialTime(mode);
    // Show the main app and hide the initial selector
    elements.modeSelector.classList.add('hidden');
    elements.mainApp.classList.remove('hidden');
}

// Add event listeners to all mode-switching buttons
document.querySelectorAll('.mode-btn, .nav-btn').forEach(btn => {
    btn.addEventListener('click', () => switchMode(btn.dataset.mode));
});

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
     if (!elements.mainApp.classList.contains('hidden')) {
         createRulerElements();
         setInitialTime(currentMode);
     }
});
