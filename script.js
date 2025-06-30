document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos de login
    const loginScreen = document.getElementById('login-screen');
    const usernameInput = document.getElementById('username-input');
    const loginButton = document.getElementById('login-button');
    const mainApp = document.getElementById('main-app');

    const calendarEl = document.getElementById('calendar');
    const selectedDateEl = document.getElementById('selected-date');
    const codesForDateDisplay = document.getElementById('codes-for-date-display');
    const codeOptionsEl = document.getElementById('code-options');
    const newCodeInput = document.getElementById('new-code-input');
    const addCodeButton = document.getElementById('add-code-button');
    const dailyCodesList = document.getElementById('daily-codes-list');
    const saveDailyCodesButton = document.getElementById('save-daily-codes');
    const exportExcelButton = document.getElementById('export-excel');

    // Referencias a los campos de entrada
    const legajoDisplay = document.getElementById('legajo-display');
    const horaIniInput = document.getElementById('hora-ini-input');
    const horaFinInput = document.getElementById('hora-fin-input');
    const importeInput = document.getElementById('importe-input');

    // --- NUEVAS REFERENCIAS PARA EL SELECTOR DE MES ---
    const prevYearButton = document.getElementById('prev-year-button');
    const prevMonthButton = document.getElementById('prev-month-button');
    const currentMonthYearSpan = document.getElementById('current-month-year');
    const nextMonthButton = document.getElementById('next-month-button');
    const nextYearButton = document.getElementById('next-year-button');
    const monthGrid = document.getElementById('month-grid');
    // --- FIN NUEVAS REFERENCIAS ---

    // --- NUEVA REFERENCIA PARA EL TOGGLE DE TEMA ---
    const themeToggle = document.getElementById('theme-toggle');
    // --- FIN NUEVA REFERENCIA ---

    let currentSelectedDate = null;
    let selectedMonthYearDate = new Date(); // Objeto Date para el mes y año que se muestra en el selector
    let currentUser = localStorage.getItem('currentUser');

    let dailyData = JSON.parse(localStorage.getItem('dailyData')) || {};

    let availableCodes = new Set(JSON.parse(localStorage.getItem('availableCodes')) || [
        'AR0512 Adicional GP 24hs',
        'AR0510 Adicional GP16hs',
        'AR0488 Adicional manejo',
        'AR0484 Adicional ascenso a torre'
    ]);

    // --- Theme Toggle Functions ---
    function applyTheme(isDarkMode) {
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }

    function loadThemePreference() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        themeToggle.checked = isDarkMode;
        applyTheme(isDarkMode);
    }

    function toggleTheme() {
        const isDarkMode = themeToggle.checked;
        localStorage.setItem('darkMode', isDarkMode);
        applyTheme(isDarkMode);
    }

    // --- Login Functions ---
    function checkLogin() {
        if (currentUser) {
            usernameInput.value = currentUser;
            loginScreen.classList.add('hidden');
            mainApp.classList.remove('hidden');
            initializeApp();
        } else {
            loginScreen.classList.remove('hidden');
            mainApp.classList.add('hidden');
        }
    }

    function handleLogin() {
        const username = usernameInput.value.trim();
        if (username) {
            currentUser = username;
            localStorage.setItem('currentUser', currentUser);
            checkLogin();
        } else {
            alert('Por favor, ingresa tu nombre de usuario.');
        }
    }

    // --- App Initialization ---
    function initializeApp() {
        // Establece el mes actual para el mini-calendario de meses
        selectedMonthYearDate = new Date(); // Establece al mes actual (ej. 2025-06)
        
        legajoDisplay.textContent = currentUser;

        renderMonthSelector(); // Renderiza el selector de meses
        renderCalendar(selectedMonthYearDate.getFullYear(), selectedMonthYearDate.getMonth()); // Renderiza el calendario de días del mes actual
        renderCodeOptions();
        loadThemePreference(); // Load theme preference on app initialization
    }

    // --- NUEVAS FUNCIONES PARA EL SELECTOR DE MES ---
    function renderMonthSelector() {
        currentMonthYearSpan.textContent = selectedMonthYearDate.getFullYear();
        monthGrid.innerHTML = ''; // Limpia los meses anteriores

        const monthNames = [
            'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
            'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
        ];

        monthNames.forEach((name, index) => {
            const monthCell = document.createElement('div');
            monthCell.classList.add('month-cell');
            monthCell.textContent = name;
            monthCell.dataset.monthIndex = index; // 0-indexed month

            // Comprueba si este mes es el actualmente seleccionado para el calendario de días
            const currentCalendarMonth = new Date(selectedMonthYearDate.getFullYear(), selectedMonthYearDate.getMonth(), 1);
            const thisMonth = new Date(selectedMonthYearDate.getFullYear(), index, 1);

            if (currentCalendarMonth.getFullYear() === thisMonth.getFullYear() && currentCalendarMonth.getMonth() === thisMonth.getMonth()) {
                monthCell.classList.add('selected-month');
            }

            monthCell.addEventListener('click', () => selectNewMonth(index));
            monthGrid.appendChild(monthCell);
        });
    }

    function selectNewMonth(monthIndex) {
        // Guarda los datos del día actualmente seleccionado antes de cambiar el mes
        if (currentSelectedDate) {
            saveDailyData();
        }

        // Actualiza el objeto Date del selector de meses
        selectedMonthYearDate.setMonth(monthIndex);
        
        // Re-renderiza el selector de meses para actualizar el resaltado
        renderMonthSelector();

        // Obtiene el año y mes para el calendario de días
        const year = selectedMonthYearDate.getFullYear();
        const month = selectedMonthYearDate.getMonth(); // 0-indexed

        // Actualiza la variable selectedMonth (formato YYYY-MM para la exportación)
        const newSelectedMonthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        // IMPORTANTE: actualiza la variable `selectedMonth` que usa `exportToExcel`
        // (Nota: `selectedMonth` no está definida globalmente, se usa dentro de `exportToExcel` con el objeto `selectedMonthYearDate`.)
        // Si necesitaras esta variable globalmente fuera de exportToExcel, deberías definirla.

        // Renderiza el calendario de días para el nuevo mes
        renderCalendar(year, month);
        
        // Limpiar la selección de día y los campos de entrada
        currentSelectedDate = null;
        selectedDateEl.textContent = 'Ninguno';
        codesForDateDisplay.textContent = '';
        dailyCodesList.innerHTML = '';
        horaIniInput.value = '';
        horaFinInput.value = '';
        importeInput.value = ''; // Limpiar el importe también

        renderCodeOptions(); // Refresh code options (no daily codes selected yet)
    }

    function navigateYear(delta) {
        // Guarda los datos del día actualmente seleccionado antes de cambiar el mes
        if (currentSelectedDate) {
            saveDailyData();
        }

        selectedMonthYearDate.setFullYear(selectedMonthYearDate.getFullYear() + delta);
        renderMonthSelector();
        // Al cambiar de año, por defecto se mantiene el mismo mes si es posible,
        // así que también renderizamos el calendario de días para el mes actual del nuevo año
        selectNewMonth(selectedMonthYearDate.getMonth()); 
    }

    function navigateMonth(delta) {
        // Guarda los datos del día actualmente seleccionado antes de cambiar el mes
        if (currentSelectedDate) {
            saveDailyData();
        }

        selectedMonthYearDate.setMonth(selectedMonthYearDate.getMonth() + delta);
        renderMonthSelector();
        // Al cambiar de mes con los botones, directamente selecciona el nuevo mes
        selectNewMonth(selectedMonthYearDate.getMonth());
    }
    // --- FIN NUEVAS FUNCIONES PARA EL SELECTOR DE MES ---


    // --- Calendar Functions ---

    function renderCalendar(year, month) {
        calendarEl.innerHTML = '';
        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.classList.add('day-header');
            dayHeader.textContent = day;
            calendarEl.appendChild(dayHeader);
        });

        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 (Domingo) a 6 (Sábado)
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'empty');
            calendarEl.appendChild(emptyDay);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day');
            dayEl.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            // Determinar si es sábado (6) o domingo (0)
            const currentDayOfWeek = new Date(year, month, i).getDay();
            if (currentDayOfWeek === 0 || currentDayOfWeek === 6) {
                dayEl.classList.add('weekend'); // Agrega la clase 'weekend'
            }

            const dayNumberEl = document.createElement('div');
            dayNumberEl.classList.add('day-number');
            dayNumberEl.textContent = i;
            dayEl.appendChild(dayNumberEl);

            const fullDate = dayEl.dataset.date;
            if (dailyData[fullDate] && dailyData[fullDate].codes && dailyData[fullDate].codes.length > 0) {
                const codeCountEl = document.createElement('div');
                codeCountEl.classList.add('code-count');
                codeCountEl.textContent = `${dailyData[fullDate].codes.length} códigos`;
                dayEl.appendChild(codeCountEl);
            }

            dayEl.addEventListener('click', () => selectDate(dayEl.dataset.date));
            calendarEl.appendChild(dayEl);

            if (dayEl.dataset.date === currentSelectedDate) {
                dayEl.classList.add('selected');
            }
        }
    }

    function selectDate(date) {
        if (currentSelectedDate) {
            saveDailyData();
        }

        // Remover la clase 'selected' del día previamente seleccionado
        const prevSelectedEl = document.querySelector(`.day.selected`);
        if (prevSelectedEl) {
            prevSelectedEl.classList.remove('selected');
        }

        currentSelectedDate = date;
        selectedDateEl.textContent = date;
        codesForDateDisplay.textContent = date;

        // Añadir la clase 'selected' al nuevo día seleccionado
        const newSelectedEl = document.querySelector(`.day[data-date="${currentSelectedDate}"]`);
        if (newSelectedEl) {
            newSelectedEl.classList.add('selected');
        }

        const dataForSelectedDay = dailyData[currentSelectedDate] || { legajo: currentUser, horaIni: '', horaFin: '', importe: '', codes: [] };
        horaIniInput.value = dataForSelectedDay.horaIni || '';
        horaFinInput.value = dataForSelectedDay.horaFin || '';
        importeInput.value = dataForSelectedDay.importe || '';
        

        renderDailyCodes();
        renderCodeOptions();
    }

    // --- Code Management Functions ---

    function renderCodeOptions() {
        codeOptionsEl.innerHTML = '';
        const codesForCurrentDay = (dailyData[currentSelectedDate] && dailyData[currentSelectedDate].codes) || [];

        availableCodes.forEach(code => {
            const codeOption = document.createElement('div');
            codeOption.classList.add('code-option');
            codeOption.textContent = code;
            codeOption.dataset.code = code;

            if (codesForCurrentDay.includes(code)) {
                codeOption.classList.add('selected');
            }

            codeOption.addEventListener('click', () => toggleCodeSelection(code));
            codeOptionsEl.appendChild(codeOption);
        });
    }

    function toggleCodeSelection(code) {
        if (!currentSelectedDate) {
            alert('Por favor, selecciona un día en el calendario primero.');
            return;
        }

        if (!dailyData[currentSelectedDate]) {
            dailyData[currentSelectedDate] = { legajo: currentUser, horaIni: '', horaFin: '', importe: '', codes: [] };
        }
        if (!dailyData[currentSelectedDate].codes) {
            dailyData[currentSelectedDate].codes = [];
        }

        const index = dailyData[currentSelectedDate].codes.indexOf(code);
        if (index > -1) {
            dailyData[currentSelectedDate].codes.splice(index, 1);
        } else {
            dailyData[currentSelectedDate].codes.push(code);
        }

        saveDailyData();
        renderDailyCodes();
        renderCodeOptions();
        updateCalendarDayCodeCount(currentSelectedDate);
    }

    function addCode() {
        const newCode = newCodeInput.value.trim();
        if (newCode && !availableCodes.has(newCode)) {
            availableCodes.add(newCode);
            localStorage.setItem('availableCodes', JSON.stringify(Array.from(availableCodes)));
            newCodeInput.value = '';
            renderCodeOptions();
        } else if (availableCodes.has(newCode)) {
            alert('Este código ya existe.');
        }
    }

    function renderDailyCodes() {
        dailyCodesList.innerHTML = '';
        const codes = (dailyData[currentSelectedDate] && dailyData[currentSelectedDate].codes) || [];
        if (codes.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No hay códigos registrados para este día.';
            dailyCodesList.appendChild(li);
            return;
        }

        codes.forEach(code => {
            const li = document.createElement('li');
            li.textContent = code;
            const removeButton = document.createElement('button');
            removeButton.classList.add('remove-code');
            removeButton.textContent = 'x';
            removeButton.title = 'Eliminar código del día';
            removeButton.addEventListener('click', () => removeCodeFromDailyList(code));
            li.appendChild(removeButton);
            dailyCodesList.appendChild(li);
        });
    }

    function removeCodeFromDailyList(codeToRemove) {
        if (!currentSelectedDate || !dailyData[currentSelectedDate] || !dailyData[currentSelectedDate].codes) {
            return;
        }
        dailyData[currentSelectedDate].codes = dailyData[currentSelectedDate].codes.filter(code => code !== codeToRemove);
        saveDailyData();
        renderDailyCodes();
        renderCodeOptions();
        updateCalendarDayCodeCount(currentSelectedDate);
    }

    function updateCalendarDayCodeCount(date) {
        const dayEl = document.querySelector(`.day[data-date="${date}"]`);
        if (dayEl) {
            let codeCountEl = dayEl.querySelector('.code-count');
            const codes = (dailyData[date] && dailyData[date].codes) || [];
            if (codes.length > 0) {
                if (!codeCountEl) {
                    codeCountEl = document.createElement('div');
                    codeCountEl.classList.add('code-count');
                    dayEl.appendChild(codeCountEl);
                }
                codeCountEl.textContent = `${codes.length} códigos`;
            } else {
                if (codeCountEl) {
                    codeCountEl.remove();
                }
            }
        }
    }

    function saveDailyData() {
        if (!currentSelectedDate) return;

        dailyData[currentSelectedDate] = {
            legajo: currentUser,
            horaIni: horaIniInput.value.trim(),
            horaFin: horaFinInput.value.trim(),
            importe: importeInput.value.trim(), // Save importe
            codes: (dailyData[currentSelectedDate] && dailyData[currentSelectedDate].codes) || []
        };
        localStorage.setItem('dailyData', JSON.stringify(dailyData));
    }


    // --- Export to Excel ---
    function exportToExcel() {
        if (currentSelectedDate) {
            saveDailyData();
        }

        // Usa selectedMonthYearDate para obtener el año y mes para el string YYYY-MM
        const year = selectedMonthYearDate.getFullYear();
        const month = String(selectedMonthYearDate.getMonth() + 1).padStart(2, '0');
        const monthForExport = `${year}-${month}`; // Este es el YYYY-MM que necesitamos
        
        const monthName = new Date(year, selectedMonthYearDate.getMonth(), 1).toLocaleString('es', { month: 'long', year: 'numeric' });
        
        const headers = [
            'Legajo',
            'Fecha',
            'Tipo',
            'Motivo',
            'Hora Ini',
            'Hora Fin',
            'Hora Ini (Tarde)',
            'Hora Fin (Tarde)',
            'Cantidad',
            'Importe',
            'Justificacion'
        ];

        const dataForMonth = [];

        // Filtra por el `monthForExport` que hemos calculado
        const sortedDates = Object.keys(dailyData).filter(date => date.startsWith(monthForExport)).sort();

        sortedDates.forEach(date => {
            const dayInfo = dailyData[date];
            if (dayInfo && dayInfo.codes && dayInfo.codes.length > 0) {
                dayInfo.codes.forEach(fullCode => {
                    let codePart = fullCode;
                    let descriptionPart = '';
                    const firstSpaceIndex = fullCode.indexOf(' ');
                    if (firstSpaceIndex !== -1) {
                        codePart = fullCode.substring(0, firstSpaceIndex);
                        descriptionPart = fullCode.substring(firstSpaceIndex + 1);
                    }

                    const row = {
                        'Legajo': dayInfo.legajo || '',
                        'Fecha': date,
                        'Tipo': codePart,
                        'Motivo': 'NA',
                        'Hora Ini': dayInfo.horaIni || '',
                        'Hora Fin': dayInfo.horaFin || '',
                        'Hora Ini (Tarde)': '',
                        'Hora Fin (Tarde)': '',
                        'Cantidad': 1,
                        'Importe': dayInfo.importe || '', // Include importe here
                        'Justificacion': descriptionPart
                    };
                    dataForMonth.push(row);
                });
            }
        });

        if (dataForMonth.length === 0) {
            alert('No hay códigos registrados para este mes para exportar.');
            return;
        }

        dataForMonth.sort((a, b) => {
            const codeA = a['Tipo'].toUpperCase();
            const codeB = b['Tipo'].toUpperCase();
            if (codeA < codeB) {
                return -1;
            }
            if (codeA > codeB) {
                return 1;
            }
            return 0;
        });

        const ws = XLSX.utils.json_to_sheet(dataForMonth, { header: headers });

        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (!ws[cell_address]) continue;

            if (!ws[cell_address].s) ws[cell_address].s = {};
            
            ws[cell_address].s.fill = { fgColor: { rgb: "ADD8E6" } };
            ws[cell_address].s.font = { color: { rgb: "000000" } };
            ws[cell_address].s.font.bold = true;
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Reporte Mensual");
        XLSX.writeFile(wb, `Reporte_Codigos_${monthName.replace(' ', '_')}.xlsx`);
    }

    // --- Event Listeners ---
    loginButton.addEventListener('click', handleLogin);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });

    // --- NUEVOS EVENT LISTENERS PARA EL SELECTOR DE MES ---
    prevYearButton.addEventListener('click', () => navigateYear(-1));
    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    nextYearButton.addEventListener('click', () => navigateYear(1));
    // --- FIN NUEVOS EVENT LISTENERS ---

    // --- EVENT LISTENER PARA EL TOGGLE DE TEMA ---
    themeToggle.addEventListener('change', toggleTheme);
    // --- FIN EVENT LISTENER ---

    addCodeButton.addEventListener('click', addCode);
    newCodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCode();
        }
    });

    horaIniInput.addEventListener('change', saveDailyData);
    horaFinInput.addEventListener('change', saveDailyData);
    importeInput.addEventListener('change', saveDailyData); // Add event listener for importe

    saveDailyCodesButton.addEventListener('click', () => {
        if (currentSelectedDate) {
            saveDailyData();
            alert(`Códigos y datos para el ${currentSelectedDate} guardados correctamente.`);
            // Re-render calendar only for the currently selected month in the month selector
            renderCalendar(selectedMonthYearDate.getFullYear(), selectedMonthYearDate.getMonth());
        } else {
            alert('Por favor, selecciona un día para guardar los códigos y datos.');
        }
    });

    exportExcelButton.addEventListener('click', exportToExcel);

    checkLogin();
});
