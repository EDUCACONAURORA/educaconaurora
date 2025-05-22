document.addEventListener('DOMContentLoaded', function() {
    // Variables de estado
    let currentDate = new Date();
    let selectedDate = null;
    let userData = {
        menstruationDays: [],
        dailyRecords: {},
        cycleHistory: []
    };
    let currentUserId = null;
    let cycleChart = null;

    // Elementos del DOM
    const calendarEl = document.getElementById('calendar');
    const currentMonthEl = document.getElementById('current-month');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const selectedDateEl = document.getElementById('selected-date');
    const menstruationCheckbox = document.getElementById('menstruation-checkbox');
    const consecutiveDaysEl = document.getElementById('consecutive-days');
    const predictionTextEl = document.getElementById('prediction-text');
    const fertilityWindowEl = document.getElementById('fertility-window');
    const regularityTextEl = document.getElementById('cycle-regularity');
    const nextPeriodEl = document.getElementById('next-period');
    const lengthTextEl = document.getElementById('cycle-length')
    const cycleChartEl = document.getElementById('cycle-chart');
    const dailyForm = document.getElementById('daily-form');
    const energySlider = document.getElementById('energy-level');
    const energyValue = document.getElementById('energy-value');

    // Inicialización
    checkAuthState();
    renderCalendar();

    // Event listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    menstruationCheckbox.addEventListener('change', function() {
        if (selectedDate) {
            const dateStr = formatDateKey(selectedDate);
            if (this.checked) {
                if (!userData.menstruationDays.includes(dateStr)) {
                    userData.menstruationDays.push(dateStr);
                    saveUserData();
                }
            } else {
                userData.menstruationDays = userData.menstruationDays.filter(d => d !== dateStr);
                saveUserData();
            }
            renderCalendar();
            updateFormForDate(selectedDate);
            updatePredictions();
        }
    });

    dailyForm.addEventListener('submit', function(e) {
        e.preventDefault();
        if (!selectedDate) return;

        const dateStr = formatDateKey(selectedDate);
        const formData = new FormData(dailyForm);

        // Recopilar datos del formulario
        const record = {
            date: dateStr,
            menstruation: formData.get('menstruation') === 'on',
            flow: formData.get('flow'),
            symptoms: Array.from(formData.getAll('symptoms')),
            emotion: formData.get('emotion'),
            energy: parseInt(formData.get('energy')),
            notes: formData.get('notes')
        };

        // Guardar registro
        userData.dailyRecords[dateStr] = record;
        saveUserData();

        // Actualizar UI
        renderCalendar();
        updatePredictions();

        alert('Registro guardado exitosamente');
    });

    energySlider.addEventListener('input', function() {
        energyValue.textContent = this.value;
    });

    // Funciones principales
    function checkAuthState() {
        // Verificar si hay un usuario autenticado
        const user = getCurrentUser();

        if (user) {
            currentUserId = user.id;
            loadUserData();
            document.getElementById('userInfoContainer').style.display = 'flex';
            document.getElementById('userName').textContent = user.name;
            if (user.avatar) {
                document.getElementById('userAvatar').style.backgroundImage = `url(${user.avatar})`;
            }
        } else {
            // Redirigir a login si no hay usuario
            window.location.href = 'login.html';
        }
    }

    function loadUserData() {
        // Cargar datos del usuario desde localStorage
        const savedData = localStorage.getItem(`userData_${currentUserId}`);
        if (savedData) {
            userData = JSON.parse(savedData);
            updateCycleHistory();
        }
    }

    function saveUserData() {
        // Guardar datos del usuario en localStorage
        localStorage.setItem(`userData_${currentUserId}`, JSON.stringify(userData));
        updateCycleHistory();
    }

    function updateCycleHistory() {
        // Ordenar fechas de menstruación
        const sortedDates = userData.menstruationDays
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        // Reiniciar historial
        userData.cycleHistory = [];

        // Calcular duración de cada ciclo completo
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = sortedDates[i - 1];
            const currentDate = sortedDates[i];

            // Solo considerar ciclos con al menos 15 días de diferencia
            const diffDays = Math.round((currentDate - prevDate) / (1000 * 60 * 60 * 24));
            if (diffDays >= 15) {
                userData.cycleHistory.push({
                    startDate: prevDate,
                    endDate: currentDate,
                    length: diffDays
                });
            }
        }

        // Si no hay ciclos completos pero hay al menos 3 días registrados, crear estimación inicial
        if (userData.cycleHistory.length === 0 && userData.menstruationDays.length >= 3) {
            const firstDay = sortedDates[0];
            const lastDay = sortedDates[sortedDates.length - 1];
            const daysBetween = Math.round((lastDay - firstDay) / (1000 * 60 * 60 * 24));
            const estimatedLength = Math.min(35, Math.max(21, daysBetween + 5)); // Entre 21 y 35 días

            userData.cycleHistory.push({
                startDate: firstDay,
                endDate: new Date(firstDay.getTime() + estimatedLength * 24 * 60 * 60 * 1000),
                length: estimatedLength,
                isEstimate: true
            });
        }
    }

    function updateCyclePredictions() {
        const nextPeriod = calculateNextPeriod();
        const fertileWindow = calculateFertileWindow();

        // Actualizar próximo período
        if (nextPeriod) {
            const nextPeriodEl = document.getElementById('next-period');
            if (nextPeriod.confidence === 'high') {
                nextPeriodEl.innerHTML = `
                    <strong>${formatDate(nextPeriod.date)}</strong><br>
                    <small>Basado en ${userData.menstruationDays.length} registros</small>
                `;
            } else {
                nextPeriodEl.innerHTML = `
                    <strong>${formatDate(nextPeriod.date)}</strong><br>
                    <small>Estimación preliminar</small>
                `;
            }
        }

        // Actualizar ventana fértil
        if (fertileWindow) {
            document.getElementById('fertility-window').innerHTML = `
                <strong>${formatDate(fertileWindow.start)} al ${formatDate(fertileWindow.end)}</strong><br>
                <small>Ovulación alrededor del ${formatDate(fertileWindow.ovulation)}</small>
            `;
        }
    }

    function renderCalendar() {
        // Limpiar calendario
        calendarEl.innerHTML = '';
    
        // Configurar mes y año actual
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        currentMonthEl.textContent = `${getMonthName(month)} ${year}`;
    
        // Obtener primer día del mes y cantidad de días
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
    
        // Crear días de la semana
        const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        weekdays.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-weekday';
            dayEl.textContent = day;
            calendarEl.appendChild(dayEl);
        });
    
        // Añadir espacios vacíos para días del mes anterior
        for (let i = 0; i < firstDay.getDay(); i++) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'calendar-day empty';
            calendarEl.appendChild(emptyEl);
        }
    
        // Crear días del mes
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = formatDateKey(date);
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = day;
    
            // Marcar día actual
            if (isToday(date)) {
                dayEl.classList.add('today');
            }
    
            // Marcar días de menstruación
            if (userData.menstruationDays.includes(dateStr)) {
                dayEl.classList.add('menstruation-day');
            }
    
            // Marcar días con registro emocional
            if (userData.dailyRecords[dateStr]) {
                const record = userData.dailyRecords[dateStr];
                if (record.emotion) {
                    dayEl.classList.add(`emotion-${record.emotion}`);
                }
            }
    
            // Marcar ventana fértil y ovulación
            const fertileWindow = calculateFertileWindow();
            if (fertileWindow && date >= fertileWindow.start && date <= fertileWindow.end) {
                dayEl.classList.add('fertile-day');
                
                // Marcar específicamente el día de ovulación
                if (date.toDateString() === fertileWindow.ovulation.toDateString()) {
                    dayEl.classList.add('ovulation-day');
                    dayEl.classList.remove('fertile-day'); // Asegurar que solo tenga la clase de ovulación
                }
            }
    
            // Añadir indicador de fase del ciclo
            const phase = getCyclePhase(date);
            if (phase) {
                dayEl.classList.add(`${phase}-phase`);
            }
    
            // Seleccionar día
            dayEl.addEventListener('click', () => selectDate(date, dayEl));
    
            calendarEl.appendChild(dayEl);
        }
    }

    function selectDate(date, element) {
        // Deseleccionar día anterior
        const prevSelected = document.querySelector('.calendar-day.selected');
        if (prevSelected) prevSelected.classList.remove('selected');

        // Seleccionar nuevo día
        element.classList.add('selected');
        selectedDate = date;
        selectedDateEl.textContent = formatDate(date);

        // Actualizar formulario según el día seleccionado
        updateFormForDate(date);
    }

    function updateFormForDate(date) {
        const dateStr = formatDateKey(date);
        const record = userData.dailyRecords[dateStr] || {};

        // Actualizar sección de ciclo menstrual
        const isMenstruation = userData.menstruationDays.includes(dateStr);
        menstruationCheckbox.checked = isMenstruation;

        if (isMenstruation) {
            const consecutiveDays = calculateConsecutiveDays(date);
            consecutiveDaysEl.textContent = consecutiveDays;
        } else {
            consecutiveDaysEl.textContent = '0';
        }

        // Actualizar flujo menstrual
        if (record.flow) {
            document.querySelector(`input[name="flow"][value="${record.flow}"]`).checked = true;
        } else {
            document.querySelectorAll('input[name="flow"]').forEach(el => el.checked = false);
        }

        // Actualizar síntomas
        document.querySelectorAll('input[name="symptoms"]').forEach(el => {
            el.checked = record.symptoms ? record.symptoms.includes(el.value) : false;
        });

        // Actualizar sección emocional
        if (record.emotion) {
            document.querySelector(`input[name="emotion"][value="${record.emotion}"]`).checked = true;
        } else {
            document.querySelectorAll('input[name="emotion"]').forEach(el => el.checked = false);
        }

        if (record.energy) {
            energySlider.value = record.energy;
            energyValue.textContent = record.energy;
        } else {
            energySlider.value = 5;
            energyValue.textContent = '5';
        }

        // Actualizar notas
        document.getElementById('notes').value = record.notes || '';

        // Actualizar predicciones
        updatePredictions();
    }

    function calculateNextPeriod() {
        const cycles = groupMenstruationDaysIntoCycles();
        if (cycles.length === 0) return null;

        const lastCycle = cycles[cycles.length - 1];
        const lastPeriodStart = lastCycle.startDate;

        // Si solo tenemos un ciclo con varios días
        if (cycles.length === 1) {
            // Usar duración promedio si hay suficientes días registrados
            if (cycles[0].days.length >= 3) {
                const avgCycleLength = 28; // Valor por defecto
                const nextDate = new Date(lastPeriodStart);
                nextDate.setDate(nextDate.getDate() + avgCycleLength);
                return {
                    date: nextDate,
                    confidence: 'medium'
                };
            }
            // Si solo hay pocos días registrados
            const nextDate = new Date(lastPeriodStart);
            nextDate.setDate(nextDate.getDate() + 28); // Usar 28 días como estimación inicial
            return {
                date: nextDate,
                confidence: 'low'
            };
        }

        // Calcular duraciones entre ciclos
        const durations = [];
        for (let i = 1; i < cycles.length; i++) {
            const diff = (cycles[i].startDate - cycles[i-1].startDate) / (1000 * 60 * 60 * 24);
            durations.push(diff);
        }

        // Calcular promedio de duración
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;

        // Calcular próxima fecha
        const nextDate = new Date(lastPeriodStart);
        nextDate.setDate(nextDate.getDate() + avgDuration);

        return {
            date: nextDate,
            confidence: durations.length >= 2 ? 'high' : 'medium'
        };
    }

    function updatePredictions() {
        const cycles = groupMenstruationDaysIntoCycles();

        // Si no hay datos
        if (cycles.length === 0) {
            predictionTextEl.textContent = 'Registra tu primer día de menstruación para comenzar.';
            fertilityWindowEl.textContent = '--';
            regularityTextEl.textContent = '--';
            lengthTextEl.textContent = '--';
            nextPeriodEl.textContent = '--';
            renderEmptyChart();
            return;
        }

        const lastCycle = cycles[cycles.length - 1];
        const nextPeriod = calculateNextPeriod();
        const fertileWindow = calculateFertileWindow();

        // Mostrar información del último ciclo
        const cycleDuration = lastCycle.days.length;
        document.getElementById('menstruation-days-info').innerHTML = `
            <small>Último período: ${formatDate(lastCycle.startDate)} (${cycleDuration} día${cycleDuration > 1 ? 's' : ''})</small>
        `;

        // Actualizar próxima menstruación
        if (nextPeriod) {
            const today = new Date();
            const daysUntilNext = Math.round((nextPeriod.date - today) / (1000 * 60 * 60 * 24));

            let nextPeriodText = `<strong>${formatDate(nextPeriod.date)}</strong>`;
            if (daysUntilNext > 0) {
                nextPeriodText += ` <small>(en ${daysUntilNext} día${daysUntilNext > 1 ? 's' : ''})</small>`;
            } else if (daysUntilNext === 0) {
                nextPeriodText += ` <small>(hoy)</small>`;
            } else {
                nextPeriodText += ` <small>(hace ${-daysUntilNext} día${-daysUntilNext > 1 ? 's' : ''})</small>`;
            }

            if (nextPeriod.confidence === 'low') {
                nextPeriodText += `<br><small>Estimación basada en datos limitados</small>`;
            }

            nextPeriodEl.innerHTML = nextPeriodText;
        } else {
            nextPeriodEl.textContent = '--';
        }

        // Actualizar ventana fértil
        if (fertileWindow) {
            const today = new Date();
            let fertilityText = `<strong>${formatDate(fertileWindow.start)} al ${formatDate(fertileWindow.end)}</strong>`;
            
            // Resaltar si hoy es día de ovulación
            if (today.toDateString() === fertileWindow.ovulation.toDateString()) {
                fertilityText += `<br><small class="highlight">¡Hoy es tu día más fértil (ovulación)!</small>`;
            } 
            // Resaltar si está en ventana fértil
            else if (today >= fertileWindow.start && today <= fertileWindow.end) {
                fertilityText += `<br><small class="highlight">¡Estás en tu ventana fértil ahora!</small>`;
            }
    
            fertilityText += `<br><small>Ovulación: ${formatDate(fertileWindow.ovulation)}</small>`;
    
            if (fertileWindow.basedOn === 'default-value') {
                fertilityText += `<br><small>Estimación basada en ciclo promedio</small>`;
            }
    
            fertilityWindowEl.innerHTML = fertilityText;
        } else {
            fertilityWindowEl.textContent = '--';
        }

        // Actualizar regularidad y duración
        if (cycles.length >= 2) {
            const durations = [];
            for (let i = 1; i < cycles.length; i++) {
                const diff = (cycles[i].startDate - cycles[i-1].startDate) / (1000 * 60 * 60 * 24);
                durations.push(diff);
            }

            const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
            const variability = Math.max(...durations.map(d => Math.abs(d - avgDuration)));

            let regularity;
            if (variability <= 3) regularity = 'Muy regular';
            else if (variability <= 7) regularity = 'Regular';
            else regularity = 'Irregular';

            regularityTextEl.textContent = regularity;
            lengthTextEl.textContent = `${Math.round(avgDuration)} días (promedio)`;
        } else {
            regularityTextEl.textContent = 'Datos insuficientes';
            lengthTextEl.textContent = '28 días (estimado)';
        }

        // Actualizar gráfico y consejos
        updateChartAndTips();
    }

    function groupMenstruationDaysIntoCycles() {
        if (userData.menstruationDays.length === 0) return [];

        // Ordenar fechas y convertir a objetos Date
        const sortedDates = userData.menstruationDays
            .map(d => new Date(d))
            .sort((a, b) => a - b);

        const cycles = [];
        let currentCycle = {
            startDate: sortedDates[0],
            endDate: sortedDates[0],
            days: [sortedDates[0]]
        };

        // Agrupar días consecutivos en ciclos
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currentDate = new Date(sortedDates[i]);
            const diffDays = (currentDate - prevDate) / (1000 * 60 * 60 * 24);

            if (diffDays <= 2) { // Considerar como mismo ciclo si hay ≤2 días de diferencia
                currentCycle.endDate = currentDate;
                currentCycle.days.push(currentDate);
            } else {
                cycles.push(currentCycle);
                currentCycle = {
                    startDate: currentDate,
                    endDate: currentDate,
                    days: [currentDate]
                };
            }
        }

        cycles.push(currentCycle);
        return cycles;
    }

    function getRegularityText(regularity) {
        const texts = {
            'very-regular': 'Muy regular',
            'regular': 'Regular',
            'irregular': 'Irregular',
            'very-irregular': 'Muy irregular',
            'not-enough-data': 'Datos insuficientes'
        };
        return texts[regularity] || '--';
    }

    function getTipsForPhase(phase) {
        const tips = {
            'menstrual': '<p>Descansa y mantente hidratada. Considera usar analgésicos suaves si tienes cólicos.</p>',
            'follicular': '<p>Es un buen momento para actividad física. Tu energía está aumentando.</p>',
            'ovulation': '<p>Días de máxima fertilidad. Puedes notar aumento en tu flujo vaginal.</p>',
            'luteal': '<p>Puedes sentir más hambre. Alimentos ricos en magnesio pueden ayudar.</p>',
            'premenstrual': '<p>Reduce la cafeína y sal para minimizar hinchazón. Descansa lo suficiente.</p>'
        };
        return tips[phase] || '<p>Registra más datos para recibir consejos personalizados.</p>';
    }

    function translatePhase(phase) {
        const phases = {
            'menstrual': 'Menstrual',
            'follicular': 'Folicular',
            'ovulation': 'Ovulación',
            'luteal': 'Lútea',
            'premenstrual': 'Premenstrual'
        };
        return phases[phase] || 'No determinada';
    }

    function calculateFertileWindow() {
        const cycles = groupMenstruationDaysIntoCycles();
        if (cycles.length === 0) return null;

        const lastCycle = cycles[cycles.length - 1];
        const lastPeriodStart = lastCycle.startDate;

        // Determinar duración del ciclo
        let cycleLength = 28; // Valor por defecto

        if (cycles.length >= 2) {
            const prevCycle = cycles[cycles.length - 2];
            cycleLength = (lastCycle.startDate - prevCycle.startDate) / (1000 * 60 * 60 * 24);
        }

        // Calcular ovulación (14 días antes del próximo período)
        const ovulationDay = cycleLength - 14;

        // Calcular ventana fértil (5 días antes y 1 día después de ovulación)
        const fertileStart = new Date(lastPeriodStart);
        fertileStart.setDate(lastPeriodStart.getDate() + (ovulationDay - 5));

        const fertileEnd = new Date(lastPeriodStart);
        fertileEnd.setDate(lastPeriodStart.getDate() + (ovulationDay + 1));

        // Fecha de ovulación
        const ovulationDate = new Date(lastPeriodStart);
        ovulationDate.setDate(lastPeriodStart.getDate() + ovulationDay);

        return {
            start: fertileStart,
            end: fertileEnd,
            ovulation: ovulationDate,
            basedOn: cycleLength === 28 ? 'default-value' : 'user-data'
        };
    }

    function calculateOvulationDay(cycleLength) {
        // Fórmula más precisa basada en investigación clínica
        if (cycleLength <= 25) return 8;
        if (cycleLength <= 28) return 14;
        if (cycleLength <= 32) return 18;
        if (cycleLength <= 35) return 21;
        return cycleLength - 14; // Regla general para ciclos largos
    }

    function checkCycleRegularity() {
        if (userData.cycleHistory.length < 3) return 'not-enough-data';

        const lengths = userData.cycleHistory.map(c => c.length);
        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const differences = lengths.map(l => Math.abs(l - avg));

        // Calcular variabilidad
        const variability = Math.max(...differences);

        if (variability <= 3) return 'very-regular';
        if (variability <= 7) return 'regular';
        if (variability <= 10) return 'irregular';
        return 'very-irregular';
    }

    function renderCycleChart() {
        const ctx = cycleChartEl.getContext('2d');
        const cycleLengths = userData.cycleHistory.map(c => c.length);
        const cycleDates = userData.cycleHistory.map(c => formatShortDate(c.endDate));

        if (cycleChart) {
            cycleChart.destroy();
        }

        cycleChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: cycleDates,
                datasets: [{
                    label: 'Duración del ciclo (días)',
                    data: cycleLengths,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: Math.max(15, Math.min(...cycleLengths) - 5),
                        max: Math.max(...cycleLengths) + 5
                    }
                }
            }
        });

    }

    function renderInitialChart(estimatedLength) {
        const ctx = cycleChartEl.getContext('2d');

        if (cycleChart) {
            cycleChart.destroy();
        }

        cycleChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Ciclo estimado'],
                datasets: [{
                    label: 'Duración estimada (días)',
                    data: [estimatedLength],
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 20,
                        max: 35
                    }
                }
            }
        });
    }

    function updateUIWithPredictions() {
        const nextPeriod = calculateNextPeriod();
        const fertileWindow = calculateFertileWindow();
        const regularity = checkCycleRegularity();

        // Actualizar elementos del DOM
        document.getElementById('cycle-regularity').textContent = 
            getRegularityText(regularity);
        document.getElementById('cycle-length').textContent = 
            `${Math.round(nextPeriod.avgLength)} días (rango ${nextPeriod.minDays}-${nextPeriod.maxDays})`;

        // Mostrar predicciones con rangos
        if (nextPeriod.confidence === 'high') {
            document.getElementById('next-period').innerHTML = `
                <strong>${formatDate(nextPeriod.average)}</strong><br>
                <small>Probable entre ${formatDate(nextPeriod.range.start)} y ${formatDate(nextPeriod.range.end)}</small>
            `;
        } else {
            document.getElementById('next-period').textContent = 
                `Alrededor de ${formatDate(nextPeriod.average)} (estimación preliminar)`;
        }

        // Ventana fértil con día de ovulación
        document.getElementById('fertility-window').innerHTML = `
            <strong>${formatDate(fertileWindow.start)} a ${formatDate(fertileWindow.end)}</strong><br>
            <small>Ovulación probable: ${formatDate(fertileWindow.ovulation)}</small>
        `;

        // Consejos personalizados
        document.getElementById('prediction-text').textContent = 
            getPersonalizedAdvice(regularity, nextPeriod, fertileWindow);
    }

    function renderEmptyChart() {
        const ctx = cycleChartEl.getContext('2d');

        if (cycleChart) {
            cycleChart.destroy();
        }

        cycleChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Duración del ciclo',
                    data: [],
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    function getCyclePhase(date) {
        if (!userData.cycleHistory.length) return null;

        const dateStr = formatDateKey(date);

        // Verificar si es día de menstruación
        if (userData.menstruationDays.includes(dateStr)) {
            return 'menstrual';
        }

        // Encontrar el ciclo más reciente antes de esta fecha
        let lastCycle = null;
        for (let i = userData.cycleHistory.length - 1; i >= 0; i--) {
            if (new Date(userData.cycleHistory[i].endDate) < date) {
                lastCycle = userData.cycleHistory[i];
                break;
            }
        }

        if (!lastCycle) return null;

        // Calcular días desde el último período
        const daysSincePeriod = Math.round((date - new Date(lastCycle.endDate)) / (1000 * 60 * 60 * 24));
        const cycleLength = lastCycle.length;

        // Determinar fase
        if (daysSincePeriod <= 5) {
            return 'menstrual';
        } else if (daysSincePeriod <= 14) {
            return 'follicular';
        } else if (daysSincePeriod <= 17) {
            return 'ovulation';
        } else if (daysSincePeriod <= (cycleLength - 5)) {
            return 'luteal';
        } else {
            return 'premenstrual';
        }
    }

    // Funciones auxiliares
    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }

    function calculateConsecutiveDays(date) {
        const dateStr = formatDateKey(date);
        if (!userData.menstruationDays.includes(dateStr)) return 0;

        const dateObj = new Date(dateStr);
        let count = 1;

        // Verificar días anteriores
        let prevDay = new Date(dateObj);
        prevDay.setDate(dateObj.getDate() - 1);

        while (userData.menstruationDays.includes(formatDateKey(prevDay))) {
            count++;
            prevDay.setDate(prevDay.getDate() - 1);
        }

        // Verificar días posteriores
        let nextDay = new Date(dateObj);
        nextDay.setDate(dateObj.getDate() + 1);

        while (userData.menstruationDays.includes(formatDateKey(nextDay))) {
            count++;
            nextDay.setDate(nextDay.getDate() + 1);
        }

        return count;
    }

    function formatDate(date) {
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatShortDate(date) {
        const options = { day: 'numeric', month: 'short' };
        return date.toLocaleDateString('es-ES', options);
    }

    function formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    function getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    }

    // Función simulada - debería ser reemplazada por tu sistema de autenticación real
    function getCurrentUser() {
        // En una aplicación real, esto vendría de tu sistema de autenticación
        const userJson = localStorage.getItem('currentUser');
        if (userJson) {
            return JSON.parse(userJson);
        }
        return null;
    }
});

