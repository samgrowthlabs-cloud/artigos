// ==============================================
// MODO ESCURO
// ==============================================
let darkMode = localStorage.getItem('bidartigos_dark_mode') === 'true';

function applyDarkMode() {
  if (darkMode) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('bidartigos_dark_mode', darkMode);
  applyDarkMode();
  
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    const svg = toggleBtn.querySelector('svg');
    if (svg) {
      if (darkMode) {
        svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
      } else {
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    }
  }
}
// Código específico da página de contato (formulário) – se for o caso
// Isso não interfere no modo escuro
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (feedback) {
        feedback.style.display = 'block';
        feedback.innerHTML = '📧 Funcionalidade em desenvolvimento. Por enquanto, envie um e‑mail para <strong>contato@bidartigos.com</strong>.';
        feedback.className = 'form-feedback info';
        form.reset();
        setTimeout(() => {
          feedback.style.display = 'none';
        }, 5000);
      }
    });
  }
});