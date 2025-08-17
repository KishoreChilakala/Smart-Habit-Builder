// Authentication functionality

class AuthManager {
  constructor() {
    this.currentUser = storage.get('currentUser');
    this.init();
  }

  init() {
    this.bindEvents();
    this.setupPasswordStrength();
  }

  bindEvents() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn));
    });

    // Form submissions
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Social login buttons
    document.querySelectorAll('.btn-social').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleSocialLogin(e));
    });

    // Real-time validation
    this.setupRealTimeValidation();
  }

  switchTab(activeBtn) {
    const tabType = activeBtn.dataset.tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    activeBtn.classList.add('active');

    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.remove('active');
    });
    document.getElementById(`${tabType}-form`).classList.add('active');

    // Update header text
    const header = document.querySelector('.auth-header');
    if (tabType === 'login') {
      header.querySelector('h1').textContent = 'Welcome Back';
      header.querySelector('p').textContent = 'Sign in to continue your habit-building journey';
    } else {
      header.querySelector('h1').textContent = 'Create Account';
      header.querySelector('p').textContent = 'Start your habit-building journey today';
    }
  }

  setupPasswordStrength() {
    const passwordInput = document.getElementById('signup-password');
    if (!passwordInput) return;

    const strengthBar = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    passwordInput.addEventListener('input', (e) => {
      const password = e.target.value;
      const strength = this.calculatePasswordStrength(password);
      
      strengthBar.className = `strength-fill ${strength.level}`;
      strengthText.textContent = `Password strength: ${strength.text}`;
    });
  }

  calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('at least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('uppercase letter');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('number');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('special character');

    const levels = {
      0: { level: '', text: 'Very weak' },
      1: { level: 'weak', text: 'Weak' },
      2: { level: 'weak', text: 'Weak' },
      3: { level: 'fair', text: 'Fair' },
      4: { level: 'good', text: 'Good' },
      5: { level: 'strong', text: 'Strong' }
    };

    return levels[score];
  }

  setupRealTimeValidation() {
    // Email validation
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
      input.addEventListener('blur', () => {
        if (input.value && !utils.isValidEmail(input.value)) {
          this.showFieldError(input, 'Please enter a valid email address');
        } else {
          this.clearFieldError(input);
        }
      });
    });

    // Password confirmation
    const confirmPassword = document.getElementById('confirm-password');
    const signupPassword = document.getElementById('signup-password');
    
    if (confirmPassword && signupPassword) {
      confirmPassword.addEventListener('blur', () => {
        if (confirmPassword.value && confirmPassword.value !== signupPassword.value) {
          this.showFieldError(confirmPassword, 'Passwords do not match');
        } else {
          this.clearFieldError(confirmPassword);
        }
      });
    }
  }

  showFieldError(input, message) {
    this.clearFieldError(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.style.color = 'var(--error)';
    errorDiv.style.fontSize = 'var(--font-size-sm)';
    errorDiv.style.marginTop = 'var(--space-1)';
    errorDiv.textContent = message;
    
    input.style.borderColor = 'var(--error)';
    input.parentNode.parentNode.appendChild(errorDiv);
  }

  clearFieldError(input) {
    const existingError = input.parentNode.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    input.style.borderColor = 'var(--gray-200)';
  }

  async handleLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');

    // Basic validation
    if (!email || !password) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!utils.isValidEmail(email)) {
      toast.show('Please enter a valid email address', 'error');
      return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
    submitBtn.disabled = true;

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      // For demo purposes, accept any email/password combination
      const user = {
        id: utils.generateId(),
        name: email.split('@')[0],
        email: email,
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
        loginTime: new Date().toISOString()
      };

      // Store user data
      storage.set('currentUser', user);
      if (remember) {
        storage.set('rememberUser', true);
      }

      toast.show('Login successful! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);

    } catch (error) {
      toast.show('Login failed. Please try again.', 'error');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async handleSignup(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const terms = formData.get('terms');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      toast.show('Please fill in all fields', 'error');
      return;
    }

    if (!utils.isValidEmail(email)) {
      toast.show('Please enter a valid email address', 'error');
      return;
    }

    if (password !== confirmPassword) {
      toast.show('Passwords do not match', 'error');
      return;
    }

    if (password.length < 8) {
      toast.show('Password must be at least 8 characters long', 'error');
      return;
    }

    if (!terms) {
      toast.show('Please accept the terms and conditions', 'error');
      return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
    submitBtn.disabled = true;

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      // Create user account
      const user = {
        id: utils.generateId(),
        name: name,
        email: email,
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&dpr=1',
        signupTime: new Date().toISOString()
      };

      // Store user data
      storage.set('currentUser', user);

      toast.show('Account created successfully! Redirecting...', 'success');
      
      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1500);

    } catch (error) {
      toast.show('Signup failed. Please try again.', 'error');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  handleSocialLogin(e) {
    e.preventDefault();
    const provider = e.target.classList.contains('google') ? 'Google' : 'Facebook';
    
    // Show loading state
    const originalText = e.target.innerHTML;
    e.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    e.target.disabled = true;

    // Simulate social login
    setTimeout(() => {
      toast.show(`${provider} login is not implemented in this demo`, 'info');
      e.target.innerHTML = originalText;
      e.target.disabled = false;
    }, 1000);
  }

  async simulateApiCall() {
    // Simulate network delay
    return new Promise(resolve => {
      setTimeout(resolve, 1000 + Math.random() * 1000);
    });
  }

  logout() {
    storage.remove('currentUser');
    storage.remove('rememberUser');
    toast.show('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

// Password toggle functionality
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const toggle = input.parentNode.querySelector('.password-toggle i');
  
  if (input.type === 'password') {
    input.type = 'text';
    toggle.classList.remove('fa-eye');
    toggle.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    toggle.classList.remove('fa-eye-slash');
    toggle.classList.add('fa-eye');
  }
}

// Initialize authentication manager
const authManager = new AuthManager();

// Check if user should be redirected
document.addEventListener('DOMContentLoaded', () => {
  const currentUser = storage.get('currentUser');
  const currentPage = window.location.pathname.split('/').pop();
  
  // Redirect authenticated users away from login page
  if (currentUser && currentPage === 'login.html') {
    window.location.href = 'home.html';
  }
});