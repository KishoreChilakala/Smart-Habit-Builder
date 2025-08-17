// Contact form functionality

class ContactManager {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Real-time validation
    this.setupValidation();
  }

  setupValidation() {
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    if (emailInput) {
      emailInput.addEventListener('blur', () => {
        if (emailInput.value && !utils.isValidEmail(emailInput.value)) {
          this.showFieldError(emailInput, 'Please enter a valid email address');
        } else {
          this.clearFieldError(emailInput);
        }
      });
    }

    if (messageInput) {
      messageInput.addEventListener('input', () => {
        const remaining = 500 - messageInput.value.length;
        let counter = messageInput.parentNode.querySelector('.char-counter');
        
        if (!counter) {
          counter = document.createElement('div');
          counter.className = 'char-counter';
          counter.style.fontSize = 'var(--font-size-sm)';
          counter.style.color = 'var(--gray-500)';
          counter.style.textAlign = 'right';
          counter.style.marginTop = 'var(--space-1)';
          messageInput.parentNode.appendChild(counter);
        }
        
        counter.textContent = `${remaining} characters remaining`;
        
        if (remaining < 0) {
          counter.style.color = 'var(--error)';
          messageInput.style.borderColor = 'var(--error)';
        } else {
          counter.style.color = 'var(--gray-500)';
          messageInput.style.borderColor = 'var(--gray-200)';
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
    input.parentNode.appendChild(errorDiv);
  }

  clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
    input.style.borderColor = 'var(--gray-200)';
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      subject: formData.get('subject'),
      message: formData.get('message')
    };

    // Validation
    if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message) {
      toast.show('Please fill in all required fields', 'error');
      return;
    }

    if (!utils.isValidEmail(data.email)) {
      toast.show('Please enter a valid email address', 'error');
      return;
    }

    if (data.message.length > 500) {
      toast.show('Message is too long (max 500 characters)', 'error');
      return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitBtn.disabled = true;

    try {
      // Simulate API call
      await this.simulateApiCall();
      
      // Store message (in real app, this would be sent to server)
      const message = {
        id: utils.generateId(),
        ...data,
        timestamp: new Date().toISOString(),
        status: 'sent'
      };

      // Store in localStorage for demo purposes
      const messages = storage.get('contact-messages', []);
      messages.push(message);
      storage.set('contact-messages', messages);

      toast.show('Message sent successfully! We\'ll get back to you soon.', 'success');
      
      // Reset form
      e.target.reset();
      
      // Clear any character counters
      const charCounter = document.querySelector('.char-counter');
      if (charCounter) {
        charCounter.remove();
      }

    } catch (error) {
      toast.show('Failed to send message. Please try again.', 'error');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  }

  async simulateApiCall() {
    // Simulate network delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Network error'));
        }
      }, 1000 + Math.random() * 1000);
    });
  }
}

// Initialize contact manager
document.addEventListener('DOMContentLoaded', () => {
  new ContactManager();
});