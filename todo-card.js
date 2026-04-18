/* TODO CARD — STAGE 1  |  todo-card.js */

/* ── State ───────────────────────────────────────────────── */
const state = {
  title:       'Redesign onboarding flow for mobile users',
  description: 'Update the step-by-step onboarding screens to improve completion rates on iOS and Android. Coordinate with the copy team on microcopy changes and ensure WCAG AA compliance throughout. This includes reviewing all existing flows, running usability tests with five participants, and delivering final Figma specs to the engineering team by the due date.',
  priority:    'High',
  status:      'In Progress',
  due:         new Date('2026-05-01T18:00:00Z'),
  expanded:    false,
};

const COLLAPSE_THRESHOLD = 120; // chars before we clamp

/* ── DOM refs ────────────────────────────────────────────── */
const card             = document.getElementById('todo-card');
const viewMode         = document.getElementById('view-mode');
const editMode         = document.getElementById('edit-mode');

const titleEl          = document.getElementById('todo-title');
const descriptionEl    = document.getElementById('todo-description');
const collapsibleEl    = document.getElementById('todo-collapsible');
const expandBtn        = document.getElementById('expand-btn');

const priorityBadge    = document.getElementById('priority-badge');
const statusBadge      = document.getElementById('status-badge');
const priorityIndicator= document.querySelector('[data-testid="test-todo-priority-indicator"]');
const overdueIndicator = document.querySelector('[data-testid="test-todo-overdue-indicator"]');

const timeRemainingEl  = document.getElementById('time-remaining-el');
const dueDateDisplay   = document.getElementById('due-date-display');

const checkbox         = document.getElementById('todo-complete');
const statusControl    = document.getElementById('status-control');

const editBtn          = document.getElementById('edit-btn');
const deleteBtn        = document.getElementById('delete-btn');

const editForm         = document.getElementById('edit-form');
const editTitleInput   = document.getElementById('edit-title-input');
const editDescInput    = document.getElementById('edit-description-input');
const editPrioritySelect = document.getElementById('edit-priority-select');
const editDueDateInput = document.getElementById('edit-due-date-input');
const saveBtn          = document.getElementById('save-btn');
const cancelBtn        = document.getElementById('cancel-btn');

let timerInterval = null;

/* TIME LOGIC */

function friendlyRemaining(due) {
  if (state.status === 'Done') {
    return { text: 'Completed', cls: 'time-done' };
  }

  const diffMs   = due - Date.now();
  const diffMins = Math.round(diffMs / 60000);
  const absMin   = Math.abs(diffMins);

  if (absMin < 2)  return { text: 'Due now!', cls: 'time-overdue' };

  if (diffMins < 0) {
    if (absMin < 60) return { text: `Overdue by ${absMin} minute${absMin !== 1 ? 's' : ''}`, cls: 'time-overdue' };
    const h = Math.floor(absMin / 60);
    if (h < 24) return { text: `Overdue by ${h} hour${h !== 1 ? 's' : ''}`, cls: 'time-overdue' };
    const d = Math.floor(h / 24);
    return { text: `Overdue by ${d} day${d !== 1 ? 's' : ''}`, cls: 'time-overdue' };
  }

  if (diffMins < 60) return { text: `Due in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`, cls: 'time-soon' };
  const h = Math.floor(diffMins / 60);
  if (h < 24) return { text: `Due in ${h} hour${h !== 1 ? 's' : ''}`, cls: 'time-soon' };
  if (h < 48) return { text: 'Due tomorrow', cls: 'time-soon' };
  const d = Math.floor(h / 24);
  return { text: `Due in ${d} day${d !== 1 ? 's' : ''}`, cls: d <= 7 ? 'time-soon' : 'time-fine' };
}

function updateTimeDisplay() {
  const { text, cls } = friendlyRemaining(state.due);
  timeRemainingEl.textContent = text;
  timeRemainingEl.className   = cls;

  const isOverdue = state.status !== 'Done' && state.due < Date.now();
  overdueIndicator.classList.toggle('hidden', !isOverdue);
}

function startTimer() {
  clearInterval(timerInterval);
  updateTimeDisplay();
  timerInterval = setInterval(updateTimeDisplay, 30000);
}

/* PRIORITY RENDERING */

const PRIORITY_BADGE_CLASS = {
  High:   'badge priority-high',
  Medium: 'badge priority-medium',
  Low:    'badge priority-low',
};
const PRIORITY_INDICATOR_CLASS = {
  High:   'priority-indicator high',
  Medium: 'priority-indicator medium',
  Low:    'priority-indicator low',
};

function applyPriority(priority) {
  priorityBadge.textContent = priority;
  priorityBadge.className   = PRIORITY_BADGE_CLASS[priority] || PRIORITY_BADGE_CLASS.High;
  priorityBadge.setAttribute('aria-label', `Priority: ${priority}`);
  priorityIndicator.className = PRIORITY_INDICATOR_CLASS[priority] || PRIORITY_INDICATOR_CLASS.High;
}

/* STATUS RENDERING */

const STATUS_BADGE_CLASS = {
  Pending:      'badge status-pending',
  'In Progress':'badge status-in-progress',
  Done:         'badge status-done',
};

function applyStatus(newStatus) {
  state.status = newStatus;

  statusBadge.textContent = newStatus;
  statusBadge.className   = STATUS_BADGE_CLASS[newStatus] || STATUS_BADGE_CLASS.Pending;
  statusBadge.setAttribute('aria-label', `Status: ${newStatus}`);

  // Sync select
  statusControl.value = newStatus;

  // Sync checkbox
  const isDone = newStatus === 'Done';
  checkbox.checked = isDone;

  // Sync title strike-through
  titleEl.classList.toggle('done', isDone);

  // Sync card opacity
  card.classList.toggle('is-done', isDone);

  // Stop / start timer
  updateTimeDisplay();
}

/* DESCRIPTION — EXPAND / COLLAPSE */

function renderDescription() {
  const text = state.description;
  const needsClamp = text.length > COLLAPSE_THRESHOLD;

  if (!needsClamp) {
    descriptionEl.textContent = text;
    descriptionEl.classList.remove('clamped');
    expandBtn.classList.add('hidden');
    collapsibleEl.classList.remove('open');
    collapsibleEl.setAttribute('aria-hidden', 'true');
    return;
  }

  // Split: show first ~COLLAPSE_THRESHOLD chars, rest in collapsible
  const splitPoint = text.lastIndexOf(' ', COLLAPSE_THRESHOLD) || COLLAPSE_THRESHOLD;
  const visible    = text.slice(0, splitPoint) + '…';
  const rest       = text.slice(splitPoint).replace(/^[\s…]+/, '');

  descriptionEl.textContent = state.expanded ? text : visible;
  collapsibleEl.textContent = '';

  expandBtn.classList.remove('hidden');
  expandBtn.textContent      = state.expanded ? 'Show less' : 'Show more';
  expandBtn.setAttribute('aria-expanded', String(state.expanded));

  collapsibleEl.classList.toggle('open', state.expanded);
  collapsibleEl.setAttribute('aria-hidden', String(!state.expanded));
}

expandBtn.addEventListener('click', () => {
  state.expanded = !state.expanded;
  renderDescription();
});

/* CHECKBOX TOGGLE */

checkbox.addEventListener('change', function () {
  applyStatus(this.checked ? 'Done' : 'Pending');
});

/* STATUS CONTROL (dropdown) */

statusControl.addEventListener('change', function () {
  applyStatus(this.value);
});

/* EDIT MODE */

function formatDateForInput(date) {
  // Returns YYYY-MM-DD for <input type="date">
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateForDisplay(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function openEditMode() {
  // Populate form with current state
  editTitleInput.value           = state.title;
  editDescInput.value            = state.description;
  editPrioritySelect.value       = state.priority;
  editDueDateInput.value         = formatDateForInput(state.due);

  viewMode.classList.add('hidden');
  viewMode.setAttribute('aria-hidden', 'true');

  editMode.classList.remove('hidden');
  editMode.setAttribute('aria-hidden', 'false');

  // Move focus into form
  editTitleInput.focus();
}

function closeEditMode(restoreFocus = true) {
  editMode.classList.add('hidden');
  editMode.setAttribute('aria-hidden', 'true');

  viewMode.classList.remove('hidden');
  viewMode.setAttribute('aria-hidden', 'false');

  if (restoreFocus) editBtn.focus();
}

function saveEdit() {
  const newTitle = editTitleInput.value.trim();
  if (!newTitle) {
    editTitleInput.focus();
    editTitleInput.style.borderColor = '#a32d2d';
    return;
  }
  editTitleInput.style.borderColor = '';

  // Persist to state
  state.title       = newTitle;
  state.description = editDescInput.value.trim();
  state.priority    = editPrioritySelect.value;

  const inputDate = editDueDateInput.value;
  if (inputDate) {
    state.due = new Date(inputDate + 'T18:00:00Z');
    dueDateDisplay.textContent = `Due ${formatDateForDisplay(state.due)}`;
    dueDateDisplay.setAttribute('datetime', state.due.toISOString());
  }

  // Re-render
  titleEl.textContent = state.title;
  applyPriority(state.priority);
  renderDescription();
  updateTimeDisplay();

  closeEditMode();
}

editBtn.addEventListener('click', openEditMode);

cancelBtn.addEventListener('click', () => closeEditMode());

saveBtn.addEventListener('click', saveEdit);

editForm.addEventListener('submit', saveEdit);

deleteBtn.addEventListener('click', () => {
  if (confirm('Delete this task?')) {
    console.log('Task deleted');
  }
});

/* ── Focus trap inside edit form (Tab / Shift+Tab) ─────── */
const FOCUSABLE = 'input, textarea, select, button';

editMode.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  const focusable = Array.from(editMode.querySelectorAll(FOCUSABLE));
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});

/* Close edit mode with Escape */
editMode.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeEditMode();
});

/* INIT */

applyPriority(state.priority);
applyStatus(state.status);
renderDescription();
startTimer();
