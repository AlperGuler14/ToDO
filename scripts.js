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
const themeToggle = document.getElementById('themeToggle');

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
    // Animasyonlu geçiş
    todoContainer.style.transform = 'translateY(-20px)';
    todoContainer.style.opacity = '0';
    
    setTimeout(() => {
        todoPage.classList.add('hidden');
        timerPage.classList.remove('hidden');
        todoContainer.style.transform = '';
        todoContainer.style.opacity = '';
    }, 300);

    // Görev seçiciyi güncelle
    updateTaskSelector();
});

backButton.addEventListener('click', () => {
    // Animasyonlu geçiş
    todoContainer.style.transform = 'translateY(20px)';
    todoContainer.style.opacity = '0';
    
    setTimeout(() => {
        timerPage.classList.add('hidden');
        todoPage.classList.remove('hidden');
        todoContainer.style.transform = '';
        todoContainer.style.opacity = '';
    }, 300);
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

// Timer fonksiyonları
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        timerInterval = setInterval(updateTimer, 1000);
        startTimerBtn.disabled = true;
        pauseTimerBtn.disabled = false;
        resetTimerBtn.disabled = false;
        
        // Seçili görevi tamamlanmış olarak işaretle
        const selectedTaskIndex = taskSelector.value;
        if (selectedTaskIndex && isWorkTime) {
            tasks[selectedTaskIndex].completed = true;
            saveTasks();
            renderTasks();
        }
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
    timerModeText.innerHTML = '<span class="icon">📌</span> Çalışma modu';
    timerDisplay.style.color = '';
}

function updateTimer() {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;

        // Tamamlanma efekti
        timerDisplay.classList.add('timer-complete');
        setTimeout(() => timerDisplay.classList.remove('timer-complete'), 500);

        if (isWorkTime) {
            // Çalışma süresi bitti, mola başlıyor
            isWorkTime = false;
            timeLeft = breakDuration * 60;
            timerModeText.innerHTML = '<span class="icon">🎉</span> Mola zamanı!';
            timerDisplay.style.color = 'var(--success)';
            
            // Bildirim göster
            showNotification('Çalışma süreniz bitti!', 'Mola zamanı geldi 🎉');
        } else {
            // Mola bitti, çalışma başlıyor
            isWorkTime = true;
            timeLeft = workDuration * 60;
            timerModeText.innerHTML = '<span class="icon">📌</span> Çalışma modu';
            timerDisplay.style.color = '';
            
            // Bildirim göster
            showNotification('Mola süreniz bitti!', 'Çalışmaya devam edin 💪');
        }

        updateTimerDisplay();
        startTimer();
    }
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // Progress bar güncelleme
    const totalTime = isWorkTime ? workDuration * 60 : breakDuration * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    document.querySelector('.timer-progress').style.width = `${progress}%`;
}

function updateTaskSelector() {
    taskSelector.innerHTML = '<option value="">Görev seçin (isteğe bağlı)</option>';

    tasks.forEach((task, index) => {
        if (!task.completed) {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = task.title;
            
            // Önceliğe göre renk
            if (task.priority === 'high') {
                option.style.color = 'var(--danger)';
            } else if (task.priority === 'medium') {
                option.style.color = 'var(--warning)';
            }
            
            taskSelector.appendChild(option);
        }
    });
}

// Bildirim göster
function showNotification(title, message) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification(title, { body: message });
            }
        });
    }
}

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
        // Tamamlanmamış görevler önce
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }
        
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
                <div class="empty-icon">📋</div>
                <h3>Görev bulunamadı</h3>
                <p>Yeni bir görev ekleyerek başlayın</p>
            </div>
        `;
        return;
    }

    taskList.innerHTML = '';

    tasks.forEach((task, index) => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null;
        const isOverdue = !task.completed && dueDate && dueDate < new Date();
        const formattedDate = dueDate ? formatDate(task.dueDate) : 'Belirtilmedi';

        const taskElement = document.createElement('div');
        taskElement.className = `task ${task.priority} ${task.completed ? 'completed' : ''}`;
        taskElement.innerHTML = `
            <div class="task-header">
                <label class="checkbox-container">
                    <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark"></span>
                    <span class="task-title">${task.title}</span>
                </label>
                <span class="task-priority ${task.priority}">
                    ${getPriorityIcon(task.priority)} ${getPriorityText(task.priority)}
                </span>
            </div>
            
            ${task.description ? `
            <div class="task-description">
                ${task.description}
            </div>` : ''}
            
            <div class="task-meta">
                <span class="task-due ${isOverdue ? 'overdue' : ''}">
                    <span class="icon">📅</span> ${formattedDate}
                    ${isOverdue ? ' - <span class="overdue-text">Süre Doldu!</span>' : ''}
                </span>
                <small class="task-date">Oluşturulma: ${formatDate(task.createdAt)}</small>
            </div>
            
            ${task.subtasks && task.subtasks.length > 0 ? `
            <div class="subtasks">
                <div class="subtask-header">
                    <span class="subtask-title">Tamamlanması Gerekenler</span>
                    <span class="subtask-progress ${getSubtaskCompletion(task) === 100 ? 'completed' : ''}">
                        ${getSubtaskProgress(task)}
                    </span>
                </div>
                <ul class="subtask-list">
                    ${renderSubtasks(task, index)}
                </ul>
            </div>` : ''}
            
            <div class="task-actions">
                <button class="btn btn-sm btn-edit" onclick="editTask(${index})">
                    <span class="icon">✏️</span> Düzenle
                </button>
                <button class="btn btn-sm btn-delete" onclick="deleteTask(${index})">
                    <span class="icon">🗑️</span> Sil
                </button>
            </div>
        `;

        // Checkbox event listener ekle
        const checkbox = taskElement.querySelector('.checkbox');
        checkbox.addEventListener('change', () => toggleTask(index));

        taskList.appendChild(taskElement);
    });
}

// Öncelik ikonu
function getPriorityIcon(priority) {
    const icons = {
        'high': '🔥',
        'medium': '⚠️',
        'low': '🐢'
    };
    return icons[priority] || '';
}

// Alt görev tamamlama yüzdesi
function getSubtaskCompletion(task) {
    if (!task.subtasks || task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter(s => s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
}

// Formdaki alt görevleri renderla
function renderFormSubtasks() {
    formSubtaskList.innerHTML = '';

    if (formSubtasks.length === 0) {
        formSubtaskList.innerHTML = '<li class="form-subtask-item empty">Henüz alt görev eklenmedi</li>';
        return;
    }

    formSubtasks.forEach((subtask, index) => {
        const li = document.createElement('li');
        li.className = 'form-subtask-item';
        li.innerHTML = `
            <span class="form-subtask-text">${subtask.text}</span>
            <button class="form-subtask-remove" onclick="removeFormSubtask(${index})">
                <span class="icon">❌</span>
            </button>
        `;
        formSubtaskList.appendChild(li);
    });
}

// Alt görevleri renderla
function renderSubtasks(task, taskIndex) {
    if (!task.subtasks || task.subtasks.length === 0) return '';

    return task.subtasks.map((subtask, subtaskIndex) => `
        <li class="subtask-item ${subtask.completed ? 'completed' : ''}">
            <label class="subtask-checkbox-container">
                <input type="checkbox" class="subtask-checkbox" 
                       ${subtask.completed ? 'checked' : ''}>
                <span class="subtask-checkmark"></span>
                <span class="subtask-text">${subtask.text}</span>
            </label>
            <button class="subtask-delete" onclick="deleteSubtask(${taskIndex}, ${subtaskIndex})">
                <span class="icon">🗑️</span>
            </button>
        </li>
    `).join('');
}

// Görev fonksiyonları
function addTask() {
    const title = taskTitle.value.trim();
    if (!title) {
        showAlert('Lütfen görev başlığı girin!', 'error');
        return;
    }

    const newTask = {
        title,
        description: taskDescription.value.trim(),
        priority: currentPriority,
        dueDate: taskDueDate.value,
        completed: false,
        createdAt: new Date().toISOString(),
        subtasks: [...formSubtasks]
    };

    tasks.push(newTask);

    // Formu temizle
    formSubtasks = [];
    renderFormSubtasks();

    saveTasks();
    resetForm();
    renderTasks();
    
    // Başarı mesajı göster
    showAlert('Görev başarıyla eklendi!', 'success');
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    saveTasks();
    renderTasks();
    
    // Feedback efekti
    const taskElement = document.querySelectorAll('.task')[index];
    taskElement.classList.add('task-updated');
    setTimeout(() => taskElement.classList.remove('task-updated'), 500);
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
    addButton.innerHTML = '<span class="icon">🔄</span> Görevi Güncelle';

    // Güncelleme modundayken yeni ekleme butonunu eski haline getir
    const originalButtonText = addButton.innerHTML;
    const updateTaskHandler = () => {
        addTask();
        addButton.innerHTML = '<span class="icon">✅</span> Görev Ekle';
    };
    
    addButton.addEventListener('click', updateTaskHandler, { once: true });
}

function deleteTask(index) {
    showConfirmDialog(
        'Görevi Sil',
        'Bu görevi silmek istediğinize emin misiniz?',
        () => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
            showAlert('Görev başarıyla silindi!', 'success');
        }
    );
}

// Alt görev fonksiyonları
function addFormSubtask() {
    const text = newSubtaskInput.value.trim();
    if (!text) {
        showAlert('Lütfen alt görev metni girin!', 'error');
        return;
    }

    formSubtasks.push({
        text,
        completed: false
    });

    newSubtaskInput.value = '';
    renderFormSubtasks();
    
    // Inputa focus ver
    newSubtaskInput.focus();
}

function removeFormSubtask(index) {
    formSubtasks.splice(index, 1);
    renderFormSubtasks();
}

function toggleSubtask(taskIndex, subtaskIndex) {
    tasks[taskIndex].subtasks[subtaskIndex].completed =
        !tasks[taskIndex].subtasks[subtaskIndex].completed;
    saveTasks();
    renderTasks();
}

function deleteSubtask(taskIndex, subtaskIndex) {
    showConfirmDialog(
        'Alt Görevi Sil',
        'Bu alt görevi silmek istediğinize emin misiniz?',
        () => {
            tasks[taskIndex].subtasks.splice(subtaskIndex, 1);
            saveTasks();
            renderTasks();
        }
    );
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

function getSubtaskProgress(task) {
    if (!task.subtasks || task.subtasks.length === 0) return '0/0';
    const total = task.subtasks.length;
    const completed = task.subtasks.filter(s => s.completed).length;
    return `${completed}/${total}`;
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

// UI Yardımcı Fonksiyonları
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.classList.add('fade-out');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

function showConfirmDialog(title, message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    
    dialog.innerHTML = `
        <div class="dialog">
            <h3>${title}</h3>
            <p>${message}</p>
            <div class="dialog-buttons">
                <button class="btn btn-secondary btn-cancel">İptal</button>
                <button class="btn btn-danger btn-confirm">Onayla</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(dialog);
    
    dialog.querySelector('.btn-cancel').addEventListener('click', () => {
        dialog.remove();
    });
    
    dialog.querySelector('.btn-confirm').addEventListener('click', () => {
        onConfirm();
        dialog.remove();
    });
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

// Süre ayarları değiştiğinde
workMinutesInput.addEventListener('change', function() {
    workDuration = parseInt(this.value) || 25;
    if (!isRunning && isWorkTime) {
        timeLeft = workDuration * 60;
        updateTimerDisplay();
    }
});

breakMinutesInput.addEventListener('change', function() {
    breakDuration = parseInt(this.value) || 5;
    if (!isRunning && !isWorkTime) {
        timeLeft = breakDuration * 60;
        updateTimerDisplay();
    }
});

// Timer buton eventleri
startTimerBtn.addEventListener('click', startTimer);
pauseTimerBtn.addEventListener('click', pauseTimer);
resetTimerBtn.addEventListener('click', resetTimer);

// Sayfa yüklendiğinde görevleri yükle
renderTasks();
renderFormSubtasks();

// Service Worker Kaydı
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful:', registration);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
    });
}

// Dark Mode Toggle Fonksiyonu
function toggleDarkMode() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleIcon(newTheme);
    
    // Animasyon ekle
    themeToggle.style.transform = 'scale(0.8)';
    setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
    }, 200);
}

// Tema ikonunu güncelle
function updateThemeToggleIcon(theme) {
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Sistem tercihini kontrol et
function checkSystemPreference() {
    if (localStorage.getItem('theme') === null && 
        window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
        updateThemeToggleIcon('dark');
    }
}

// Sayfa yüklendiğinde tema ayarlarını uygula
document.addEventListener('DOMContentLoaded', function() {
    // LocalStorage'dan tema tercihini yükle
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeToggleIcon(savedTheme);
    } else {
        checkSystemPreference();
    }
});

// Sistem teması değiştiğinde dinle (eğer kullanıcı manuel seçim yapmamışsa)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem('theme')) {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        updateThemeToggleIcon(newTheme);
    }
});

// Toggle butonuna event listener ekle
themeToggle.addEventListener('click', toggleDarkMode);

// PWA için manifest
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('service-worker.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            }, function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Spotify Playlist Açma Fonksiyonu
function openSpotifyPlaylist() {
  // Spotify playlist ID'niz
  const playlistId = '39dKSwIQYFGEjC3DTkC9PR';
  
  // Kullanıcı cihazını tespit et
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /iphone|ipad|ipod|android/.test(userAgent);

  // 1. Önce Spotify uygulamasını açmayı dene
  try {
    window.location.href = `spotify:playlist:${playlistId}`;
    
    // Mobil cihazlarda uygulama yoksa mağazaya yönlendir
    if (isMobile) {
      setTimeout(() => {
        if (!document.hidden) {
          // iOS için App Store, Android için Play Store
          const storeUrl = /iphone|ipad|ipod/.test(userAgent) 
            ? `https://apps.apple.com/app/spotify-music/id324684580` 
            : `https://play.google.com/store/apps/details?id=com.spotify.music`;
          
          window.location.href = storeUrl;
        }
      }, 500);
    }
  } catch (e) {
    console.error("Uygulama açılamadı:", e);
  }

  // 2. 300ms sonra hala açılmadıysa web player'ı aç
  setTimeout(() => {
    if (!document.hidden) {
      const webUrl = `https://open.spotify.com/playlist/${playlistId}`;
      
      // Masaüstü için yeni sekmede, mobil için aynı sekmede aç
      if (isMobile) {
        window.location.href = webUrl;
      } else {
        window.open(webUrl, '_blank', 'noopener,noreferrer');
      }
    }
  }, 300);
}

// Buton Event Listener
document.getElementById('musicAction').addEventListener('click', function(e) {
  e.preventDefault();
  
  // Buton feedback efekti
  this.classList.add('clicked');
  setTimeout(() => this.classList.remove('clicked'), 200);
  
  // Playlist'i aç
  openSpotifyPlaylist();
});

// Hata yönetimi
window.addEventListener('error', (e) => {
  console.error('Spotify açma hatası:', e);
  alert('Spotify açılırken hata oluştu. Lütfen konsolu kontrol edin.');
});

// Takvim Değişkenleri
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date();

// Sayfa Geçişleri
document.getElementById('calendarButton').addEventListener('click', () => {
  document.getElementById('todoPage').classList.add('hidden');
  document.getElementById('calendarPage').classList.remove('hidden');
  renderCalendar();
});

document.getElementById('backFromCalendar').addEventListener('click', () => {
  document.getElementById('calendarPage').classList.add('hidden');
  document.getElementById('todoPage').classList.remove('hidden');
});

// Takvim Render Fonksiyonu
function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  calendarGrid.innerHTML = '';

  // Gün başlıkları
  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  days.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day-header';
    dayHeader.textContent = day;
    calendarGrid.appendChild(dayHeader);
  });

  // Ayın ilk günü
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Ayın son günü
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  
  // Boşlukları doldur
  for (let i = 0; i < firstDay; i++) {
    calendarGrid.appendChild(document.createElement('div'));
  }

  // Günleri oluştur
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    const dateStr = `${currentYear}-${(currentMonth+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Bugün kontrolü
    const today = new Date();
    if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      dayElement.classList.add('today');
      if (selectedDate.toDateString() === today.toDateString()) {
        dayElement.classList.add('selected');
      }
    }

    // Görev kontrolü
    const dayTasks = tasks.filter(task => task.dueDate && task.dueDate.includes(dateStr));
    if (dayTasks.length > 0) {
      dayElement.classList.add('has-tasks');
    }

    dayElement.innerHTML = `<div class="calendar-day-number">${day}</div>`;
    
    // Tıklama eventi
    dayElement.addEventListener('click', () => {
      selectedDate = new Date(currentYear, currentMonth, day);
      showTasksForDate(dateStr);
    });

    calendarGrid.appendChild(dayElement);
  }

  // Ay başlığını güncelle
  document.getElementById('currentMonth').textContent = 
    new Date(currentYear, currentMonth).toLocaleDateString('tr-TR', { 
      month: 'long', 
      year: 'numeric' 
    });
    
  // Bugünün görevlerini göster
  if (document.getElementById('calendarPage').classList.contains('hidden') === false) {
    const todayStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    showTasksForDate(todayStr);
  }
}

// Tarihe göre görevleri göster
function showTasksForDate(dateStr) {
  const eventList = document.getElementById('eventList');
  const selectedDateText = document.getElementById('selectedDateText');
  
  const filteredTasks = tasks.filter(task => task.dueDate && task.dueDate.includes(dateStr));
  const dateObj = new Date(dateStr);
  
  selectedDateText.textContent = dateObj.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  
  if (filteredTasks.length > 0) {
    eventList.innerHTML = filteredTasks.map(task => `
      <div class="event-item">
        <div class="priority ${task.priority}"></div>
        <div class="event-details">
          <div class="event-title">${task.title}</div>
          ${task.description ? `<div class="event-desc">${task.description}</div>` : ''}
        </div>
      </div>
    `).join('');
  } else {
    eventList.innerHTML = '<div class="no-events">Bu tarihte görev bulunamadı</div>';
  }
  
  // Seçili günü işaretle
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
  });
  
  const dayNumber = new Date(dateStr).getDate();
  const days = document.querySelectorAll('.calendar-day-number');
  days.forEach(day => {
    if (parseInt(day.textContent) === dayNumber) {
      day.parentElement.classList.add('selected');
    }
  });
}

// Ay değiştirme butonları
document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalendar();
});

// Görev eklendiğinde/güncellendiğinde takvimi yenile
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  if (!document.getElementById('calendarPage').classList.contains('hidden')) {
    renderCalendar();
  }
}
