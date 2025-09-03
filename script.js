// =====================================================================
// ================= LÓGICA PARA LA REGLA DE TIEMPO ====================
// =====================================================================

const elements = { mainApp: document.getElementById('main-app'), timeRuler: document.getElementById('time-ruler'), marker: document.getElementById('marker'), topLabels: document.getElementById('top-labels'), bottomLabels: document.getElementById('bottom-labels'), ampmSection: document.getElementById('ampm-section'), time12hr: document.getElementById('time-12hr'), time24hr: document.getElementById('time-24hr'), };
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
    const isPM = hourExt >= 12 && hourExt < 24; 
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
    let currentHour = now.getHours(); 
    if (currentHour < 12) {
         currentHour += 24;
    }
    if (currentHour > activeHourRange.end) {
        currentHour = activeHourRange.end;
    }
    if (currentHour < activeHourRange.start) { 
        currentHour = activeHourRange.start; 
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
    const scheduleBar = document.getElementById('schedule-bar');
    const rulerInfoContainer = document.getElementById('ruler-info-container');
    const segmentsContainer = document.getElementById('ruler-segments');
    const employeeNameInput = document.getElementById('employee-name-input');
    const addOutageBtn = document.getElementById('add-outage');
    const addReposicionBtn = document.getElementById('add-reposicion');
    const resultsContainer = document.getElementById('results-container');

    let lastCalculatedEvents = [];
    let isZoomed = false;

    const DEFAULT_DESCANSOS = [
        { title: 'Break 1', label: 'Break', limit: 15 },
        { title: 'Break 2', label: 'Break', limit: 15 },
        { title: 'Lunch', label: 'Lunch', limit: 60 }
    ];

    function updateRulerView(currentHourRange, events) {
        activeHourRange = currentHourRange;
        elements.topLabels.innerHTML = '';
        elements.bottomLabels.innerHTML = '';
        Array.from(elements.timeRuler.children).forEach(child => { if (child.id !== 'marker') child.remove(); });
        
        const totalHours = currentHourRange.end - currentHourRange.start;
        if (totalHours <= 0) return;

        for (let i = 0; i <= totalHours; i++) {
            const actualHour = currentHourRange.start + i;
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

            const bottomLabel = document.createElement('span');
            bottomLabel.className = 'hour-label absolute';
            bottomLabel.style.left = `${positionPercent}%`;
            bottomLabel.dataset.hour = actualHour;
            bottomLabel.addEventListener('click', () => setHour(actualHour));
            let hour12 = actualHour % 12;
            hour12 = hour12 === 0 ? 12 : hour12;
            bottomLabel.textContent = hour12;
            if (actualHour % 3 === 0) bottomLabel.classList.add('font-bold', 'text-white');
            elements.bottomLabels.appendChild(bottomLabel);
        }

        segmentsContainer.innerHTML = '';
        rulerInfoContainer.innerHTML = '';

        function minutesToPercentage(minutes) {
            const rulerStartMins = currentHourRange.start * 60;
            const totalRulerMins = (currentHourRange.end - currentHourRange.start) * 60;
            if (totalRulerMins <= 0) return 0;
            const minutesOnScale = minutes - rulerStartMins;
            const percentage = (minutesOnScale / totalRulerMins) * 100;
            return Math.max(0, Math.min(100, percentage));
        }

        if (!events || events.length === 0) return;
        
        // Ordenar eventos para la visualización
        const typeOrder = { 'work_start': 1, 'break_end': 2, 'break_start': 3, 'work_end': 4 };
        events.sort((a, b) => {
            if (a.minutes !== b.minutes) return a.minutes - b.minutes;
            return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
        });


        for (let i = 0; i < events.length - 1; i++) {
            const startEvent = events[i];
            const endEvent = events[i + 1];

            const durationInMinutes = endEvent.minutes - startEvent.minutes;
            if (durationInMinutes < 0) continue; // Evitar duraciones negativas

            const formattedDuration = formatMinutesToTime(durationInMinutes);
            const startTimeStr = formatMinutesTo12hTime(startEvent.minutes).replace(/<\/?strong>/g, '');
            const endTimeStr = formatMinutesTo12hTime(endEvent.minutes).replace(/<\/?strong>/g, '');
            const startPercentage = minutesToPercentage(startEvent.minutes);
            const widthPercentage = minutesToPercentage(endEvent.minutes) - startPercentage;

            if (widthPercentage > 0.1) {
                const segment = document.createElement('div');
                segment.className = 'absolute top-0 h-full ruler-segment-item';
                segment.style.left = `${startPercentage}%`;
                segment.style.width = `${widthPercentage}%`;

                const legendItem = document.createElement('div');
                legendItem.className = 'flex items-center gap-2 text-xs text-slate-300';
                const colorBox = document.createElement('span');
                colorBox.className = 'block w-3 h-3 rounded-sm';
                const infoText = document.createElement('span');
                let displayLabel = '';
                
                let segmentClass = '';
                const labelLower = startEvent.label.toLowerCase();

                if (startEvent.type === 'work_start' || startEvent.type === 'break_end') {
                    segmentClass = 'work-segment';
                    displayLabel = 'Trabajo';
                } else if (startEvent.type === 'break_start') {
                    displayLabel = startEvent.label;
                    if (labelLower.includes('lunch')) { segmentClass = 'break-segment-lunch'; } 
                    else if (labelLower.includes('reposición')) { segmentClass = 'reposicion-segment'; } 
                    else if (labelLower.includes('outage')) { segmentClass = 'break-segment-outage'; }
                    else if (labelLower.includes('break')) { segmentClass = 'break-segment-break'; }
                }
                
                if(segmentClass) segment.classList.add(segmentClass);
                if(segmentClass) colorBox.classList.add(segmentClass);
                
                infoText.textContent = `${displayLabel}: ${startTimeStr} - ${endTimeStr}`;
                const internalLabel = document.createElement('div');
                internalLabel.className = 'segment-label';
                internalLabel.textContent = formattedDuration;
                segment.appendChild(internalLabel);
                segmentsContainer.appendChild(segment);
                legendItem.appendChild(colorBox);
                legendItem.appendChild(infoText);
                rulerInfoContainer.appendChild(legendItem);
            }
        }
        setHour(parseInt(elements.time24hr.textContent));
    }
    
    function toggleZoom() {
        if (!lastCalculatedEvents || lastCalculatedEvents.length < 2) return;
        isZoomed = !isZoomed;

        const ampmSection = document.getElementById('ampm-section');
        const ampmSectionZoomed = document.getElementById('ampm-section-zoomed');
        
        ampmSection.style.display = isZoomed ? 'none' : 'flex';
        scheduleBar.classList.toggle('expanded', isZoomed);
        
        if (isZoomed) {
            const allMinutes = lastCalculatedEvents.map(e => e.minutes);
            const minMinutes = Math.min(...allMinutes);
            const maxMinutes = Math.max(...allMinutes);
            const zoomStartHour = Math.floor(minMinutes / 60);
            const zoomEndHour = Math.ceil(maxMinutes / 60);

            // Lógica para la barra AM/PM inteligente
            if (zoomStartHour < 24 && zoomEndHour > 24) {
                const totalZoomHours = zoomEndHour - zoomStartHour;
                const pmHoursInZoom = 24 - zoomStartHour;
                const pmPercentage = (pmHoursInZoom / totalZoomHours) * 100;
                const amPercentage = 100 - pmPercentage;
                
                ampmSectionZoomed.innerHTML = `
                    <div class="border-t-2 border-orange-500 text-orange-400" style="width: ${pmPercentage}%">PM</div>
                    <div class="border-t-2 border-rose-500 text-rose-400" style="width: ${amPercentage}%">AM (Extendido)</div>
                `;
                ampmSectionZoomed.style.display = 'flex';
            } else {
                ampmSectionZoomed.style.display = 'none';
            }

            const newRange = { start: zoomStartHour, end: zoomEndHour };
            updateRulerView(newRange, lastCalculatedEvents);
        } else {
            ampmSectionZoomed.style.display = 'none';
            updateRulerView(masterHourRange, lastCalculatedEvents);
        }
    }

    scheduleBar.addEventListener('click', toggleZoom);

    function parse12hToMinutes(hours, minutes, ampm) {
        if (isNaN(hours) || isNaN(minutes)) return null;
        const baseHour = 12; 
        if (ampm === 'pm' && hours < 12) hours += 12; 
        if (ampm === 'am' && hours === 12) hours = 0;
        
        if (ampm === 'am' && hours < baseHour) {
            hours += 24; 
        }
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
        let phrases = [`La jornada de <strong>${employeeName}</strong> inició a las ${formatMinutesTo12hTime(sortedEvents[0].minutes)}.`];

        const breakEvents = sortedEvents.filter(e => e.type === 'break_start');
        
        breakEvents.forEach(startEvent => {
            const endEvent = sortedEvents.find(e => e.type === 'break_end' && e.label === startEvent.label);
            if(endEvent) {
                 let label = startEvent.label.toLowerCase();
                if (label.includes('break 1') || label.includes('break 2')) label = 'un break';
                if (label.includes('reposición')) label = 'una reposición';
                if (label.includes('lunch')) label = 'su lunch';
                if (label.includes('outage')) label = 'un outage';
                phrases.push(`Tomó ${label} a las ${formatMinutesTo12hTime(startEvent.minutes)} y regresó a las ${formatMinutesTo12hTime(endEvent.minutes)}.`);
            }
        });
        
        const endWorkEvent = sortedEvents.find(e => e.type === 'work_end');
        if(endWorkEvent){
            phrases.push(`Finalmente, su jornada terminó a las ${formatMinutesTo12hTime(endWorkEvent.minutes)}.`);
        }
        
        return `<p>${phrases.join(' ')}</p>`;
    }


    function calcularJornada() {
        const employeeName = employeeNameInput.value || 'Empleado';
        let events = [];
        document.querySelectorAll('.entry-item').forEach(item => {
            const idaMins = getMinutesFromCustomInput(item.querySelector('.ida-container'));
            const regresoMins = getMinutesFromCustomInput(item.querySelector('.regreso-container'));
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
            resultsContainer.innerHTML = `<p class="text-center text-red-400">Por favor, ingresa al menos la hora de entrada y salida de la jornada.</p>`;
            return; 
        }

        const jornadaStartEvent = events.find(e => e.type === 'work_start');
        const jornadaEndEvent = events.find(e => e.type === 'work_end');

        if (!jornadaStartEvent || !jornadaEndEvent) {
            resultsContainer.innerHTML = `<p class="text-center text-red-400">Error: No se pudo determinar el inicio o fin de la jornada.</p>`;
            return;
        }

        const jornadaStart = jornadaStartEvent.minutes;
        const jornadaEnd = jornadaEndEvent.minutes;
        const jornadaBrutaTotal = jornadaEnd - jornadaStart;

        let tiempoBreaksTotal = 0, tiempoLunchTotal = 0,
            tiempoOutageTotal = 0, tiempoReposicionTotal = 0,
            overbreakTotal = 0, overlunchTotal = 0,
            totalNonProductiveTime = 0;
        
        let overbreakDetails = [], overlunchDetails = [], outageDetails = [];
        
        const breakStartEvents = events.filter(e => e.type === 'break_start');

        breakStartEvents.forEach(startEvent => {
            const endEvent = events.find(e => e.type === 'break_end' && e.label === startEvent.label && e.minutes >= startEvent.minutes);
            if (endEvent) {
                const breakStartMins = Math.max(startEvent.minutes, jornadaStart);
                const breakEndMins = Math.min(endEvent.minutes, jornadaEnd);
                const duration = breakEndMins - breakStartMins;

                if (duration > 0) {
                    totalNonProductiveTime += duration;
                    const eventLabel = startEvent.label;
                    const labelLower = eventLabel.toLowerCase();

                    if (labelLower.includes('outage')) {
                        tiempoOutageTotal += duration;
                        outageDetails.push(`${eventLabel}: ${duration} min`);
                    } else if (labelLower.includes('reposición')) {
                        tiempoReposicionTotal += duration;
                    } else if (labelLower.includes('break')) {
                        tiempoBreaksTotal += duration;
                        const descInfo = DEFAULT_DESCANSOS.find(d => d.title === eventLabel) || { limit: 15 };
                        if (duration > descInfo.limit) {
                            const individualOvertime = duration - descInfo.limit;
                            overbreakTotal += individualOvertime;
                            overbreakDetails.push(`${eventLabel}: ${individualOvertime} min`);
                        }
                    } else if (labelLower.includes('lunch')) {
                        tiempoLunchTotal += duration;
                        const descInfo = DEFAULT_DESCANSOS.find(d => d.title === eventLabel) || { limit: 60 };
                        if (duration > descInfo.limit) {
                            const individualOvertime = duration - descInfo.limit;
                            overlunchTotal += individualOvertime;
                            overlunchDetails.push(`${eventLabel}: ${individualOvertime} min`);
                        }
                    }
                }
            }
        });

        const tiempoProductivoTotal = jornadaBrutaTotal - totalNonProductiveTime;
        const totalAReponer = overbreakTotal + overlunchTotal + tiempoOutageTotal;
        
        // Ordenar eventos solo para el resumen narrativo
        let sortedEventsForSummary = [...events];
        sortedEventsForSummary.sort((a, b) => a.minutes - b.minutes);
        document.getElementById('summary-container').innerHTML = generarResumenNarrativo(sortedEventsForSummary, employeeName);
        
        resultsContainer.innerHTML = '';
        
        const resultsHTML = `
            <div class="bg-slate-900/50 rounded-lg p-4 space-y-2 border border-slate-700">
                <h4 class="text-lg font-bold text-center text-sky-300 mb-2">Cálculo de Jornada</h4>
                <div class="flex justify-between items-center"><h3 class="font-semibold text-slate-300">Jornada Bruta:</h3><p class="font-bold tracking-wider">${formatMinutesToTime(jornadaBrutaTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Breaks:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoBreaksTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Lunch:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoLunchTotal)}</p></div>
                <div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo de Outage:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoOutageTotal)}</p></div>
                ${tiempoReposicionTotal > 0 ? `<div class="flex justify-between items-center"><h3 class="text-slate-400 pl-4">Tiempo Repuesto:</h3><p class="tracking-wider">${formatMinutesToTime(tiempoReposicionTotal)}</p></div>` : ''}
                <hr class="border-slate-700 my-2">
                <div class="flex justify-between items-center text-xl"><h3 class="font-bold text-green-400">Trabajo Neto:</h3><p class="font-bold tracking-wider text-green-400">${formatMinutesToTime(tiempoProductivoTotal)}</p></div>
                ${totalAReponer > 0 ? `
                    <div class="flex justify-between items-center text-xl mt-2 pt-2 border-t border-slate-800">
                        <h3 class="font-bold text-red-400">Total a Reponer:</h3>
                        <p class="font-bold tracking-wider text-red-400">${formatMinutesToTime(totalAReponer)}</p>
                    </div>` : ''}
                ${overbreakTotal > 0 ? `
                    <div class="flex justify-between items-center text-rose-400">
                        <h3 class="font-semibold">Overbreak a reponer:</h3>
                        <div class="text-right">
                            <p class="font-bold tracking-wider">${formatMinutesToTime(overbreakTotal)}</p>
                            <div class="details-breakdown">${overbreakDetails.join('<br>')}</div>
                        </div>
                    </div>` : ''}
                ${overlunchTotal > 0 ? `
                    <div class="flex justify-between items-center text-rose-400">
                        <h3 class="font-semibold">Overlunch a reponer:</h3>
                        <div class="text-right">
                            <p class="font-bold tracking-wider">${formatMinutesToTime(overlunchTotal)}</p>
                            <div class="details-breakdown">${overlunchDetails.join('<br>')}</div>
                        </div>
                    </div>` : ''}
                ${tiempoOutageTotal > 0 ? `
                    <div class="flex justify-between items-center text-yellow-300">
                        <h3 class="font-semibold">Outages a reponer:</h3>
                        <div class="text-right">
                            <p class="font-bold tracking-wider">${formatMinutesToTime(tiempoOutageTotal)}</p>
                            <div class="details-breakdown">${outageDetails.join('<br>')}</div>
                        </div>
                    </div>` : ''}
            </div>
        `;
        resultsContainer.innerHTML = resultsHTML;

        lastCalculatedEvents = events;
        isZoomed = false;
        scheduleBar.classList.remove('expanded');
        rulerInfoContainer.style.display = 'flex';
        updateRulerView(masterHourRange, events);
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
        if (input.matches('.time-hour') && input.value.length >= 1) { // Focus next on 1 or 2 digits
            const hourVal = parseInt(input.value);
            if(hourVal > 1 || input.value.length === 2) {
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
    const ampmSection = document.getElementById('ampm-section');
    const ampmSectionZoomed = document.getElementById('ampm-section-zoomed');
    const ampmHTML = ` <div class="w-[50%] border-t-2 border-orange-500 text-orange-400">PM</div> <div class="w-[50%] border-t-2 border-rose-500 text-rose-400">AM (Extendido)</div> `;
    ampmSection.innerHTML = ampmHTML;
    ampmSectionZoomed.innerHTML = ampmHTML;
    updateRulerView(masterHourRange, []);
    setInitialTime();
});
// =====================================================================