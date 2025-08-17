// Dashboard functionality - Habit tracking system

class HabitTracker {
  constructor() {
    this.habits = storage.get('smart-habits', []);
    this.currentView = 'grid';
    this.currentUser = storage.get('currentUser');
    this.init();
  }

  init() {
    // Check authentication
    if (!this.currentUser) {
      window.location.href = 'login.html';
      return;
    }

    this.updateUserInfo();
    this.bindEvents();
    this.render();
    this.updateStats();
  }

  updateUserInfo() {
    const userName = document.querySelector('.user-name');
    if (userName && this.currentUser) {
      userName.textContent = `Welcome, ${this.currentUser.name}!`;
    }

    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar && this.currentUser) {
      userAvatar.src = this.currentUser.avatar;
    }
  }

  bindEvents() {
    // Form submission
    const form = document.getElementById('habit-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleAddHabit(e));
    }

    // View toggle
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => this.handleViewToggle(btn));
    });

    // Input validation
    const input = document.getElementById('habit-name');
    if (input) {
      input.addEventListener('input', (e) => this.validateInput(e));
    }

    // User dropdown
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
      dropdownToggle.addEventListener('click', () => {
        dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdownToggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
          dropdownMenu.style.display = 'none';
        }
      });
    }

    // Logout functionality
    const logoutBtn = document.querySelector('.dropdown-item[href="index.html"]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }
  }

  handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
      storage.remove('currentUser');
      toast.show('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  }

  handleAddHabit(e) {
    e.preventDefault();
    const input = document.getElementById('habit-name');
    const name = input.value.trim();

    if (!name) {
      toast.show('Please enter a habit name', 'error');
      return;
    }

    if (name.length > 50) {
      toast.show('Habit name is too long (max 50 characters)', 'error');
      return;
    }

    // Check for duplicate habits
    if (this.habits.some(habit => habit.name.toLowerCase() === name.toLowerCase())) {
      toast.show('This habit already exists', 'error');
      return;
    }

    const habit = {
      id: utils.generateId(),
      name: name,
      createdAt: new Date().toISOString(),
      completions: [],
      streak: 0,
      totalCompletions: 0,
      userId: this.currentUser.id
    };

    this.habits.push(habit);
    this.saveHabits();
    this.render();
    this.updateStats();
    
    input.value = '';
    toast.show('Habit added successfully! 🎉');
    
    // Animate new habit card
    setTimeout(() => {
      const newCard = document.querySelector(`.habit-card[data-id="${habit.id}"]`);
      if (newCard) {
        animations.slideIn(newCard, 'up');
      }
    }, 50);
  }

  handleViewToggle(btn) {
    const view = btn.dataset.view;
    if (view === this.currentView) return;

    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.currentView = view;
    this.render();
  }

  validateInput(e) {
    const input = e.target;
    const value = input.value;
    
    if (value.length > 50) {
      input.style.borderColor = 'var(--error)';
      toast.show('Habit name is too long (max 50 characters)', 'warning');
    } else {
      input.style.borderColor = 'var(--gray-200)';
    }
  }

  toggleHabit(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    const today = new Date().toDateString();
    const completionIndex = habit.completions.findIndex(
      comp => new Date(comp.date).toDateString() === today
    );

    if (completionIndex === -1) {
      // Mark as complete
      habit.completions.push({
        date: new Date().toISOString(),
        completed: true
      });
      habit.totalCompletions++;
      this.calculateStreak(habit);
      toast.show('Great job! Habit completed! 🎉');
    } else {
      // Mark as incomplete
      habit.completions.splice(completionIndex, 1);
      habit.totalCompletions = Math.max(0, habit.totalCompletions - 1);
      this.calculateStreak(habit);
      toast.show('Habit marked as incomplete', 'warning');
    }

    this.saveHabits();
    this.render();
    this.updateStats();
  }

  deleteHabit(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return;

    if (confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
      this.habits = this.habits.filter(h => h.id !== habitId);
      this.saveHabits();
      this.render();
      this.updateStats();
      toast.show('Habit deleted successfully');
    }
  }

  calculateStreak(habit) {
    if (!habit.completions.length) {
      habit.streak = 0;
      return;
    }

    // Sort completions by date (newest first)
    const sortedCompletions = habit.completions
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const completion of sortedCompletions) {
      const completionDate = new Date(completion.date);
      completionDate.setHours(0, 0, 0, 0);

      const dayDifference = (currentDate - completionDate) / (1000 * 60 * 60 * 24);

      if (dayDifference === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (dayDifference === streak - 1 && streak === 1) {
        // Handle today's completion
        continue;
      } else {
        break;
      }
    }

    habit.streak = streak;
  }

  isCompletedToday(habit) {
    const today = new Date().toDateString();
    return habit.completions.some(
      comp => new Date(comp.date).toDateString() === today
    );
  }

  getCompletionRate(habit) {
    const daysSinceCreated = Math.max(1, 
      Math.ceil((new Date() - new Date(habit.createdAt)) / (1000 * 60 * 60 * 24))
    );
    return Math.round((habit.totalCompletions / daysSinceCreated) * 100);
  }

  render() {
    const container = document.getElementById('habits-container');
    const emptyState = document.getElementById('empty-state');

    if (!container) return;

    if (this.habits.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      container.className = this.currentView === 'grid' ? 'habits-grid' : 'habits-list';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    container.className = this.currentView === 'grid' ? 'habits-grid' : 'habits-list';

    const habitsHtml = this.habits.map(habit => {
      const isCompleted = this.isCompletedToday(habit);
      const completionRate = this.getCompletionRate(habit);

      return `
        <div class="habit-card ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
          <div class="habit-header">
            <h3 class="habit-name">${utils.escapeHtml(habit.name)}</h3>
            <div class="habit-actions">
              <button class="btn-icon delete" onclick="habitTracker.deleteHabit('${habit.id}')" title="Delete habit">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          
          <div class="habit-stats">
            <div class="habit-streak">
              <i class="fas fa-fire"></i>
              <span>${habit.streak} day streak</span>
            </div>
            <div class="habit-completion">
              ${completionRate}% completion rate
            </div>
          </div>
          
          <div class="habit-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${completionRate}%"></div>
            </div>
          </div>
          
          <div class="habit-footer">
            <div class="habit-completion">
              Total: ${habit.totalCompletions} completions
            </div>
            ${isCompleted ? 
              `<div class="habit-status">
                <i class="fas fa-check-circle"></i>
                Completed Today
              </div>` :
              `<button class="btn-complete" onclick="habitTracker.toggleHabit('${habit.id}')">
                <i class="fas fa-check"></i>
                Mark Complete
              </button>`
            }
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = habitsHtml;
  }

  updateStats() {
    const totalHabits = this.habits.length;
    const completedToday = this.habits.filter(habit => this.isCompletedToday(habit)).length;
    const completionRate = totalHabits === 0 ? 0 : Math.round((completedToday / totalHabits) * 100);

    const totalHabitsEl = document.getElementById('total-habits');
    const completedTodayEl = document.getElementById('completed-today');
    const completionRateEl = document.getElementById('completion-rate');

    if (totalHabitsEl) totalHabitsEl.textContent = totalHabits;
    if (completedTodayEl) completedTodayEl.textContent = completedToday;
    if (completionRateEl) completionRateEl.textContent = `${completionRate}%`;
  }

  saveHabits() {
    storage.set('smart-habits', this.habits);
  }

  // Export data functionality
  exportData() {
    const data = {
      habits: this.habits,
      user: this.currentUser,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart-habits-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.show('Data exported successfully!');
  }
}

// Initialize the habit tracker
let habitTracker;

document.addEventListener('DOMContentLoaded', () => {
  habitTracker = new HabitTracker();

  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to add habit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const form = document.getElementById('habit-form');
      if (form) {
        const event = new Event('submit');
        form.dispatchEvent(event);
      }
    }
    
    // Escape to clear input
    if (e.key === 'Escape') {
      const input = document.getElementById('habit-name');
      if (input && document.activeElement === input) {
        input.value = '';
        input.blur();
      }
    }
  });
});