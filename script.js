// =====================================================================
// as================= LÓGICA PARA LA REGLA DE TIEMPO ====================
// =====================================================================

const elements = {
    mainApp: document.getElementById('main-app'),
    timeRuler: document.getElementById('time-ruler'),
    marker: document.getElementById('marker'),
    topLabels: document.getElementById('top-labels'),
    ampmSection: document.getElementById('ampm-section'),
    time12hr: document.getElementById('time-12hr'),
    time24hr: document.getElementById('time-24hr'),
};
let isDragging = false;
const masterHourRange = { start: 12, end: 32 };
let activeHourRange = { ...masterHourRange };

function setHour(hour) {
    const totalHours = activeHourRange.end - activeHourRange.start;
    const hourInScale = hour - activeHourRange.start;
    const snappedPercentage = totalHours > 0 ? (hourInScale / totalHours) * 100 : 0;
    elements.marker.style.left = `${snappedPercentage}%`;
    updateClocks(hour);
    highlightLabels(hour);
}

function updateClocks(hourExt) {
    elements.time24hr.textContent = hourExt;
    const isPM = (hourExt % 24) >= 12;
    const ampm = isPM ? 'PM' : 'AM';
    let hour12 = hourExt % 12;
    hour12 = hour12 ? hour12 : 12;
    elements.time12hr.textContent = `${hour12} ${ampm}`;
}

function highlightLabels(hour) {
    document.querySelectorAll('.hour-label').forEach(l => l.classList.remove('highlighted'));
    document.querySelectorAll(`.hour-label[data-hour="${hour}"]`).forEach(l => l.classList.add('highlighted'));
}

function updatePosition(clientX) {
    const rulerRect = elements.timeRuler.getBoundingClientRect();
    let x = clientX - rulerRect.left;
    if (x < 0) x = 0;
    if (x > rulerRect.width) x = rulerRect.width;
    const percentage = x / rulerRect.width;
    const totalHours = activeHourRange.end - activeHourRange.start;
    const closestHourInScale = Math.round(percentage * totalHours);
    const closestActualHour = activeHourRange.start + closestHourInScale;
    setHour(closestActualHour);
}

function setInitialTime() {
    const now = new Date();
    let currentHour = now.getHours(); // 0-23
    if (currentHour < 12) {
        currentHour += 24; // Mapear a rango extendido (e.g., 1 AM -> 25)
    }
    if (currentHour >= 12 && currentHour < masterHourRange.start) {
        currentHour = masterHourRange.start;
    }
    if (currentHour > masterHourRange.end) {
        currentHour = masterHourRange.end;
    }
    setHour(currentHour);
}

function startDrag(e) { isDragging = true; updatePosition(e.touches ? e.touches[0].clientX : e.clientX); }
function onDrag(e) { if (isDragging) { e.preventDefault(); updatePosition(e.touches ? e.touches[0].clientX : e.clientX); } }
function endDrag() { isDragging = false; }

elements.timeRuler.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', onDrag);
document.addEventListener('mouseup', endDrag);
elements.timeRuler.addEventListener('touchstart', startDrag);
document.addEventListener('touchmove', onDrag);
document.addEventListener('touchend', endDrag);

// =====================================================================
// =========== LÓGICA PARA LA CALCULADORA DE HORAS (FINAL) =============
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    const calcularBtn = document.getElementById('calcular');
    const jornadaContainer = document.getElementById('jornada-container');
    const descansosContainer = document.getElementById('descansos-container');
    const timeEntriesContainer = document.getElementById('time-entries-container');
    const employeeNameInput = document.getElementById('employee-name-input');
    const addOutageBtn = document.getElementById('add-outage');
    const addReposicionBtn = document.getElementById('add-reposicion');
    const resultsContainer = document.getElementById('results-container');

    const DEFAULT_DESCANSOS = [
        { title: 'Break 1', label: 'Break', limit: 15 },
        { title: 'Break 2', label: 'Break', limit: 15 },
        { title: 'Lunch', label: 'Lunch', limit: 60 }
    ];

    function setupRuler() {
        elements.topLabels.innerHTML = '';
        elements.ampmSection.innerHTML = '';
        Array.from(elements.timeRuler.children).forEach(child => { if (child.id !== 'marker') child.remove(); });

        const totalHours = masterHourRange.end - masterHourRange.start;
        if (totalHours <= 0) return;

        for (let i = 0; i <= totalHours; i++) {
            const actualHour = masterHourRange.start + i;
            const positionPercent = (i / totalHours) * 100;

            const tick = document.createElement('div');
            tick.className = 'tick-mark';
            if (actualHour % 3 === 0) tick.classList.add('major');
            tick.style.left = `${positionPercent}%`;
            elements.timeRuler.appendChild(tick);

            const topLabel = document.createElement('span');
            topLabel.className = 'hour-label absolute';
            topLabel.style.left = `${positionPercent}%`;
            topLabel.textContent = actualHour;
            topLabel.dataset.hour = actualHour;
            topLabel.addEventListener('click', () => setHour(actualHour));
            if (actualHour % 3 === 0) topLabel.classList.add('font-bold', 'text-white');
            elements.topLabels.appendChild(topLabel);
        }

        elements.ampmSection.innerHTML = `
            <div class="w-[60%] border-t-2 border-orange-500 text-orange-400">PM</div>
            <div class="w-[40%] border-t-2 border-rose-500 text-rose-400">AM (Extendido)</div>
        `;
    }

    function getMinutesFromCustomInput(container) {
        const hourInput = container.querySelector('.time-hour');
        const minuteInput = container.querySelector('.time-minute');
        const activeAmPm = container.querySelector('.ampm-buttons .active');
        if (!hourInput.value || !minuteInput.value || !activeAmPm) return null;

        const ampm = activeAmPm.classList.contains('am-btn') ? 'am' : 'pm';
        let hours = parseInt(hourInput.value);
        let minutes = parseInt(minuteInput.value);
        if (isNaN(hours) || isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;

        let hours24 = hours;
        if (ampm === 'pm' && hours24 < 12) hours24 += 12;
        if (ampm === 'am' && hours24 === 12) hours24 = 0;

        if (hours24 < 12) {
            hours24 += 24;
        }

        return (hours24 * 60) + minutes;
    }

    function formatMinutesToTime(totalMinutes) {
        if (totalMinutes < 0) totalMinutes = 0;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }

    function formatMinutesTo12hTime(totalMinutes) {
        let hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        const displayHours = hours % 24;
        const ampm = displayHours >= 12 ? 'PM' : 'AM';
        let hour12 = displayHours % 12;
        hour12 = hour12 ? hour12 : 12;
        return `<strong>${hour12}:${String(minutes).padStart(2, '0')} ${ampm}</strong>`;
    }

    function generarResumenNarrativo(sortedEvents, employeeName) {
        if (sortedEvents.length < 2) return "";
        const jornadaStart = sortedEvents.find(e => e.type === 'work_start');
        if (!jornadaStart) return "";

        let phrases = [`La jornada de <strong>${employeeName}</strong> inició a las ${formatMinutesTo12hTime(jornadaStart.minutes)}.`];

        const breakEvents = sortedEvents.filter(e => e.type === 'break_start');

        breakEvents.forEach(startEvent => {
            const endEvent = sortedEvents.find(e => e.type === 'break_end' && e.label === startEvent.label && e.minutes >= startEvent.minutes);
            if (endEvent) {
                let label = startEvent.label.toLowerCase();
                if (label.includes('break')) label = 'un break';
                else if (label.includes('reposición')) label = 'una reposición';
                else if (label.includes('lunch')) label = 'su lunch';
                else if (label.includes('outage')) label = 'un outage';
                phrases.push(`Tomó ${label} a las ${formatMinutesTo12hTime(startEvent.minutes)} y regresó a las ${formatMinutesTo12hTime(endEvent.minutes)}.`);
            }
        });

        const endWorkEvent = sortedEvents.find(e => e.type === 'work_end');
        if (endWorkEvent) {
            phrases.push(`Finalmente, su jornada terminó a las ${formatMinutesTo12hTime(endWorkEvent.minutes)}.`);
        }

        return `<p>${phrases.join(' ')}</p>`;
    }

    function calcularJornada() {
        const employeeName = employeeNameInput.value || 'Empleado';
        let events = [];
        let rawBreaks = [];

        const jornadaItem = document.querySelector('#jornada-container .entry-item');
        let jornadaStartMins = getMinutesFromCustomInput(jornadaItem.querySelector('.ida-container'));
        let jornadaEndMins = getMinutesFromCustomInput(jornadaItem.querySelector('.regreso-container'));

        if (jornadaStartMins === null || jornadaEndMins === null) {
            resultsContainer.innerHTML = `<p class="text-center text-red-400">Por favor, ingresa la hora de entrada y salida de la jornada.</p>`;
            return;
        }

        if (jornadaEndMins <= jornadaStartMins) {
            resultsContainer.innerHTML = `<p class="text-center text-red-400">La hora de fin de jornada no puede ser anterior o igual a la de inicio.</p>`;
            return;
        }

        events.push({ minutes: jornadaStartMins, type: 'work_start', label: 'Jornada' });
        events.push({ minutes: jornadaEndMins, type: 'work_end', label: 'Jornada' });

        document.querySelectorAll('#descansos-container .entry-item').forEach(item => {
            let idaMins = getMinutesFromCustomInput(item.querySelector('.ida-container'));
            let regresoMins = getMinutesFromCustomInput(item.querySelector('.regreso-container'));

            if (idaMins !== null && regresoMins !== null) {
                rawBreaks.push({ start: idaMins, end: regresoMins, label: item.dataset.eventLabel });
                events.push({ minutes: idaMins, type: 'break_start', label: item.dataset.eventLabel });
                events.push({ minutes: regresoMins, type: 'break_end', label: item.dataset.eventLabel });
            }
        });

        const jornadaBrutaTotal = jornadaEndMins - jornadaStartMins;
        let tiempoBreaksTotal = 0, tiempoLunchTotal = 0, tiempoOutageTotal = 0, tiempoReposicionTotal = 0,
            overbreakTotal = 0, overlunchTotal = 0, totalNonProductiveTime = 0;
        let overbreakDetails = [], overlunchDetails = [], outageDetails = [];

        rawBreaks.forEach(breakItem => {
            const effectiveStart = Math.max(breakItem.start, jornadaStartMins);
            const effectiveEnd = Math.min(breakItem.end, jornadaEndMins);
            const duration = effectiveEnd - effectiveStart;

            if (duration > 0) {
                totalNonProductiveTime += duration;
                const labelLower = breakItem.label.toLowerCase();

                if (labelLower.includes('outage')) {
                    tiempoOutageTotal += duration;
                    outageDetails.push(`${breakItem.label}: ${duration} min`);
                } else if (labelLower.includes('reposición')) {
                    tiempoReposicionTotal += duration;
                } else if (labelLower.includes('lunch')) {
                    tiempoLunchTotal += duration;
                    const descInfo = DEFAULT_DESCANSOS.find(d => d.title === breakItem.label) || { limit: 60 };
                    if (duration > descInfo.limit) {
                        const overtime = duration - descInfo.limit;
                        overlunchTotal += overtime;
                        overlunchDetails.push(`${breakItem.label}: ${overtime} min`);
                    }
                } else {
                    tiempoBreaksTotal += duration;
                    const descInfo = DEFAULT_DESCANSOS.find(d => d.title === breakItem.label) || { limit: 15 };
                    if (duration > descInfo.limit) {
                        const overtime = duration - descInfo.limit;
                        overbreakTotal += overtime;
                        overbreakDetails.push(`${breakItem.label}: ${overtime} min`);
                    }
                }
            }
        });

        const tiempoProductivoTotal = jornadaBrutaTotal - totalNonProductiveTime;
        const totalAReponer = overbreakTotal + overlunchTotal + tiempoOutageTotal;

        document.getElementById('summary-container').innerHTML = generarResumenNarrativo(events.sort((a, b) => a.minutes - b.minutes), employeeName);

        resultsContainer.innerHTML = `<div class="bg-slate-900/50 rounded-lg p-4 space-y-2 border border-slate-700">
                <h4 class="text-lg font-bold text-center text-sky-300 mb-2">Cálculo de Jornada</h4>
                <div class="flex justify-between items-center"><h3 class="font-semibold text-slate-300">Jornada Bruta:</h3><p class="font-bold tracking-wider">${formatMinutesToTime(jornadaBrutaTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Breaks:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoBreaksTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Lunch:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoLunchTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Outage:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoOutageTotal)}</p></div>
                ${tiempoReposicionTotal > 0 ? `<div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo Repuesto:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoReposicionTotal)}</p></div>` : ''}
                <hr class="border-slate-700 my-2">
                <div class="flex justify-between items-center text-xl"><h3 class="font-bold text-green-400">Trabajo Neto:</h3><p class="font-bold tracking-wider text-green-400">${formatMinutesToTime(tiempoProductivoTotal)}</p></div>
                ${totalAReponer > 0 ? `<div class="flex justify-between items-center text-xl mt-2 pt-2 border-t border-slate-800">
                        <h3 class="font-bold text-red-400">Total a Reponer:</h3>
                        <p class="font-bold tracking-wider text-red-400">${formatMinutesToTime(totalAReponer)}</p>
                    </div>` : ''}
                ${overbreakTotal > 0 ? `<div class="flex justify-between items-center text-rose-400">
                        <h3 class="font-semibold">Overbreak a reponer:</h3>
                        <div class="text-right"><p class="font-bold tracking-wider">${formatMinutesToTime(overbreakTotal)}</p><div class="details-breakdown">${overbreakDetails.join('<br>')}</div></div>
                    </div>` : ''}
                ${overlunchTotal > 0 ? `<div class="flex justify-between items-center text-rose-400">
                        <h3 class="font-semibold">Overlunch a reponer:</h3>
                        <div class="text-right"><p class="font-bold tracking-wider">${formatMinutesToTime(overlunchTotal)}</p><div class="details-breakdown">${overlunchDetails.join('<br>')}</div></div>
                    </div>` : ''}
                ${tiempoOutageTotal > 0 ? `<div class="flex justify-between items-center text-yellow-300">
                        <h3 class="font-semibold">Outages a reponer:</h3>
                        <div class="text-right"><p class="font-bold tracking-wider">${formatMinutesToTime(tiempoOutageTotal)}</p><div class="details-breakdown">${outageDetails.join('<br>')}</div></div>
                    </div>` : ''}
            </div>`;

        setHour(Math.floor(jornadaStartMins / 60));
    }

    function createEntryHTML(title, type, isDeletable) {
        const deleteButtonHTML = isDeletable ? `<button class="remove-entry-btn" title="Eliminar este bloque" tabindex="-1">&times;</button>` : '';
        const clearButtonHTML = `<button class="clear-entry-btn" title="Borrar horas de este bloque" tabindex="-1">borrar</button>`;
        const labels = type === 'Jornada' ? ['Entrada', 'Salida'] : ['Ida', 'Regreso'];
        return `
            <div class="entry-item p-3 bg-slate-800/50 rounded-lg" data-event-type="${type}" data-event-label="${title}">
                <div class="entry-header">
                    <h4 class="font-semibold text-slate-200">${title}</h4>
                    <div class="header-buttons">
                        ${clearButtonHTML}
                        ${deleteButtonHTML}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">${labels[0]}</label>
                        <div class="ida-container custom-time-input">
                            <div class="split-time-input"><input type="number" class="time-hour" placeholder="HH" min="1" max="12"><span class="separator">:</span><input type="number" class="time-minute" placeholder="MM" min="0" max="59"></div>
                            <div class="ampm-buttons"><button class="am-btn" tabindex="-1">AM</button><button class="pm-btn active" tabindex="-1">PM</button></div>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-400 mb-1">${labels[1]}</label>
                        <div class="regreso-container custom-time-input">
                            <div class="split-time-input"><input type="number" class="time-hour" placeholder="HH" min="1" max="12"><span class="separator">:</span><input type="number" class="time-minute" placeholder="MM" min="0" max="59"></div>
                            <div class="ampm-buttons"><button class="am-btn" tabindex="-1">AM</button><button class="pm-btn active" tabindex="-1">PM</button></div>
                        </div>
                    </div>
                </div>
            </div>`;
    }

    function initCalculator() {
        jornadaContainer.innerHTML = createEntryHTML('Jornada', 'Jornada', false);
        DEFAULT_DESCANSOS.forEach(desc => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createEntryHTML(desc.title, 'Descanso', false);
            descansosContainer.appendChild(tempDiv.firstElementChild);
        });
    }

    timeEntriesContainer.addEventListener('input', e => {
        const input = e.target;
        if (input.matches('.time-hour, .time-minute') && input.value.length > 2) {
            input.value = input.value.slice(0, 2);
        }
        if (input.matches('.time-hour') && input.value.length >= 1) {
            const hourVal = parseInt(input.value);
            if (hourVal > 1 || input.value.length === 2) {
                input.closest('.split-time-input').querySelector('.time-minute').focus();
            }
        }
    });

    timeEntriesContainer.addEventListener('click', e => {
        if (e.target.matches('.am-btn, .pm-btn')) {
            const parent = e.target.parentElement;
            parent.querySelector('.am-btn').classList.remove('active');
            parent.querySelector('.pm-btn').classList.remove('active');
            e.target.classList.add('active');
        }
        if (e.target.matches('.clear-entry-btn')) {
            const entryItem = e.target.closest('.entry-item');
            if (entryItem) {
                entryItem.querySelectorAll('.time-hour, .time-minute').forEach(input => input.value = '');
            }
        }
        if (e.target.matches('.remove-entry-btn')) {
            e.target.closest('.entry-item').remove();
        }
    });

    calcularBtn.addEventListener('click', calcularJornada);

    addOutageBtn.addEventListener('click', () => {
        const count = document.querySelectorAll('.entry-item[data-event-label*="Outage"]').length + 1;
        const title = `Outage ${count}`;
        const newEntryHTML = createEntryHTML(title, 'Descanso', true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newEntryHTML;
        descansosContainer.appendChild(tempDiv.firstElementChild);
    });

    addReposicionBtn.addEventListener('click', () => {
        const count = document.querySelectorAll('.entry-item[data-event-label*="Reposición"]').length + 1;
        const title = `Reposición ${count}`;
        const newEntryHTML = createEntryHTML(title, 'Descanso', true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newEntryHTML;
        descansosContainer.appendChild(tempDiv.firstElementChild);
    });

    initCalculator();
    setupRuler();
    setInitialTime();
});
