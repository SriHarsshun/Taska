// ===== Taska – Frontend To-Do App =====
(function () {
    'use strict';

    // --- DOM References ---
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);

    const taskInput = $('#task-input');
    const addTaskForm = $('#add-task-form');
    const taskList = $('#task-list');
    const emptyState = $('#empty-state');
    const emptyTitle = $('#empty-title');
    const emptyText = $('#empty-text');
    const progressFill = $('#progress-bar-fill');
    const progressText = $('#progress-text');
    const statsDone = $('#stats-done');
    const statsTotal = $('#stats-total');
    const themeToggle = $('#theme-toggle');
    const clearCompletedBtn = $('#clear-completed-btn');
    const toastContainer = $('#toast-container');
    const priorityBtns = $$('.priority-btn');
    const filterTabs = $$('.filter-tab');
    const categorySelect = $('#category-select');

    // --- State ---
    let tasks = JSON.parse(localStorage.getItem('taska-tasks')) || [];
    let currentFilter = 'all';
    let selectedPriority = 'low';

    // --- Theme ---
    function initTheme() {
        const saved = localStorage.getItem('taska-theme') || 'dark';
        document.documentElement.setAttribute('data-theme', saved);
    }

    themeToggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('taska-theme', next);
    });

    // --- Utilities ---
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    }

    function saveTasks() {
        localStorage.setItem('taska-tasks', JSON.stringify(tasks));
    }

    function formatTime(ts) {
        const d = new Date(ts);
        const now = new Date();
        const diff = now - d;
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    const categoryEmojis = { personal: '🏠', work: '💼', study: '📚', health: '💪', shopping: '🛒' };

    // --- Toast Notifications ---
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        const iconPaths = {
            success: '<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>',
            danger: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
            info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>'
        };
        toast.innerHTML = `
            <svg class="toast-icon ${type}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPaths[type]}</svg>
            <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('toast-out');
            toast.addEventListener('animationend', () => toast.remove());
        }, 2500);
    }

    // --- Priority Selector ---
    priorityBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            priorityBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPriority = btn.dataset.priority;
        });
    });

    // --- Filter Tabs ---
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderTasks();
        });
    });

    // --- Add Task ---
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) {
            taskInput.focus();
            showToast('Please enter a task', 'danger');
            return;
        }
        const task = {
            id: generateId(),
            text,
            completed: false,
            priority: selectedPriority,
            category: categorySelect.value,
            createdAt: Date.now()
        };
        tasks.unshift(task);
        saveTasks();
        taskInput.value = '';
        renderTasks();
        showToast('Task added!', 'success');
    });

    // --- Render Tasks ---
    function renderTasks() {
        const filtered = tasks.filter(t => {
            if (currentFilter === 'active') return !t.completed;
            if (currentFilter === 'completed') return t.completed;
            return true;
        });

        taskList.innerHTML = '';

        if (filtered.length === 0) {
            emptyState.classList.add('visible');
            if (tasks.length === 0) {
                emptyTitle.textContent = 'No tasks yet';
                emptyText.textContent = 'Add your first task above to get started!';
            } else if (currentFilter === 'active') {
                emptyTitle.textContent = 'All done! 🎉';
                emptyText.textContent = 'You\'ve completed all your tasks. Nice work!';
            } else if (currentFilter === 'completed') {
                emptyTitle.textContent = 'Nothing completed yet';
                emptyText.textContent = 'Start checking off tasks to see them here.';
            }
        } else {
            emptyState.classList.remove('visible');
            filtered.forEach(task => taskList.appendChild(createTaskElement(task)));
        }

        updateStats();
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' completed' : '');
        li.dataset.id = task.id;

        li.innerHTML = `
            <label class="task-checkbox">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <div class="checkmark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                </div>
            </label>
            <div class="task-content">
                <div class="task-text">${escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-category">${categoryEmojis[task.category] || ''} ${capitalize(task.category)}</span>
                    <span class="task-priority-badge ${task.priority}">${task.priority}</span>
                    <span class="task-time">${formatTime(task.createdAt)}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit" title="Edit task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="task-action-btn delete" title="Delete task">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>`;

        // Toggle complete
        const checkbox = li.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => toggleComplete(task.id));

        // Delete
        li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id, li));

        // Edit
        li.querySelector('.edit').addEventListener('click', () => startEdit(task.id, li));

        return li;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // --- Task Actions ---
    function toggleComplete(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
            showToast(task.completed ? 'Task completed! ✅' : 'Task reopened', task.completed ? 'success' : 'info');
        }
    }

    function deleteTask(id, li) {
        li.classList.add('removing');
        li.addEventListener('animationend', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
            showToast('Task deleted', 'danger');
        });
    }

    function startEdit(id, li) {
        const task = tasks.find(t => t.id === id);
        if (!task) return;
        const textEl = li.querySelector('.task-text');
        const oldText = task.text;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'task-edit-input';
        input.value = oldText;
        input.maxLength = 200;
        textEl.replaceWith(input);
        input.focus();
        input.select();

        const finish = () => {
            const newText = input.value.trim();
            if (newText && newText !== oldText) {
                task.text = newText;
                saveTasks();
                showToast('Task updated', 'info');
            }
            renderTasks();
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            if (e.key === 'Escape') { input.value = oldText; input.blur(); }
        });
    }

    // --- Clear Completed ---
    clearCompletedBtn.addEventListener('click', () => {
        const count = tasks.filter(t => t.completed).length;
        if (count === 0) {
            showToast('No completed tasks to clear', 'info');
            return;
        }
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
        showToast(`Cleared ${count} task${count > 1 ? 's' : ''}`, 'danger');
    });

    // --- Stats & Progress ---
    function updateStats() {
        const total = tasks.length;
        const done = tasks.filter(t => t.completed).length;
        const pct = total === 0 ? 0 : Math.round((done / total) * 100);

        statsDone.textContent = done;
        statsTotal.textContent = total;
        progressFill.style.width = pct + '%';
        progressText.textContent = pct + '% complete';
    }

    // --- Init ---
    initTheme();
    renderTasks();
})();
