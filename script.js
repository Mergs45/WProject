// =====================================================================
// ================= LÓGICA PARA LA REGLA DE TIEMPO ====================
// =====================================================================

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
function initRuler() {
    createRulerElements();
    setInitialTime();
}

initRuler(); // Run the app setup for the ruler

// =====================================================================
// =========== LÓGICA PARA LA CALCULADORA DE HORAS (FINAL) =============
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    const calcularBtn = document.getElementById('calcular');
    const addDescansoBtn = document.getElementById('add-descanso');
    const descansosContainer = document.getElementById('descansos-container');
    const timeEntriesContainer = document.getElementById('time-entries-container');

    const DEFAULT_DESCANSOS = [
        { title: 'Break 1', label: 'Break' },
        { title: 'Break 2', label: 'Break' },
        { title: 'Lunch', label: 'Lunch' },
        { title: 'Outage', label: 'Outage' }
    ];

    // ========= BLOQUE DE FUNCIONES CORREGIDO =========
    function parse12hToMinutes(hours, minutes, ampm) {
        if (isNaN(hours) || isNaN(minutes)) return null;
        if (ampm === 'pm' && hours < 12) hours += 12;
        if (ampm === 'am' && hours === 12) hours = 0;
        return (hours * 60) + minutes;
    }
    
    function getMinutesFromCustomInput(container) {
        const hourInput = container.querySelector('.time-hour');
        const minuteInput = container.querySelector('.time-minute');
        const activeAmPm = container.querySelector('.ampm-buttons .active');
        
        if (!hourInput.value || !minuteInput.value || !activeAmPm) return null;

        const ampm = activeAmPm.classList.contains('am-btn') ? 'am' : 'pm';
        return parse12hToMinutes(parseInt(hourInput.value), parseInt(minuteInput.value), ampm);
    }
    
    function formatMinutesToTime(totalMinutes) {
        const sign = totalMinutes < 0 ? "-" : "";
        const absMinutes = Math.abs(totalMinutes);
        const hours = Math.floor(absMinutes / 60);
        const minutes = Math.round(absMinutes % 60);
        return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function formatMinutesTo12hTime(totalMinutes) {
        const minutesInDay = totalMinutes % (24 * 60);
        let hours = Math.floor(minutesInDay / 60);
        const minutes = minutesInDay % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // La hora '0' debe ser '12'
        return `<strong>${hours}:${String(minutes).padStart(2, '0')} ${ampm}</strong>`;
    }
    // ========= FIN DEL BLOQUE CORREGIDO =========

    function generarResumenNarrativo(sortedEvents) {
        if (sortedEvents.length < 2) return "";
        let phrases = [`El empleado inició su jornada a las ${formatMinutesTo12hTime(sortedEvents[0].minutes)}.`];
        sortedEvents.forEach(event => {
            let label = event.label.toLowerCase();
            if (label.includes('break')) label = 'un break';

            switch (event.type) {
                case 'break_start':
                    phrases.push(`Tomó ${label} a las ${formatMinutesTo12hTime(event.minutes)}`);
                    break;
                case 'break_end':
                    phrases.push(`y regresó a las ${formatMinutesTo12hTime(event.minutes)}.`);
                    break;
                case 'work_end':
                    phrases.push(`Finalmente, su jornada terminó a las ${formatMinutesTo12hTime(event.minutes)}.`);
                    break;
            }
        });
        return `<p>${phrases.join(' ').replace(/\. T/g, ', t')}</p>`;
    }

    function calcularJornada() {
        const events = [];
        document.querySelectorAll('.entry-item').forEach(item => {
            const idaContainer = item.querySelector('.ida-container');
            const regresoContainer = item.querySelector('.regreso-container');
            if (!idaContainer || !regresoContainer) return; 

            const idaMins = getMinutesFromCustomInput(idaContainer);
            const regresoMins = getMinutesFromCustomInput(regresoContainer);
            const type = item.dataset.eventType;
            const label = item.dataset.eventLabel;

            if (idaMins !== null && regresoMins !== null) {
                let endMins = regresoMins;
                if (endMins < idaMins) endMins += 24 * 60;
                if (type === "Jornada") {
                    events.push({ minutes: idaMins, type: 'work_start', label });
                    events.push({ minutes: endMins, type: 'work_end', label });
                } else {
                    events.push({ minutes: idaMins, type: 'break_start', label });
                    events.push({ minutes: endMins, type: 'break_end', label });
                }
            }
        });

        if (events.length < 2) {
             alert("Por favor, ingresa al menos la hora de entrada y salida.");
             return;
        }

        events.sort((a, b) => a.minutes - b.minutes);

        let tiempoProductivoTotal = 0;
        let tiempoDescansoTotal = 0;
        let breakdownHtml = '<h4>Desglose de la Jornada</h4><ul>';

        for (let i = 0; i < events.length - 1; i++) {
            const duration = events[i+1].minutes - events[i].minutes;
            if (events[i].type === 'work_start' || events[i].type === 'break_end') {
                tiempoProductivoTotal += duration;
                breakdownHtml += `<li><span>Bloque de Trabajo</span> <span class="duration">${formatMinutesToTime(duration)}</span></li>`;
            } else if (events[i].type === 'break_start') {
                tiempoDescansoTotal += duration;
                const title = events[i].label;
                breakdownHtml += `<li><span>${title}</span> <span class="duration">${formatMinutesToTime(duration)}</span></li>`;
            }
        }
        
        document.getElementById('breakdown-container').innerHTML = breakdownHtml + '</ul>';
        document.getElementById('summary-container').innerHTML = generarResumenNarrativo(events);

        const MAX_DESCANSO = 1.5 * 60;
        const tiempoAReponer = Math.max(0, tiempoDescansoTotal - MAX_DESCANSO);
        
        const totalDescansosEl = document.getElementById('total-descansos');
        totalDescansosEl.textContent = formatMinutesToTime(tiempoDescansoTotal);
        totalDescansosEl.classList.toggle('excedido', tiempoDescansoTotal > MAX_DESCANSO);
        
        const tiempoReponerWrapper = document.getElementById('tiempo-reponer-wrapper');
        if (tiempoAReponer > 0) {
            document.getElementById('tiempo-reponer').textContent = formatMinutesToTime(tiempoAReponer);
            tiempoReponerWrapper.classList.remove('hidden');
        } else {
            tiempoReponerWrapper.classList.add('hidden');
        }
        
        const trabajoTotalEl = document.getElementById('balance');
        trabajoTotalEl.textContent = formatMinutesToTime(tiempoProductivoTotal);
        trabajoTotalEl.classList.remove('positivo', 'negativo');
    }

    function createEntryHTML(title, label) {
        return `
            <div class="entry-item p-3 bg-slate-800/50 rounded-lg" data-event-type="Descanso" data-event-label="${title}">
                <h4 class="font-semibold text-slate-200 mb-2">${title}</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Ida</label>
                        <div class="ida-container custom-time-input">
                            <div class="split-time-input"><input type="number" class="time-hour" placeholder="HH" min="1" max="12"><span class="separator">:</span><input type="number" class="time-minute" placeholder="MM" min="0" max="59"></div>
                            <div class="ampm-buttons"><button class="am-btn" tabindex="-1">AM</button><button class="pm-btn active" tabindex="-1">PM</button></div>
                            <button class="clear-btn" title="Borrar hora" tabindex="-1">&times;</button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">Regreso</label>
                        <div class="regreso-container custom-time-input">
                            <div class="split-time-input"><input type="number" class="time-hour" placeholder="HH" min="1" max="12"><span class="separator">:</span><input type="number" class="time-minute" placeholder="MM" min="0" max="59"></div>
                            <div class="ampm-buttons"><button class="am-btn" tabindex="-1">AM</button><button class="pm-btn active" tabindex="-1">PM</button></div>
                            <button class="clear-btn" title="Borrar hora" tabindex="-1">&times;</button>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function initCalculator() {
        DEFAULT_DESCANSOS.forEach(desc => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createEntryHTML(desc.title, desc.label);
            descansosContainer.appendChild(tempDiv.firstElementChild);
        });
    }

    timeEntriesContainer.addEventListener('input', e => {
        if (e.target.matches('.time-hour') && e.target.value.length >= 2) {
            e.target.nextElementSibling.nextElementSibling.focus();
        }
    });

    timeEntriesContainer.addEventListener('click', e => {
        if (e.target.matches('.am-btn, .pm-btn')) {
            const parent = e.target.parentElement;
            parent.querySelector('.am-btn').classList.remove('active');
            parent.querySelector('.pm-btn').classList.remove('active');
            e.target.classList.add('active');
        }
        if (e.target.matches('.clear-btn')) {
            const customInput = e.target.closest('.custom-time-input');
            customInput.querySelector('.time-hour').value = '';
            customInput.querySelector('.time-minute').value = '';
        }
    });
    
    calcularBtn.addEventListener('click', calcularJornada);
    
    addDescansoBtn.addEventListener('click', () => {
        const count = (descansosContainer.children.length - DEFAULT_DESCANSOS.length) + 1;
        const title = `Descanso Extra ${count}`;
        const newEntryHTML = createEntryHTML(title, title);
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newEntryHTML;
        
        descansosContainer.appendChild(tempDiv.firstElementChild);
    });

    initCalculator();
});