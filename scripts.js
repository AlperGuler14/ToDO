// Varsayılan tarihi ayarla (bugün + 3 gün)
const today = new Date();
const defaultDate = new Date();
defaultDate.setDate(today.getDate() + 3);

document.getElementById('taskDueDate').valueAsDate = defaultDate;
document.getElementById('currentDate').textContent = today.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
});

// DOM Elementleri
const taskTitle = document.getElementById('taskTitle');
const taskDescription = document.getElementById('taskDescription');
const taskDueDate = document.getElementById('taskDueDate');
const addButton = document.getElementById('addButton');
const taskList = document.getElementById('taskList');
const priorityOptions = document.querySelectorAll('.priority-option');
const newSubtaskInput = document.getElementById('newSubtask');
const addSubtaskBtn = document.getElementById('addSubtaskBtn');
const formSubtaskList = document.getElementById('formSubtaskList');
const timerButton = document.getElementById('timerButton');
const backButton = document.getElementById('backButton');
const todoPage = document.getElementById('todoPage');
const timerPage = document.getElementById('timerPage');
const todoContainer = document.getElementById('todoContainer');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimer');
const pauseTimerBtn = document.getElementById('pauseTimer');
const resetTimerBtn = document.getElementById('resetTimer');
const taskSelector = document.getElementById('taskSelector');
const workMinutesInput = document.getElementById('workMinutes');
const breakMinutesInput = document.getElementById('breakMinutes');
const presetButtons = document.querySelectorAll('.preset-btn');
const timerModeText = document.getElementById('timerMode');

let currentPriority = 'medium';
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let formSubtasks = []; // Formdaki geçici alt görevler

// Timer değişkenleri
let timerInterval;
let timeLeft = 25 * 60; // 25 dakika (saniye cinsinden)
let isRunning = false;
let isWorkTime = true;
let workDuration = 25; // dakika
let breakDuration = 5; // dakika

// Sayfa geçişleri
timerButton.addEventListener('click', () => {
    // To-Do sayfasını kaydır
    todoPage.classList.add('hidden');
    todoContainer.classList.add('slide-down');

    // Timer sayfasını göster
    timerPage.classList.remove('hidden');

    // Görev seçiciyi güncelle
    updateTaskSelector();
});

backButton.addEventListener('click', () => {
    // Timer sayfasını gizle
    timerPage.classList.add('hidden');

    // To-Do sayfasını göster
    todoPage.classList.remove('hidden');
    todoContainer.classList.remove('slide-down');
});

// Preset buton eventleri
presetButtons.forEach(button => {
    button.addEventListener('click', () => {
        const work = parseInt(button.dataset.work);
        const brk = parseInt(button.dataset.break);

        workMinutesInput.value = work;
        breakMinutesInput.value = brk;
        workDuration = work;
        breakDuration = brk;

        presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        if (!isRunning) {
            resetTimer();
        }
    });
});

// Süre ayarları değiştiğinde
workMinutesInput.addEventListener('change', function () {
    workDuration = parseInt(this.value) || 25;
    if (!isRunning && isWorkTime) {
        timeLeft = workDuration * 60;
        updateTimerDisplay();
    }
});

breakMinutesInput.addEventListener('change', function () {
    breakDuration = parseInt(this.value) || 5;
    if (!isRunning && !isWorkTime) {
        timeLeft = breakDuration * 60;
        updateTimerDisplay();
    }
});

// Timer fonksiyonları
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
    }
}

function pauseTimer() {
    if (isRunning) {
        isRunning = false;
        clearInterval(timerInterval);
        startTimerBtn.disabled = false;
        pauseTimerBtn.disabled = true;
    }
}

function resetTimer() {
    pauseTimer();
    isWorkTime = true;
    timeLeft = workDuration * 60;
    updateTimerDisplay();
    timerModeText.textContent = "Çalışma modu";
    timerDisplay.style.color = 'var(--primary)';
    startTimerBtn.disabled = false;
    pauseTimerBtn.disabled = true;
    resetTimerBtn.disabled = true;
}

function updateTimer() {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;

        if (isWorkTime) {
            // Çalışma süresi bitti, mola başlıyor
            isWorkTime = false;
            timeLeft = breakDuration * 60;
            timerModeText.textContent = "Mola zamanı!";
            timerDisplay.style.color = 'var(--success)';
            alert('Çalışma süreniz bitti, mola zamanı!');
        } else {
            // Mola bitti, çalışma başlıyor
            isWorkTime = true;
            timeLeft = workDuration * 60;
            timerModeText.textContent = "Çalışma modu";
            timerDisplay.style.color = 'var(--primary)';
            alert('Mola süreniz bitti, çalışmaya devam!');
        }

        updateTimerDisplay();
        startTimer();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateTaskSelector() {
    taskSelector.innerHTML = '<option value="">Görev seçin (isteğe bağlı)</option>';

    tasks.forEach((task, index) => {
        if (!task.completed) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = task.title;
            taskSelector.appendChild(option);
        }
    });
}

// Timer buton eventleri
startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

// Öncelik seçimi
priorityOptions.forEach(option => {
    option.addEventListener('click', () => {
        priorityOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        currentPriority = option.dataset.priority;
    });
});

// Görevleri öncelik ve tarihe göre sırala
function sortTasks() {
    tasks.sort((a, b) => {
        // Önceliğe göre sırala (yüksek > orta > düşük)
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        // Aynı öncelikteyse, tarihe göre sırala (erken olan önce)
        if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate) - new Date(b.dueDate);
        }

        return 0;
    });
}

// Görevleri renderla
function renderTasks() {
    sortTasks();

    if (tasks.length === 0) {
        taskList.innerHTML = `
             <div class="empty-state">
                 <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxpc3QtY2hlY2siPjxwYXRoIGQ9Ik0zIDEwaDIiLz48cGF0aCBkPSJNMyA2aDIiLz48cGF0aCBkPSJNMyAxNGgyIi8+PHBhdGggZD0iTTcgMTBoMTQiLz48cGF0aCBkPSJNNyA2aDE0Ii8+PHBhdGggZD0iTTcgMTRoMTQiLz48L3N2Zz4=" alt="Empty list">
                 <h3>Görev bulunamadı</h3>
                 <p>Yeni bir görev ekleyerek başlayın</p>
             </div>
         `;
        return;
    }

    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const dueDate = new Date(task.dueDate);
        const isOverdue = !task.completed && dueDate < today;

        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.priority} ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
             <div class="task-header">
                 <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${index})">
                 <span class="task-title">${task.title}</span>
             </div>
             
             ${task.description ? `
             <div class="task-description">
                 ${task.description}
             </div>` : ''}
             
             <div class="task-meta">
                 <span class="task-priority ${task.priority}">
                     ${getPriorityText(task.priority)}
                 </span>
                 <span class="task-due ${isOverdue ? 'overdue' : ''}">
                     📅 ${formatDate(task.dueDate)}
                     ${isOverdue ? ' - Süre Doldu!' : ''}
                 </span>
             </div>
             
             <!-- Alt görevler bölümü -->
             <div class="subtasks">
                 <div class="subtask-header">
                     <span class="subtask-title">Tamamlanması Gerekenler</span>
                     <small>${getSubtaskProgress(task)}</small>
                 </div>
                 <ul class="subtask-list" id="subtask-list-${index}">
                     ${renderSubtasks(task, index)}
                 </ul>
             </div>
             
             <div class="task-actions">
                 <button class="btn btn-sm btn-edit" onclick="editTask(${index})">Düzenle</button>
                 <button class="btn btn-sm btn-delete" onclick="deleteTask(${index})">Sil</button>
             </div>
         `;

        taskList.appendChild(taskElement);
    });
}

// Formdaki alt görevleri renderla
function renderFormSubtasks() {
    formSubtaskList.innerHTML = '';

    if (formSubtasks.length === 0) {
        formSubtaskList.innerHTML = '<li class="form-subtask-item">Henüz alt görev eklenmedi</li>';
        return;
    }

    formSubtasks.forEach((subtask, index) => {
        const li = document.createElement('li');
        li.className = 'form-subtask-item';
        li.innerHTML = `
             <span class="form-subtask-text">${subtask.text}</span>
             <button class="form-subtask-remove" onclick="removeFormSubtask(${index})">×</button>
         `;
        formSubtaskList.appendChild(li);
    });
}

// Alt görevleri renderla
function renderSubtasks(task, taskIndex) {
    if (!task.subtasks || task.subtasks.length === 0) {
        return '<li class="subtask-item">Henüz alt görev eklenmedi</li>';
    }

    return task.subtasks.map((subtask, subtaskIndex) => `
         <li class="subtask-item">
             <input type="checkbox" class="subtask-checkbox" 
                    ${subtask.completed ? 'checked' : ''} 
                    onchange="toggleSubtask(${taskIndex}, ${subtaskIndex})">
             <span class="subtask-text ${subtask.completed ? 'subtask-completed' : ''}">
                 ${subtask.text}
             </span>
             <span class="subtask-actions">
                 <button onclick="deleteSubtask(${taskIndex}, ${subtaskIndex})">✕</button>
             </span>
         </li>
     `).join('');
}

// Alt görev ilerlemesini hesapla
function getSubtaskProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) return '0/0';

    const total = task.subtasks.length;
    const completed = task.subtasks.filter(s => s.completed).length;
    return `${completed}/${total}`;
}

// Yardımcı fonksiyonlar
function getPriorityText(priority) {
    return {
        'low': 'Düşük Öncelik',
        'medium': 'Orta Öncelik',
        'high': 'Yüksek Öncelik'
    }[priority];
}

function formatDate(dateString) {
    if (!dateString) return 'Belirtilmedi';
    return new Date(dateString).toLocaleDateString('tr-TR');
}

// Formdaki alt görev ekleme
function addFormSubtask() {
    const text = newSubtaskInput.value.trim();
    if (!text) return;

    formSubtasks.push({
        text,
        completed: false
    });

    newSubtaskInput.value = '';
    renderFormSubtasks();
}

// Formdaki alt görevi kaldırma
function removeFormSubtask(index) {
    formSubtasks.splice(index, 1);
    renderFormSubtasks();
}

// Görev fonksiyonları
function addTask() {
    const title = taskTitle.value.trim();
    if (!title) return alert('Lütfen görev başlığı girin!');

    tasks.push({
        title,
        description: taskDescription.value.trim(),
        priority: currentPriority,
        dueDate: taskDueDate.value,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: [...formSubtasks] // Formdaki alt görevleri ekle
    });

    // Formu ve alt görevleri temizle
    formSubtasks = [];
    renderFormSubtasks();

    saveTasks();
    resetForm();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
}

function editTask(index) {
    const task = tasks[index];

    // Form alanlarını doldur
    taskTitle.value = task.title;
    taskDescription.value = task.description || '';
    taskDueDate.value = task.dueDate || '';

    // Öncelik seçimini güncelle
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    document.querySelector(`.priority-option.${task.priority}`).classList.add('selected');
    currentPriority = task.priority;

    // Alt görevleri forma yükle
    formSubtasks = task.subtasks ? [...task.subtasks] : [];
    renderFormSubtasks();

    // Mevcut görevi listeden kaldır
    tasks.splice(index, 1);

    // Değişiklikleri kaydet ve listeyi güncelle
    saveTasks();
    renderTasks();

    // Başlık alanına odaklan ve buton metnini değiştir
    taskTitle.focus();
    addButton.textContent = 'Görevi Güncelle';

    // Güncelleme modundayken yeni ekleme butonunu eski haline getir
    const originalButtonText = addButton.textContent;
    addButton.addEventListener('click', function updateTaskHandler() {
        addTask();
        addButton.textContent = 'Görev Ekle';
        addButton.removeEventListener('click', updateTaskHandler);
    }, { once: true });
}

function deleteTask(index) {
    if (confirm('Bu görevi silmek istediğinize emin misiniz?')) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }
}

// Alt görev fonksiyonları
function toggleSubtask(taskIndex, subtaskIndex) {
    tasks[taskIndex].subtasks[subtaskIndex].completed =
        !tasks[taskIndex].subtasks[subtaskIndex].completed;
    saveTasks();
    renderTasks();
}

function deleteSubtask(taskIndex, subtaskIndex) {
    tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
    saveTasks();
    renderTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function resetForm() {
    taskTitle.value = '';
    taskDescription.value = '';
    taskDueDate.valueAsDate = defaultDate;

    // Önceliği varsayılana sıfırla
    priorityOptions.forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.priority-option.medium').classList.add('selected');
    currentPriority = 'medium';
}

// Event listeners
addButton.addEventListener('click', addTask);
addSubtaskBtn.addEventListener('click', addFormSubtask);

// Enter tuşu ile görev ekleme
taskTitle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// Enter tuşu ile alt görev ekleme
newSubtaskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addFormSubtask();
});

// Sayfa yüklendiğinde görevleri yükle
renderTasks();
renderFormSubtasks();