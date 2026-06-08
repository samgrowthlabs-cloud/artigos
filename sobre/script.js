// ==============================================
// CONFIGURAÇÃO DOS LINKS
// ==============================================
const CONTATO_EMAIL = "contato@samgrowthlabs.com.br";
const FORMULARIO_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe-GPMB-oCz-351QaKb0v7ZrGaERMGXDJPnTLoiiMoSsrxVUQ/viewform?usp=dialog";

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
  
  // Atualiza o ícone do botão (lua ↔ sol)
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

// ==============================================
// INSERE OS LINKS
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
  const emailLink = document.getElementById("emailLink");
  if (emailLink) {
    emailLink.href = `mailto:${CONTATO_EMAIL}?subject=Envio%20de%20artigo%20-%20%5BTítulo%5D`;
    emailLink.textContent = CONTATO_EMAIL;
  }

  const formLink = document.getElementById("formLink");
  if (formLink) {
    formLink.href = FORMULARIO_URL;
  }
  
  // Aplica modo escuro salvo
  applyDarkMode();
  
  // Configura o botão de alternância
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleDarkMode);
    // Define o ícone inicial correto
    const svg = toggleBtn.querySelector('svg');
    if (svg) {
      if (darkMode) {
        svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
      } else {
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    }
  }
});