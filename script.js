// =====================================================================
// ================= LÓGICA PARA LA REGLA DE TIEMPO ====================
// =====================================================================

const elements = { mainApp: document.getElementById('main-app'), timeRuler: document.getElementById('time-ruler'), marker: document.getElementById('marker'), topLabels: document.getElementById('top-labels'), bottomLabels: document.getElementById('bottom-labels'), ampmSection: document.getElementById('ampm-section'), time12hr: document.getElementById('time-12hr'), time24hr: document.getElementById('time-24hr'), };
let isDragging = false; const hourRange = { start: 12, end: 32 };
function setHour(hour) { const totalHours = hourRange.end - hourRange.start; const hourInScale = hour - hourRange.start; const snappedPercentage = totalHours > 0 ? (hourInScale / totalHours) * 100 : 0; elements.marker.style.left = `${snappedPercentage}%`; updateClocks(hour); highlightLabels(hour); }
function createRulerElements() { elements.topLabels.innerHTML = ''; elements.bottomLabels.innerHTML = ''; elements.ampmSection.innerHTML = ''; Array.from(elements.timeRuler.children).forEach(child => { if (child.id !== 'marker') child.remove(); }); const totalHours = hourRange.end - hourRange.start; for (let i = 0; i <= totalHours; i++) { const actualHour = hourRange.start + i; const positionPercent = totalHours > 0 ? (i / totalHours) * 100 : 0; const tick = document.createElement('div'); tick.className = 'tick-mark'; if (actualHour % 3 === 0) tick.classList.add('major'); tick.style.left = `${positionPercent}%`; elements.timeRuler.appendChild(tick); const topLabel = document.createElement('span'); topLabel.className = 'hour-label absolute'; topLabel.style.left = `${positionPercent}%`; topLabel.textContent = actualHour; topLabel.dataset.hour = actualHour; topLabel.addEventListener('click', () => setHour(actualHour)); if (actualHour % 3 === 0) { topLabel.classList.add('font-bold', 'text-white'); } elements.topLabels.appendChild(topLabel); const bottomLabel = document.createElement('span'); bottomLabel.className = 'hour-label absolute'; bottomLabel.style.left = `${positionPercent}%`; bottomLabel.dataset.hour = actualHour; bottomLabel.addEventListener('click', () => setHour(actualHour)); let hour12 = actualHour % 12; hour12 = hour12 === 0 ? 12 : hour12; bottomLabel.textContent = hour12; if (actualHour % 3 === 0) { bottomLabel.classList.add('font-bold', 'text-white'); } elements.bottomLabels.appendChild(bottomLabel); } elements.ampmSection.innerHTML = ` <div class="w-[60%] border-t-2 border-orange-500 text-orange-400">PM</div> <div class="w-[40%] border-t-2 border-rose-500 text-rose-400">AM (Extendido)</div> `; }
function updateClocks(hourExt) { elements.time24hr.textContent = hourExt; const isPM = hourExt >= 12 && hourExt < 24; const ampm = isPM ? 'PM' : 'AM'; let hour12 = hourExt % 12; hour12 = hour12 ? hour12 : 12; elements.time12hr.textContent = `${hour12} ${ampm}`; }
function highlightLabels(hour) { document.querySelectorAll('.hour-label').forEach(l => l.classList.remove('highlighted')); document.querySelectorAll(`.hour-label[data-hour="${hour}"]`).forEach(l => l.classList.add('highlighted')); }
function updatePosition(clientX) { const rulerRect = elements.timeRuler.getBoundingClientRect(); let x = clientX - rulerRect.left; if (x < 0) x = 0; if (x > rulerRect.width) x = rulerRect.width; const percentage = x / rulerRect.width; const totalHours = hourRange.end - hourRange.start; const closestHourInScale = Math.round(percentage * totalHours); const closestActualHour = hourRange.start + closestHourInScale; setHour(closestActualHour); }
function setInitialTime() { const now = new Date(); let currentHour = now.getHours(); if (currentHour < hourRange.start) { currentHour = hourRange.start; } setHour(currentHour); }
function startDrag(e) { isDragging = true; updatePosition(e.touches ? e.touches[0].clientX : e.clientX); }
function onDrag(e) { if (isDragging) { e.preventDefault(); updatePosition(e.touches ? e.touches[0].clientX : e.clientX); } }
function endDrag() { isDragging = false; }
elements.timeRuler.addEventListener('mousedown', startDrag); document.addEventListener('mousemove', onDrag); document.addEventListener('mouseup', endDrag); elements.timeRuler.addEventListener('touchstart', startDrag); document.addEventListener('touchmove', onDrag); document.addEventListener('touchend', endDrag);
window.addEventListener('resize', () => { const currentHourStr = document.querySelector('.hour-label.highlighted')?.dataset.hour; const currentHour = currentHourStr ? parseInt(currentHourStr, 10) : hourRange.start; createRulerElements(); setHour(currentHour); });
function initRuler() { createRulerElements(); setInitialTime(); }
initRuler();

// =====================================================================
// =========== LÓGICA PARA LA CALCULADORA DE HORAS (FINAL) =============
// =====================================================================

document.addEventListener('DOMContentLoaded', () => {
    const calcularBtn = document.getElementById('calcular');
    const addDescansoBtn = document.getElementById('add-descanso');
    const jornadaContainer = document.getElementById('jornada-container');
    const descansosContainer = document.getElementById('descansos-container');
    const timeEntriesContainer = document.getElementById('time-entries-container');

    const DEFAULT_DESCANSOS = [
        { title: 'Break 1', label: 'Break' },
        { title: 'Break 2', label: 'Break' },
        { title: 'Lunch', label: 'Lunch' },
        { title: 'Outage', label: 'Outage' }
    ];

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
        hours = hours ? hours : 12;
        return `<strong>${hours}:${String(minutes).padStart(2, '0')} ${ampm}</strong>`;
    }

    function generarResumenNarrativo(sortedEvents) {
        if (sortedEvents.length < 2) return "";
        let phrases = [`El empleado inició su jornada a las ${formatMinutesTo12hTime(sortedEvents[0].minutes)}.`];
        sortedEvents.forEach(event => {
            let label = event.label.toLowerCase();
            if (label.includes('break')) label = 'un break';
            switch (event.type) {
                case 'break_start': phrases.push(`Tomó ${label} a las ${formatMinutesTo12hTime(event.minutes)}`); break;
                case 'break_end': phrases.push(`y regresó a las ${formatMinutesTo12hTime(event.minutes)}.`); break;
                case 'work_end': phrases.push(`Finalmente, su jornada terminó a las ${formatMinutesTo12hTime(event.minutes)}.`); break;
            }
        });
        return `<p>${phrases.join(' ').replace(/\. T/g, ', t')}</p>`;
    }

    function calcularJornada() {
        const events = [];
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
        if (events.length < 2) { alert("Por favor, ingresa al menos la hora de entrada y salida."); return; }
        events.sort((a, b) => a.minutes - b.minutes);
        let tiempoProductivoTotal = 0, tiempoDescansoTotal = 0;
        let breakdownHtml = '<h4>Desglose de la Jornada</h4><ul>';
        for (let i = 0; i < events.length - 1; i++) {
            const duration = events[i+1].minutes - events[i].minutes;
            if (events[i].type === 'work_start' || events[i].type === 'break_end') {
                tiempoProductivoTotal += duration;
                breakdownHtml += `<li><span>Bloque de Trabajo</span> <span class="duration">${formatMinutesToTime(duration)}</span></li>`;
            } else if (events[i].type === 'break_start') {
                tiempoDescansoTotal += duration;
                breakdownHtml += `<li><span>${events[i].label}</span> <span class="duration">${formatMinutesToTime(duration)}</span></li>`;
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
        if (input.matches('.time-hour') && input.value.length >= 2) {
            input.closest('.split-time-input').querySelector('.time-minute').focus();
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
    addDescansoBtn.addEventListener('click', () => {
        const count = document.querySelectorAll('.entry-item[data-event-type="Descanso"]').length - DEFAULT_DESCANSOS.length + 1;
        const title = `Descanso Extra ${count}`;
        const newEntryHTML = createEntryHTML(title, 'Descanso', true);
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newEntryHTML;
        descansosContainer.appendChild(tempDiv.firstElementChild);
    });

    initCalculator();
});