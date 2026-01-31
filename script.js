const STORAGE_KEYS = {
    tasks: 'workspaceHubTasks',
    taskMeta: 'workspaceHubTaskMeta',
    notes: 'workspaceHubNotes',
    noteHistory: 'workspaceHubNoteHistory',
    calendarNotes: 'workspaceHubCalendarNotes',
    theme: 'workspaceHubTheme',
    notepadProjects: 'workspaceHubNotepadProjects'
};

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLandingStats();
    initTodoPage();
    initNotesPage();
    initNotepadPage();
});

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
    document.documentElement.dataset.theme = savedTheme;
    document.querySelectorAll('.theme-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const nextTheme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
            document.documentElement.dataset.theme = nextTheme;
            localStorage.setItem(STORAGE_KEYS.theme, nextTheme);
        });
    });
}

function initLandingStats() {
    const tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
    const notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || '[]');
    const taskEl = document.getElementById('statTasks');
    const noteEl = document.getElementById('statNotes');
    if (taskEl) taskEl.textContent = tasks.length;
    if (noteEl) noteEl.textContent = notes.length;
}

function initTodoPage() {
    const form = document.getElementById('taskForm');
    if (!form) return;

    const motivationEl = document.querySelector('.motivation');
    const input = document.getElementById('taskInput');
    const categorySelect = document.getElementById('categorySelect');
    const prioritySelect = document.getElementById('prioritySelect');
    const dueInput = document.getElementById('dueDateInput');
    const daySelect = document.getElementById('daySelect');
    const taskList = document.getElementById('taskList');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    const filterButtons = document.querySelectorAll('.filter-button');
    const searchInput = document.getElementById('taskSearch');
    const emptyState = document.querySelector('[data-empty]');
    const stats = {
        active: document.getElementById('statActive'),
        completed: document.getElementById('statCompleted'),
        completion: document.getElementById('statCompletion'),
        streak: document.getElementById('statStreak')
    };

    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.tasks) || '[]');
    let currentFilter = 'all';
    let searchTerm = '';

    rotateMotivation();
    renderTasks();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        // Get emoji for category
        const categoryEmojis = {
            focus: '🎯',
            work: '💼',
            life: '🏠',
            ideas: '💡'
        };
        const emoji = categoryEmojis[categorySelect.value] || '📝';

        const newTask = {
            id: crypto.randomUUID(),
            text,
            category: categorySelect.value,
            priority: prioritySelect.value,
            dueDate: dueInput.value || null,
            day: daySelect ? daySelect.value : 'today',
            completed: false,
            emoji: emoji,
            editing: false,
            createdAt: Date.now()
        };

        tasks.unshift(newTask);
        persistTasks();
        form.reset();
        renderTasks();
    });

    taskList.addEventListener('click', (event) => {
        const li = event.target.closest('[data-id]');
        if (!li) return;
        const id = li.dataset.id;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        if (event.target.matches('input[type="checkbox"]')) {
            task.completed = event.target.checked;
            persistTasks();
            renderTasks();
        } else if (event.target.matches('[data-delete]') && !event.target.matches('[data-cancel]')) {
            tasks = tasks.filter(t => t.id !== id);
            persistTasks();
            renderTasks();
        } else if (event.target.matches('[data-edit]')) {
            task.editing = true;
            renderTasks();
        } else if (event.target.matches('[data-cancel]')) {
            task.editing = false;
            renderTasks();
        } else if (event.target.matches('[data-save]')) {
            // Save is handled inline in renderTasks
            return;
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(task => !task.completed);
        persistTasks();
        renderTasks();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    searchInput.addEventListener('input', () => {
        searchTerm = searchInput.value.toLowerCase();
        renderTasks();
    });

    function renderTasks() {
        taskList.innerHTML = '';
        const filtered = tasks.filter(task => {
            // Hide completed tasks from "all" filter
            const matchesFilter =
                (currentFilter === 'all' && !task.completed) ||
                (currentFilter === 'active' && !task.completed) ||
                (currentFilter === 'completed' && task.completed) ||
                (task.category === currentFilter && !task.completed);

            const matchesSearch = task.text.toLowerCase().includes(searchTerm);

            return matchesFilter && matchesSearch;
        });

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;

            // Get emoji for category
            const categoryEmojis = {
                focus: '🎯',
                work: '💼',
                life: '🏠',
                ideas: '💡'
            };
            const emoji = task.emoji || categoryEmojis[task.category] || '📝';

            const isEditing = task.editing || false;

            if (isEditing) {
                // Editing mode - show editable fields
                li.innerHTML = `
                    <div class="task-left">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Complete task" disabled>
                        <div class="task-edit-form">
                            <input type="text" class="task-edit-input" value="${task.text}" placeholder="Task text" />
                            <div class="task-edit-fields">
                                <select class="task-edit-category">
                                    <option value="focus" ${task.category === 'focus' ? 'selected' : ''}>Focus</option>
                                    <option value="work" ${task.category === 'work' ? 'selected' : ''}>Work</option>
                                    <option value="life" ${task.category === 'life' ? 'selected' : ''}>Life</option>
                                    <option value="ideas" ${task.category === 'ideas' ? 'selected' : ''}>Ideas</option>
                                </select>
                                <select class="task-edit-priority">
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low priority</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium priority</option>
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High priority</option>
                                </select>
                                <input type="date" class="task-edit-date" value="${task.dueDate || ''}" />
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button data-save aria-label="Save task">✓</button>
                        <button data-cancel aria-label="Cancel edit">✕</button>
                    </div>
                `;

                const editInput = li.querySelector('.task-edit-input');
                const editCategory = li.querySelector('.task-edit-category');
                const editPriority = li.querySelector('.task-edit-priority');
                const editDate = li.querySelector('.task-edit-date');
                const saveBtn = li.querySelector('[data-save]');
                const cancelBtn = li.querySelector('[data-cancel]');

                if (editInput) editInput.focus();

                const saveEdit = () => {
                    task.text = editInput.value.trim() || task.text;
                    task.category = editCategory.value;
                    task.priority = editPriority.value;
                    task.dueDate = editDate.value || null;

                    // Update emoji based on new category
                    const categoryEmojis = {
                        focus: '🎯',
                        work: '💼',
                        life: '🏠',
                        ideas: '💡'
                    };
                    task.emoji = categoryEmojis[task.category] || '📝';

                    task.editing = false;
                    persistTasks();
                    renderTasks();
                };

                const cancelEdit = () => {
                    task.editing = false;
                    renderTasks();
                };

                if (saveBtn) saveBtn.addEventListener('click', saveEdit);
                if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

                if (editInput) {
                    editInput.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            saveEdit();
                        } else if (e.key === 'Escape') {
                            cancelEdit();
                        }
                    });
                }
            } else {
                // Normal view
                const displayText = `<p class="task-title ${task.completed ? 'completed' : ''}">${emoji} ${task.text}</p>`;

                li.innerHTML = `
                    <div class="task-left">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Complete task">
                        <div>
                            ${displayText}
                            <div class="task-meta">
                                <span class="badge ${task.priority}">${task.priority}</span>
                                <span class="badge">${task.category}</span>
                                ${task.day && task.day !== 'today' ? `<span class="badge day-badge">${task.day.charAt(0).toUpperCase() + task.day.slice(1)}</span>` : ''}
                                ${task.dueDate ? `<span>Due ${formatDate(task.dueDate)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button data-edit aria-label="Edit task">✎</button>
                        <button data-delete aria-label="Delete task">✕</button>
                    </div>
                `;
            }

            taskList.appendChild(li);
        });

        if (emptyState) {
            emptyState.classList.toggle('active', filtered.length === 0);
        }

        updateStats();
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const active = total - completed;
        stats.active.textContent = active;
        stats.completed.textContent = completed;
        stats.completion.textContent = total === 0 ? '0%' : `${Math.round((completed / total) * 100)}%`;

        const streak = calculateStreak(tasks);
        stats.streak.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
    }

    function persistTasks() {
        localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks));
        const meta = { lastCompleted: Date.now() };
        localStorage.setItem(STORAGE_KEYS.taskMeta, JSON.stringify(meta));
        initLandingStats();
    }

    function rotateMotivation() {
        if (!motivationEl) return;
        const lines = [
            '✨ Small steps spark big wins.',
            '🚀 Done is better than perfect.',
            '🎯 Focus on the next meaningful action.',
            '📋 Deep work loves a tidy list.'
        ];
        let idx = 0;
        const setLine = () => {
            motivationEl.textContent = lines[idx];
            idx = (idx + 1) % lines.length;
        };
        setLine();
        setInterval(setLine, 8000);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function calculateStreak(tasks) {
    const completedDates = tasks
        .filter(task => task.completed)
        .map(task => {
            const date = new Date(task.createdAt);
            return date.toISOString().slice(0, 10);
        })
        .sort()
        .reverse();

    if (!completedDates.length) return 0;

    let streak = 0;
    let currentDate = new Date();

    while (true) {
        const formatted = currentDate.toISOString().slice(0, 10);
        if (completedDates.includes(formatted)) {
            streak += 1;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function initNotesPage() {
    const drawingArea = document.getElementById('drawingArea');
    if (!drawingArea) return;

    const addBtn = document.getElementById('addBoxBtn');
    const addRectangleBtn = document.getElementById('addRectangleBtn');
    const addNotepadBtn = document.getElementById('addNotepadBtn');
    const floatingAddBtn = document.getElementById('floatingAddBtn');
    const clearBtn = document.getElementById('clearAllBtn');
    const saveBoardBtn = document.getElementById('saveBoardBtn');
    const lockToggle = document.getElementById('lockToggle');
    const exportBtn = document.getElementById('exportNotesBtn');
    const snapToggle = document.getElementById('snapToggle');
    const paletteButtons = document.querySelectorAll('.palette-swatch');
    const placeholder = drawingArea.querySelector('.placeholder-text');
    const notesWrapper = document.querySelector('.notes-layout');
    const historyList = document.getElementById('historyList');
    const menuToggle = document.getElementById('menuToggle');
    const menuClose = document.getElementById('menuClose');
    const notesMenu = document.getElementById('notesMenu');
    const menuBackdrop = document.getElementById('menuBackdrop');
    const pageNumberInput = document.getElementById('pageNumberInput');
    const expandPageBtn = document.getElementById('expandPageBtn');
    const linesInput = document.getElementById('linesInput');
    const notepadLinesInput = document.querySelector('.notepad-lines-input');

    let notes = JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) || '[]');
    let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.noteHistory) || '[]');
    let currentSnapshotId = null;
    let selectedColor = paletteButtons[0]?.dataset.color || '#fffbe6';
    let draggingEnabled = true;
    let snapEnabled = false;

    // Menu toggle functionality
    function openMenu() {
        if (notesMenu) notesMenu.classList.add('open');
        if (menuBackdrop) menuBackdrop.classList.add('active');
    }

    function closeMenu() {
        if (notesMenu) notesMenu.classList.remove('open');
        if (menuBackdrop) menuBackdrop.classList.remove('active');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            openMenu();
        });
    }

    if (menuClose) {
        menuClose.addEventListener('click', () => {
            closeMenu();
        });
    }

    if (menuBackdrop) {
        menuBackdrop.addEventListener('click', () => {
            closeMenu();
        });
    }

    // Close menu when clicking outside
    if (notesMenu) {
        document.addEventListener('click', (e) => {
            if (notesMenu.classList.contains('open') &&
                !notesMenu.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                closeMenu();
            }
        });
    }

    if (notesWrapper) {
        notesWrapper.dataset.grid = 'off';
    }

    paletteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            paletteButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedColor = btn.dataset.color;
        });
    });

    addBtn.addEventListener('click', () => {
        const note = createNote();
        notes.push(note);
        saveNotes();
        renderNotes();
    });

    if (addRectangleBtn) {
        addRectangleBtn.addEventListener('click', () => {
            const note = createRectangleNote();
            notes.push(note);
            saveNotes();
            renderNotes();
        });
    }

    // Add notepad lines functionality
    if (addNotepadBtn) {
        addNotepadBtn.addEventListener('click', () => {
            if (notepadLinesInput) {
                const isVisible = notepadLinesInput.style.display !== 'none';

                if (!isVisible) {
                    // Show input and focus
                    notepadLinesInput.style.display = 'flex';
                    if (linesInput) {
                        setTimeout(() => {
                            linesInput.focus();
                            linesInput.select();
                        }, 100);
                    }
                } else {
                    // Create notepad when button clicked again
                    const numLines = parseInt(linesInput?.value) || 20;
                    if (numLines >= 1) {
                        const notepad = createNotepadNote(numLines);
                        notes.push(notepad);
                        saveNotes();
                        renderNotes();
                        notepadLinesInput.style.display = 'none';
                        if (linesInput) {
                            linesInput.value = '20'; // Reset to default
                        }
                    }
                }
            } else {
                // If input container doesn't exist, create notepad with default lines
                const notepad = createNotepadNote(20);
                notes.push(notepad);
                saveNotes();
                renderNotes();
            }
        });

        // Handle Enter key in lines input
        if (linesInput) {
            linesInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const numLines = parseInt(linesInput.value) || 20;
                    if (numLines >= 1) {
                        const notepad = createNotepadNote(numLines);
                        notes.push(notepad);
                        saveNotes();
                        renderNotes();
                        if (notepadLinesInput) {
                            notepadLinesInput.style.display = 'none';
                            linesInput.value = '20'; // Reset to default
                        }
                    }
                }
            });
        }
    }

    const shapeSelector = document.getElementById('shapeSelector');
    let shapeSelectorVisible = false;

    if (floatingAddBtn) {
        floatingAddBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (shapeSelector) {
                shapeSelectorVisible = !shapeSelectorVisible;
                shapeSelector.classList.toggle('visible', shapeSelectorVisible);
            }
        });
    }

    // Handle shape selection with color picker
    if (shapeSelector) {
        // Get colors from palette buttons
        const availableColors = Array.from(paletteButtons).map(btn => btn.dataset.color);

        const shapeOptions = shapeSelector.querySelectorAll('.shape-option');
        shapeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const shape = option.dataset.shape;

                // Remove any existing color palette
                const existingPalette = option.querySelector('.shape-color-palette');
                if (existingPalette) {
                    existingPalette.remove();
                    return;
                }

                // Show color palette for selection
                const colorPalette = document.createElement('div');
                colorPalette.className = 'shape-color-palette';

                availableColors.forEach(color => {
                    const colorBtn = document.createElement('button');
                    colorBtn.className = 'shape-color-option';
                    colorBtn.style.background = color;
                    colorBtn.dataset.color = color;
                    colorBtn.setAttribute('aria-label', `Select color ${color}`);
                    colorBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        const selectedColor = colorBtn.dataset.color;

                        if (shape === 'note') {
                            const note = createNote();
                            note.color = selectedColor;
                            notes.push(note);
                            saveNotes();
                            renderNotes();
                        } else if (shape === 'rectangle') {
                            const note = createRectangleNote();
                            note.color = selectedColor;
                            notes.push(note);
                            saveNotes();
                            renderNotes();
                        }

                        // Hide everything
                        colorPalette.remove();
                        shapeSelectorVisible = false;
                        shapeSelector.classList.remove('visible');
                    });
                    colorPalette.appendChild(colorBtn);
                });

                option.appendChild(colorPalette);

                // Close color palette when clicking outside
                setTimeout(() => {
                    const closePalette = (ev) => {
                        if (!colorPalette.contains(ev.target) && !option.contains(ev.target)) {
                            colorPalette.remove();
                            document.removeEventListener('click', closePalette);
                        }
                    };
                    document.addEventListener('click', closePalette);
                }, 100);
            });
        });

        // Close selector when clicking outside
        document.addEventListener('click', (e) => {
            if (shapeSelectorVisible &&
                !shapeSelector.contains(e.target) &&
                !floatingAddBtn.contains(e.target)) {
                shapeSelectorVisible = false;
                shapeSelector.classList.remove('visible');
            }
        });
    }

    clearBtn.addEventListener('click', () => {
        if (!confirm('Delete all notes?')) return;
        notes = [];
        currentSnapshotId = null;
        saveNotes();
        renderNotes();
    });

    lockToggle.addEventListener('click', () => {
        draggingEnabled = !draggingEnabled;
        lockToggle.textContent = draggingEnabled ? 'Lock layout' : 'Unlock layout';
        lockToggle.setAttribute('aria-pressed', String(!draggingEnabled));
    });

    if (saveBoardBtn) {
        saveBoardBtn.addEventListener('click', () => {
            if (!notes.length) {
                saveBoardBtn.textContent = 'Nothing to save';
                setTimeout(() => (saveBoardBtn.textContent = 'Save board'), 1500);
                return;
            }
            saveHistoryEntry();
            notes = [];
            currentSnapshotId = null;
            saveNotes();
            renderNotes();
            renderHistory();
            saveBoardBtn.textContent = 'Saved!';
            setTimeout(() => (saveBoardBtn.textContent = 'Save board'), 2000);
        });
    }

    snapToggle.addEventListener('change', () => {
        snapEnabled = snapToggle.checked;
        if (notesWrapper) {
            notesWrapper.dataset.grid = snapEnabled ? 'on' : 'off';
        }
    });

    exportBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(JSON.stringify(notes));
            exportBtn.textContent = 'Copied!';
            setTimeout(() => (exportBtn.textContent = 'Copy backup'), 2000);
        } catch (err) {
            console.error(err);
        }
    });

    renderNotes();
    renderHistory();

    // Page number input handler
    if (pageNumberInput) {
        pageNumberInput.addEventListener('change', () => {
            const pageNum = parseInt(pageNumberInput.value) || 1;
            // You can add functionality here to navigate to specific page if needed
            localStorage.setItem('boxpadCurrentPage', pageNum);
        });

        // Load saved page number
        const savedPage = localStorage.getItem('boxpadCurrentPage');
        if (savedPage) {
            pageNumberInput.value = savedPage;
        }
    }

    // Expand/Collapse page functionality
    let isPageExpanded = localStorage.getItem('boxpadPageExpanded') === 'true';
    if (expandPageBtn && drawingArea) {
        // Set initial state
        if (isPageExpanded) {
            drawingArea.style.minHeight = '8000px';
            expandPageBtn.textContent = '▲';
            expandPageBtn.title = 'Collapse';
        } else {
            drawingArea.style.minHeight = '4000px';
            expandPageBtn.textContent = '▼';
            expandPageBtn.title = 'Expand';
        }

        expandPageBtn.addEventListener('click', () => {
            isPageExpanded = !isPageExpanded;
            if (isPageExpanded) {
                drawingArea.style.minHeight = '8000px';
                expandPageBtn.textContent = '▲';
                expandPageBtn.title = 'Collapse';
            } else {
                drawingArea.style.minHeight = '4000px';
                expandPageBtn.textContent = '▼';
                expandPageBtn.title = 'Expand';
            }
            localStorage.setItem('boxpadPageExpanded', isPageExpanded);
        });
    }

    function renderNotes() {
        drawingArea.querySelectorAll('.note-box').forEach(note => note.remove());
        notes.forEach(note => {
            const noteBox = buildNoteElement(note);
            drawingArea.appendChild(noteBox);
        });
        togglePlaceholder();
        initLandingStats();
    }

    function renderHistory() {
        if (!historyList) return;
        historyList.innerHTML = '';

        if (!history.length) {
            const empty = document.createElement('p');
            empty.className = 'history-empty';
            empty.textContent = 'No snapshots yet.';
            historyList.appendChild(empty);
            return;
        }

        history
            .slice()
            .reverse()
            .forEach(entry => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const date = new Date(entry.savedAt);
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                const loadBtn = document.createElement('button');
                loadBtn.className = 'history-load';
                const name = entry.name || `Saved Board ${date.toLocaleDateString()}`;

                // Create editable name section
                const nameContainer = document.createElement('div');
                nameContainer.className = 'history-name-container';

                const nameDisplay = document.createElement('div');
                nameDisplay.className = 'history-name';
                nameDisplay.textContent = name;

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.className = 'history-name-input';
                nameInput.value = name;
                nameInput.style.display = 'none';

                nameContainer.appendChild(nameDisplay);
                nameContainer.appendChild(nameInput);

                // Edit button for name
                const editNameBtn = document.createElement('button');
                editNameBtn.className = 'history-edit-name';
                editNameBtn.innerHTML = '✎';
                editNameBtn.setAttribute('aria-label', 'Edit name');
                editNameBtn.title = 'Edit name';

                let isEditingName = false;
                editNameBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!isEditingName) {
                        isEditingName = true;
                        nameDisplay.style.display = 'none';
                        nameInput.style.display = 'block';
                        nameInput.focus();
                        nameInput.select();
                    } else {
                        // Save name
                        const newName = nameInput.value.trim() || `Saved Board ${date.toLocaleDateString()}`;
                        entry.name = newName;
                        nameDisplay.textContent = newName;
                        nameInput.value = newName;
                        nameDisplay.style.display = 'block';
                        nameInput.style.display = 'none';
                        isEditingName = false;

                        // Update rectangle box topic name in saved notes if it exists
                        const rectangleBox = entry.notes.find(note => note.type === 'rectangle');
                        if (rectangleBox) {
                            rectangleBox.topicName = newName;
                        }

                        // Save to localStorage
                        localStorage.setItem(STORAGE_KEYS.noteHistory, JSON.stringify(history));
                    }
                });

                nameInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        editNameBtn.click();
                    } else if (e.key === 'Escape') {
                        nameInput.value = name;
                        nameDisplay.style.display = 'block';
                        nameInput.style.display = 'none';
                        isEditingName = false;
                    }
                });

                nameInput.addEventListener('blur', () => {
                    if (isEditingName) {
                        const newName = nameInput.value.trim() || `Saved Board ${date.toLocaleDateString()}`;
                        entry.name = newName;
                        nameDisplay.textContent = newName;
                        nameInput.value = newName;
                        nameDisplay.style.display = 'block';
                        nameInput.style.display = 'none';
                        isEditingName = false;

                        // Update rectangle box topic name in saved notes if it exists
                        const rectangleBox = entry.notes.find(note => note.type === 'rectangle');
                        if (rectangleBox) {
                            rectangleBox.topicName = newName;
                        }

                        // Save to localStorage
                        localStorage.setItem(STORAGE_KEYS.noteHistory, JSON.stringify(history));
                    }
                });

                loadBtn.innerHTML = '';
                loadBtn.appendChild(nameContainer);

                const dateDisplay = document.createElement('div');
                dateDisplay.className = 'history-date';
                dateDisplay.textContent = formattedDate;
                loadBtn.appendChild(dateDisplay);

                loadBtn.addEventListener('click', () => {
                    if (!isEditingName) {
                        notes = entry.notes.map(note => ({ ...note }));
                        // Update rectangle box topic name with saved board name
                        const rectangleBox = notes.find(note => note.type === 'rectangle');
                        if (rectangleBox && entry.name) {
                            rectangleBox.topicName = entry.name;
                        }
                        currentSnapshotId = entry.id;
                        saveNotes();
                        renderNotes();
                    }
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'history-delete';
                deleteBtn.setAttribute('aria-label', 'Delete history snapshot');
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', () => {
                    deleteHistoryEntry(entry.id);
                });

                item.append(editNameBtn, loadBtn, deleteBtn);
                historyList.appendChild(item);
            });
    }

    function buildNoteElement(note) {
        // Backward compatibility: if type is not set, default to 'note'
        if (!note.type) {
            note.type = 'note';
        }

        const noteBox = document.createElement('div');
        noteBox.className = 'note-box';
        if (note.type === 'rectangle') {
            noteBox.classList.add('rectangle-box');
        }
        if (note.type === 'notepad') {
            noteBox.classList.add('notepad-box');
        }
        if (note.expanded) {
            noteBox.classList.add('expanded');
        }
        noteBox.dataset.id = note.id;
        noteBox.style.left = note.left;
        noteBox.style.top = note.top;
        noteBox.style.background = note.color;
        noteBox.style.width = note.width;
        noteBox.style.height = note.height;

        // For rectangle boxes, add topic name as full-width header at top
        if (note.type === 'rectangle') {
            const topicHeader = document.createElement('div');
            topicHeader.className = 'rectangle-topic-header';
            const topicInput = document.createElement('input');
            topicInput.type = 'text';
            topicInput.className = 'rectangle-topic-input';
            topicInput.value = note.topicName || '';
            topicInput.placeholder = 'Enter topic name...';
            topicInput.addEventListener('change', () => {
                note.topicName = topicInput.value || '';
                saveNotes();
            });
            topicInput.addEventListener('blur', () => {
                note.topicName = topicInput.value || '';
                saveNotes();
            });
            topicHeader.appendChild(topicInput);
            noteBox.appendChild(topicHeader);
        }

        const toolbar = document.createElement('div');
        toolbar.className = 'note-toolbar';

        const leftSection = document.createElement('div');
        leftSection.className = 'note-toolbar-left';

        const timestamp = document.createElement('span');
        timestamp.textContent = new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        timestamp.style.fontSize = '0.8rem';
        timestamp.style.color = 'rgba(15, 23, 42, 0.5)';
        timestamp.className = 'note-timestamp';

        // Topic name input for small boxes only (not rectangle or notepad)
        if (note.type !== 'rectangle' && note.type !== 'notepad') {
            const topicInput = document.createElement('input');
            topicInput.type = 'text';
            topicInput.className = 'topic-name-input';
            topicInput.value = note.topicName || '';
            topicInput.placeholder = 'Topic name...';
            topicInput.style.width = '120px';
            topicInput.style.fontSize = '0.75rem';
            topicInput.style.padding = '0.2rem 0.4rem';
            topicInput.style.marginLeft = '0.5rem';
            topicInput.addEventListener('change', () => {
                note.topicName = topicInput.value || '';
                saveNotes();
            });
            topicInput.addEventListener('blur', () => {
                note.topicName = topicInput.value || '';
                saveNotes();
            });
            leftSection.append(topicInput);
        }

        leftSection.append(timestamp);

        const rightSection = document.createElement('div');
        rightSection.className = 'note-toolbar-right';

        // Expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-box-btn';
        expandBtn.textContent = note.expanded ? '−' : '+';
        expandBtn.title = note.expanded ? 'Collapse' : 'Expand';
        expandBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            note.expanded = !note.expanded;
            if (note.expanded) {
                noteBox.classList.add('expanded');
                noteBox.style.width = note.expandedWidth || '600px';
                noteBox.style.height = note.expandedHeight || '400px';
            } else {
                noteBox.classList.remove('expanded');
                noteBox.style.width = note.width;
                noteBox.style.height = note.height;
            }
            expandBtn.textContent = note.expanded ? '−' : '+';
            expandBtn.title = note.expanded ? 'Collapse' : 'Expand';
            saveNotes();
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-box-btn';
        deleteBtn.textContent = '×';
        deleteBtn.addEventListener('click', () => {
            notes = notes.filter(n => n.id !== note.id);
            saveNotes();
            renderNotes();
        });

        rightSection.append(expandBtn, deleteBtn);
        toolbar.append(leftSection, rightSection);

        const content = document.createElement('div');
        content.className = 'note-content';
        if (note.type === 'notepad') {
            content.classList.add('notepad-content');
        }
        content.contentEditable = 'true';
        content.spellcheck = false;

        // For notepad, create lines background
        if (note.type === 'notepad') {
            const numLines = note.numLines || 20;
            const lineHeight = 24;
            content.style.lineHeight = `${lineHeight}px`;
            content.style.minHeight = `${numLines * lineHeight}px`;
            content.style.backgroundImage = `repeating-linear-gradient(
                transparent,
                transparent ${lineHeight - 1}px,
                rgba(0, 0, 0, 0.1) ${lineHeight - 1}px,
                rgba(0, 0, 0, 0.1) ${lineHeight}px
            )`;
            content.style.backgroundSize = `100% ${lineHeight}px`;
            content.style.paddingTop = '0.5rem';
        }

        // Preserve line breaks and formatting
        content.innerText = note.content || '';
        content.addEventListener('input', () => {
            // Use innerText to preserve line breaks and formatting
            note.content = content.innerText;
            note.updatedAt = Date.now();
            timestamp.textContent = new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            saveNotes();
        });

        noteBox.append(toolbar, content);

        // All boxes are draggable when dragging is enabled
        if (draggingEnabled) {
            enableDrag(noteBox, note);
        }

        const observer = new ResizeObserver(() => {
            if (!note.expanded) {
                note.width = `${noteBox.offsetWidth}px`;
                note.height = `${noteBox.offsetHeight}px`;
            } else {
                note.expandedWidth = `${noteBox.offsetWidth}px`;
                note.expandedHeight = `${noteBox.offsetHeight}px`;
            }
            saveNotes();
        });
        observer.observe(noteBox);

        return noteBox;
    }

    function enableDrag(element, note) {
        let offsetX = 0;
        let offsetY = 0;
        let dragging = false;

        element.addEventListener('mousedown', (event) => {
            if (!draggingEnabled || event.target.closest('.note-content')) return;
            dragging = true;
            element.classList.add('dragging');
            offsetX = event.clientX - element.offsetLeft;
            offsetY = event.clientY - element.offsetTop;
        });

        window.addEventListener('mousemove', (event) => {
            if (!dragging) return;
            let x = event.clientX - offsetX;
            let y = event.clientY - offsetY;
            if (snapEnabled) {
                // Snap to 30px grid to match the visual grid
                x = snapToGrid(x);
                y = snapToGrid(y);
            }
            element.style.left = `${x}px`;
            element.style.top = `${y}px`;
        });

        window.addEventListener('mouseup', () => {
            if (!dragging) return;
            dragging = false;
            element.classList.remove('dragging');
            note.left = element.style.left;
            note.top = element.style.top;
            note.updatedAt = Date.now();
            saveNotes();
        });
    }

    // Helper function to snap to grid (30px grid)
    function snapToGrid(value) {
        return Math.round(value / 30) * 30;
    }

    // Helper function to check if a position overlaps with existing notes
    // Checks both small boxes and rectangle boxes
    function isPositionOccupied(x, y, width, height, excludeId = null) {
        return notes.some(note => {
            if (note.id === excludeId) return false;

            const noteX = parseFloat(note.left);
            const noteY = parseFloat(note.top);
            const noteWidth = parseFloat(note.width);
            const noteHeight = parseFloat(note.height);

            // Check for overlap (works for both small boxes and rectangles)
            return !(x + width < noteX || x > noteX + noteWidth ||
                y + height < noteY || y > noteY + noteHeight);
        });
    }

    // Helper function to find first available position at current viewport
    // Places boxes in a single column, one per row, moving down vertically
    function findAvailablePosition(startY, noteWidth, noteHeight) {
        const padding = 16;
        const gridSize = 30;
        const viewportWidth = drawingArea.clientWidth;
        const scrollLeft = drawingArea.scrollLeft;

        // Start from the top of visible viewport, aligned to grid
        let currentY = snapToGrid(startY);
        if (currentY < padding) currentY = padding;

        // Use a single X position (center of viewport) - one column only
        const fixedX = snapToGrid(scrollLeft + (viewportWidth / 2) - (noteWidth / 2));
        const x = Math.max(padding, Math.min(fixedX, drawingArea.scrollWidth - noteWidth - padding));

        // Move down vertically (Y axis only) until we find an available spot
        let y = currentY;
        const maxY = drawingArea.scrollHeight - noteHeight - padding;

        // Try moving down grid rows until we find an available position
        // One box per row in a single column
        for (let i = 0; i < 100; i++) { // Increased limit to allow more vertical stacking
            if (y > maxY) break;

            if (!isPositionOccupied(x, y, noteWidth, noteHeight)) {
                return { x, y };
            }

            // Move down by one grid row (30px)
            y += gridSize;
        }

        // If no position found after many attempts, use the starting position
        return { x, y: currentY };
    }

    function createNote() {
        // Get current scroll position and viewport dimensions
        const scrollTop = drawingArea.scrollTop;
        const viewportHeight = drawingArea.clientHeight;

        // Note dimensions
        const noteWidth = 220;
        const noteHeight = 140;
        const padding = 16;

        // Start position: top of visible viewport
        const startY = scrollTop + padding;

        // Find first available grid position
        const position = findAvailablePosition(startY, noteWidth, noteHeight);

        // Snap to grid and ensure within bounds
        const left = `${Math.max(padding, Math.min(position.x, drawingArea.scrollWidth - noteWidth - padding))}px`;
        const top = `${Math.max(padding, Math.min(position.y, drawingArea.scrollHeight - noteHeight - padding))}px`;

        return {
            id: crypto.randomUUID(),
            content: 'Type your note...',
            color: selectedColor,
            left,
            top,
            width: '220px',
            height: '140px',
            type: 'note',
            expanded: false,
            topicName: '',
            updatedAt: Date.now()
        };
    }

    // Helper function to find available position for rectangle boxes
    // Uses same column logic but accounts for full width
    function findAvailableRectanglePosition(startY, rectWidth, rectHeight) {
        const padding = 16;
        const gridSize = 30;

        // Start from the top of visible viewport, aligned to grid
        let currentY = snapToGrid(startY);
        if (currentY < padding) currentY = padding;

        // Rectangle uses full width (left edge at padding)
        const x = padding;

        // Move down vertically (Y axis only) until we find an available spot
        let y = currentY;
        const maxY = drawingArea.scrollHeight - rectHeight - padding;

        // Try moving down grid rows until we find an available position
        // One rectangle per row, stacking below existing boxes (both small and rectangle)
        for (let i = 0; i < 100; i++) {
            if (y > maxY) break;

            if (!isPositionOccupied(x, y, rectWidth, rectHeight)) {
                return { x, y };
            }

            // Move down by one grid row (30px)
            y += gridSize;
        }

        // If no position found, use the starting position
        return { x, y: currentY };
    }

    function createRectangleNote() {
        // Get current scroll position
        const scrollTop = drawingArea.scrollTop;

        // Account for padding (1rem = 16px typically)
        const padding = 16;

        // Height for 20 lines (approximately 20 * 24px = 480px)
        const rectHeight = 480;

        // Rectangle spans full width (accounting for padding on both sides)
        const rectWidth = drawingArea.clientWidth - (padding * 2);

        // Start position: top of visible viewport
        const startY = scrollTop + padding;

        // Find first available position (same column logic as small boxes)
        const position = findAvailableRectanglePosition(startY, rectWidth, rectHeight);

        return {
            id: crypto.randomUUID(),
            content: '\n'.repeat(19), // 20 lines (19 newlines + content area)
            color: selectedColor,
            left: `${position.x}px`,
            top: `${Math.max(padding, Math.min(position.y, drawingArea.scrollHeight - rectHeight - padding))}px`,
            width: `${rectWidth}px`,
            height: `${rectHeight}px`,
            type: 'rectangle',
            expanded: false,
            topicName: '',
            updatedAt: Date.now()
        };
    }

    function createNotepadNote(numLines) {
        // Get current scroll position
        const scrollTop = drawingArea.scrollTop;

        // Account for padding
        const padding = 16;

        // Calculate height based on line height (24px per line) + padding
        const lineHeight = 24;
        const notepadHeight = (numLines * lineHeight) + 40; // 40px for padding/toolbar

        // Notepad width (similar to rectangle but can be resized)
        const notepadWidth = drawingArea.clientWidth - (padding * 2);

        // Start position: top of visible viewport
        const startY = scrollTop + padding;

        // Find first available position
        const position = findAvailableRectanglePosition(startY, notepadWidth, notepadHeight);

        // Create content with empty lines
        const content = '\n'.repeat(numLines - 1);

        return {
            id: crypto.randomUUID(),
            content: content,
            color: selectedColor,
            left: `${position.x}px`,
            top: `${Math.max(padding, Math.min(position.y, drawingArea.scrollHeight - notepadHeight - padding))}px`,
            width: `${notepadWidth}px`,
            height: `${notepadHeight}px`,
            type: 'notepad',
            numLines: numLines,
            expanded: false,
            topicName: '',
            updatedAt: Date.now()
        };
    }

    function togglePlaceholder() {
        if (!placeholder) return;
        placeholder.style.display = notes.length ? 'none' : 'block';
    }

    function saveNotes() {
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    }

    function saveHistoryEntry() {
        // Find rectangle box with topic name, or use default name
        let boardName = `Saved Board ${new Date().toLocaleDateString()}`;
        const rectangleBox = notes.find(note => note.type === 'rectangle');
        if (rectangleBox) {
            // Use rectangle box topic name if available, otherwise use default
            boardName = rectangleBox.topicName || boardName;
        }

        const snapshotData = {
            id: currentSnapshotId || crypto.randomUUID(),
            name: boardName,
            savedAt: Date.now(),
            notes: notes.map(note => ({ ...note }))
        };

        if (currentSnapshotId) {
            const idx = history.findIndex(entry => entry.id === currentSnapshotId);
            if (idx !== -1) {
                history[idx] = { ...history[idx], ...snapshotData };
            } else {
                history.push(snapshotData);
            }
        } else {
            history.push(snapshotData);
        }

        localStorage.setItem(STORAGE_KEYS.noteHistory, JSON.stringify(history));
    }

    function deleteHistoryEntry(id) {
        history = history.filter(entry => entry.id !== id);
        if (currentSnapshotId === id) {
            currentSnapshotId = null;
        }
        localStorage.setItem(STORAGE_KEYS.noteHistory, JSON.stringify(history));
        renderHistory();
    }
}

function initNotepadPage() {
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('notepadSidebar');
    const explorerTree = document.getElementById('explorerTree');
    const editorContent = document.getElementById('editorContent');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const newFileBtn = document.getElementById('newFileBtn');
    const newFolderBtn = document.getElementById('newFolderBtn');

    if (!explorerTree) return; // Not on notepad page

    let projects = JSON.parse(localStorage.getItem(STORAGE_KEYS.notepadProjects) || '[]');
    let currentProjectId = null;
    let currentFileId = null;
    let selectedItemId = null; // Track selected item for creation context
    let selectedItemType = null; // 'project', 'folder', 'file'
    let expandedItems = new Set(); // Store IDs of expanded items (projects/folders)

    // Sidebar toggle functionality
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('collapsed');
        });
    }

    // Create save indicator
    const saveIndicator = document.createElement('div');
    saveIndicator.className = 'save-indicator';
    saveIndicator.textContent = 'Saved';
    document.body.appendChild(saveIndicator);

    function showSaveIndicator(status = 'saved') {
        saveIndicator.textContent = status === 'saving' ? 'Saving...' : 'Saved';
        saveIndicator.className = `save-indicator show ${status}`;
        setTimeout(() => {
            saveIndicator.classList.remove('show');
        }, 2000);
    }

    function saveProjects() {
        showSaveIndicator('saving');
        localStorage.setItem(STORAGE_KEYS.notepadProjects, JSON.stringify(projects));
        setTimeout(() => showSaveIndicator('saved'), 300);
    }

    // --- Helper Functions for Data Access ---

    function findProject(id) {
        return projects.find(p => p.id === id);
    }

    function findFolder(projectId, folderId) {
        const project = findProject(projectId);
        if (!project || !project.folders) return null;
        return project.folders.find(f => f.id === folderId);
    }

    function findFile(fileId) {
        for (const project of projects) {
            // Check root files
            if (project.files) {
                const file = project.files.find(f => f.id === fileId);
                if (file) return { file, parent: project, type: 'project' };
            }
            // Check folders
            if (project.folders) {
                for (const folder of project.folders) {
                    if (folder.files) {
                        const file = folder.files.find(f => f.id === fileId);
                        if (file) return { file, parent: folder, type: 'folder' };
                    }
                }
            }
        }
        return null;
    }

    // --- Tree Rendering Logic ---

    function renderTree() {
        explorerTree.innerHTML = '';

        if (projects.length === 0) {
            const empty = document.createElement('div');
            empty.style.padding = '1rem';
            empty.style.color = 'var(--color-subtle)';
            empty.style.textAlign = 'center';
            empty.style.fontSize = '0.85rem';
            empty.textContent = 'No projects yet. Click + to create one!';
            explorerTree.appendChild(empty);
            return;
        }

        // Render each project
        projects.forEach(project => {
            renderNode(project, 0, explorerTree, 'project');
        });
    }

    function renderNode(item, level, container, type, parentId = null) {
        // Container for the item itself
        const itemRow = document.createElement('div');
        itemRow.className = 'tree-item';
        itemRow.dataset.id = item.id;
        itemRow.dataset.type = type;
        if (parentId) itemRow.dataset.parentId = parentId;

        // Indentation using padding-left ONLY
        // Base padding 0.5rem + level * 1.2rem
        itemRow.style.paddingLeft = `${0.5 + (level * 1.2)}rem`;

        // Active state (Selection)
        if (item.id === selectedItemId) {
            itemRow.classList.add('active');
        }

        // Icon & Toggle
        const toggle = document.createElement('span');
        toggle.className = 'tree-item-toggle';
        const isExpanded = expandedItems.has(item.id);

        if (type === 'project' || type === 'folder') {
            toggle.textContent = isExpanded ? '▼' : '▶';
            toggle.onclick = (e) => {
                e.stopPropagation();
                toggleExpand(item.id);
            };
        } else {
            // Spacer for files
            toggle.innerHTML = '&nbsp;';
            toggle.style.cursor = 'default';
        }

        const icon = document.createElement('span');
        icon.className = 'tree-item-icon';

        if (type === 'project' || type === 'folder') {
            icon.style.display = 'none';
        } else {
            icon.textContent = '📄';
        }

        // Label (Editable)
        const labelContainer = document.createElement('div');
        labelContainer.className = 'tree-item-label-container';

        const labelSpan = document.createElement('span');
        labelSpan.className = 'tree-item-label';
        labelSpan.textContent = item.name;

        const labelInput = document.createElement('input');
        labelInput.type = 'text';
        labelInput.className = 'tree-item-label-input';
        labelInput.value = item.name;
        labelInput.style.display = 'none';

        // Edit Logic
        const startEditing = () => {
            labelSpan.style.display = 'none';
            labelInput.style.display = 'block';
            labelInput.focus();
            labelInput.select();
            itemRow.classList.add('editing');
        };

        const saveEdit = () => {
            const newName = labelInput.value.trim();
            if (newName && newName !== item.name) {
                item.name = newName;
                saveProjects();
            }
            labelSpan.textContent = item.name;
            labelInput.value = item.name;
            labelSpan.style.display = 'block';
            labelInput.style.display = 'none';
            itemRow.classList.remove('editing');
        };

        labelSpan.onclick = (e) => {
            e.stopPropagation();
            startEditing();
        };

        labelInput.onblur = saveEdit;
        labelInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveEdit();
            }
            if (e.key === 'Escape') {
                labelInput.value = item.name;
                saveEdit();
            }
        };

        // Auto-edit on creation
        if (item.isNew) {
            delete item.isNew;
            setTimeout(startEditing, 50);
        }

        labelContainer.append(labelSpan, labelInput);

        // Actions (Delete)
        const actions = document.createElement('div');
        actions.className = 'tree-item-actions';

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'tree-item-action-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            if (type === 'project') {
                deleteProject(item.id);
            } else if (type === 'folder') {
                deleteFolder(parentId, item.id);
            } else if (type === 'file') {
                deleteFile(item.id);
            }
        };

        actions.appendChild(deleteBtn);

        itemRow.append(toggle, icon, labelContainer, actions);
        container.appendChild(itemRow);

        // Click Behavior for Row (Selection)
        itemRow.onclick = (e) => {
            if (e.target !== toggle && e.target !== labelSpan && e.target !== labelInput && e.target !== deleteBtn) {
                // Set Selection
                selectedItemId = item.id;
                selectedItemType = type;

                if (type === 'file') {
                    selectFile(item.id);
                } else {
                    // For folders/projects, just rerender to show selection
                    renderTree();
                }
            }
        };

        // Render Children if expanded
        if ((type === 'project' || type === 'folder') && isExpanded) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'tree-item-children';

            let hasChildren = false;

            // Folders first
            if (item.folders) {
                item.folders.forEach(folder => {
                    renderNode(folder, level + 1, childrenContainer, 'folder', item.id);
                    hasChildren = true;
                });
            }

            // Files second
            if (item.files) {
                item.files.forEach(file => {
                    renderNode(file, level + 1, childrenContainer, 'file', item.id);
                    hasChildren = true;
                });
            }

            if (hasChildren) {
                container.appendChild(childrenContainer);
            }
        }
    }

    function toggleExpand(id) {
        if (expandedItems.has(id)) {
            expandedItems.delete(id);
        } else {
            expandedItems.add(id);
        }
        renderTree();
    }

    function selectFile(fileId) {
        currentFileId = fileId;
        const result = findFile(fileId);
        if (result) {
            renderEditor(result.file);
            renderTree();
        }
    }

    // --- Editor Logic ---

    function renderEditor(file) {
        editorContent.innerHTML = '';

        const editorContainer = document.createElement('div');
        editorContainer.className = 'notepad-editor-container';

        // Title (Editable)
        const titleInput = document.createElement('input');
        titleInput.className = 'notepad-title';
        titleInput.value = file.name;
        titleInput.placeholder = 'Untitled';
        titleInput.onchange = () => {
            file.name = titleInput.value || 'Untitled';
            saveProjects();
            renderTree();
        };

        // Content
        const textarea = document.createElement('textarea');
        textarea.className = 'notepad-editor';
        textarea.value = file.content || '';
        textarea.placeholder = 'Start typing...';
        textarea.oninput = () => {
            file.content = textarea.value;
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(saveProjects, 1000);
        };

        editorContainer.append(titleInput, textarea);
        editorContent.appendChild(editorContainer);
    }

    // --- Deletion Logic ---

    function deleteProject(projectId) {
        if (!confirm('Are you sure you want to delete this project? All files will be lost.')) return;
        projects = projects.filter(p => p.id !== projectId);
        if (currentProjectId === projectId) {
            currentProjectId = null;
            currentFileId = null;
            editorContent.innerHTML = '';
        }
        saveProjects();
        renderTree();
    }

    function deleteFolder(projectId, folderId) {
        const project = findProject(projectId);
        if (!project || !project.folders) return;

        if (!confirm('Are you sure you want to delete this folder? All files inside will be lost.')) return;

        project.folders = project.folders.filter(f => f.id !== folderId);
        saveProjects();
        renderTree();
    }

    function deleteFile(fileId) {
        if (!confirm('Are you sure you want to delete this file?')) return;

        let found = false;
        projects.forEach(project => {
            if (project.files) {
                const len = project.files.length;
                project.files = project.files.filter(f => f.id !== fileId);
                if (project.files.length < len) found = true;
            }
            if (project.folders) {
                project.folders.forEach(folder => {
                    if (folder.files) {
                        const len = folder.files.length;
                        folder.files = folder.files.filter(f => f.id !== fileId);
                        if (folder.files.length < len) found = true;
                    }
                });
            }
        });

        if (currentFileId === fileId) {
            currentFileId = null;
            editorContent.innerHTML = '';
        }

        if (found) {
            saveProjects();
            renderTree();
        }
    }

    // --- Creation Logic ---

    newProjectBtn.addEventListener('click', () => {
        try {
            const id = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString(36) + Math.random().toString(36).substr(2);

            const newProject = {
                id: id,
                name: 'Main Folder',
                folders: [],
                files: [],
                isNew: true
            };

            if (!Array.isArray(projects)) projects = [];
            projects.push(newProject);
            expandedItems.add(newProject.id);
            // Select the new project
            selectedItemId = newProject.id;
            selectedItemType = 'project';
            saveProjects();
            renderTree();

            // Scroll to bottom to see new project
            setTimeout(() => {
                explorerTree.scrollTop = explorerTree.scrollHeight;
            }, 100);
        } catch (err) {
            console.error('Error creating project:', err);
            alert('Failed to create project. Please try again.');
        }
    });

    newFolderBtn.addEventListener('click', () => {
        // If no projects exist, or if user hasn't selected anything,
        // assume they want a NEW root-level folder (Project).
        if (projects.length === 0 || (!selectedItemId && !selectedItemType)) {
            newProjectBtn.click(); // Reuse existing "New Project" logic
            return;
        }

        let targetProject = null;

        // Determine target project based on selection
        if (selectedItemId && selectedItemType) {
            if (selectedItemType === 'project') {
                targetProject = findProject(selectedItemId);
            } else if (selectedItemType === 'folder') {
                alert('Cannot create nested folders inside a Subfolder. Please select a Main Folder.');
                return;
            } else if (selectedItemType === 'file') {
                const info = findFile(selectedItemId);
                if (info) {
                    if (info.type === 'project') {
                        targetProject = info.parent;
                    } else if (info.type === 'folder') {
                        // If file is in a folder, we can't create a folder inside that folder.
                        // But maybe they want a sibling folder?
                        // Let's assume sibling to the parent folder.
                        const folderId = info.parent.id;
                        targetProject = projects.find(p => p.folders && p.folders.some(f => f.id === folderId));
                    }
                }
            }
        }

        // Behavior Change: If nothing specific is found (should be covered by top check),
        // or if we fell through, prevent "random" creation.
        if (!targetProject) {
            // If we really couldn't find a context but projects exist (unlikely given checks),
            // create a new root folder.
            newProjectBtn.click();
            return;
        }

        const newFolder = {
            id: crypto.randomUUID(),
            name: 'New Subfolder',
            files: [],
            isNew: true
        };

        if (!targetProject.folders) targetProject.folders = [];
        targetProject.folders.push(newFolder);
        expandedItems.add(targetProject.id);
        expandedItems.add(newFolder.id);

        // Select the new folder
        selectedItemId = newFolder.id;
        selectedItemType = 'folder';

        saveProjects();
        renderTree();
    });

    newFileBtn.addEventListener('click', () => {
        if (projects.length === 0) {
            alert('Please create a Project first.');
            return;
        }

        let targetContainer = null; // Can be project or folder
        let targetProject = null; // We need this to save

        // Determine target based on selection
        if (selectedItemId && selectedItemType) {
            if (selectedItemType === 'project') {
                targetProject = findProject(selectedItemId);
                targetContainer = targetProject;
            } else if (selectedItemType === 'folder') {
                // Find project for this folder
                targetProject = projects.find(p => p.folders && p.folders.some(f => f.id === selectedItemId));
                if (targetProject) {
                    targetContainer = targetProject.folders.find(f => f.id === selectedItemId);
                }
            } else if (selectedItemType === 'file') {
                const info = findFile(selectedItemId);
                if (info) {
                    // Add as sibling
                    targetContainer = info.parent;
                    if (info.type === 'project') {
                        targetProject = info.parent;
                    } else {
                        // File in folder
                        const folderId = info.parent.id;
                        targetProject = projects.find(p => p.folders && p.folders.some(f => f.id === folderId));
                    }
                }
            }
        }

        if (!targetContainer) {
            targetProject = projects[projects.length - 1];
            targetContainer = targetProject;
        }

        const newFile = {
            id: crypto.randomUUID(),
            name: 'New File',
            content: '',
            isNew: true
        };

        if (!targetContainer.files) targetContainer.files = [];
        targetContainer.files.push(newFile);

        expandedItems.add(targetProject.id);
        if (targetContainer !== targetProject) {
            // It's a folder, expand it?
            // Wait, we don't have folder ID handy if we just have container object unless we look it up.
            // But if it IS a folder object, it has an ID.
            if (targetContainer.id) expandedItems.add(targetContainer.id);
        }

        saveProjects();
        renderTree();
        selectFile(newFile.id);
        // selectFile updates selectedItemId/Type implicitly if we update logic in selectFile? 
        // selectFile calls found logic.

        // Explicitly set selection to new file
        selectedItemId = newFile.id;
        selectedItemType = 'file';
        renderTree();
    });

    // Initial Render
    renderTree();
}

