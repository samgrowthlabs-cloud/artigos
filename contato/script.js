// ==============================================
// MODO ESCURO (idêntico ao da página Sobre)
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

// ==============================================
// ENVIO DO FORMULÁRIO VIA MAILTO:
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const feedback = document.getElementById('form-feedback');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Captura os valores dos campos
    const name = document.getElementById('name')?.value.trim() || '';
    const email = document.getElementById('email')?.value.trim() || '';
    const subject = document.getElementById('subject')?.value.trim() || '';
    const message = document.getElementById('message')?.value.trim() || '';

    // Validação básica
    if (!name || !email || !subject || !message) {
      feedback.style.display = 'block';
      feedback.innerHTML = '❌ Por favor, preencha todos os campos.';
      feedback.className = 'form-feedback error';
      setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      feedback.style.display = 'block';
      feedback.innerHTML = '❌ Digite um e‑mail válido.';
      feedback.className = 'form-feedback error';
      setTimeout(() => { feedback.style.display = 'none'; }, 4000);
      return;
    }

    // Monta o corpo do e-mail
    const body = `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`;
    const mailtoLink = `mailto:bidjorys@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Abre o programa de e‑mail do usuário com os dados preenchidos
    window.location.href = mailtoLink;

    // Exibe mensagem de sucesso e limpa o formulário
    feedback.style.display = 'block';
    feedback.innerHTML = '📧 Obrigado! Seu programa de e‑mail será aberto. Envie a mensagem para concluir.';
    feedback.className = 'form-feedback success';
    form.reset();
    setTimeout(() => { feedback.style.display = 'none'; }, 6000);
  });
});

// Aplica o modo escuro assim que a página carregar
applyDarkMode();

// Configura o botão de alternância do modo escuro
const toggleBtn = document.getElementById('dark-mode-toggle');
if (toggleBtn) {
  toggleBtn.addEventListener('click', toggleDarkMode);
  const svg = toggleBtn.querySelector('svg');
  if (svg) {
    if (darkMode) {
      svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
    } else {
      svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    }
  }
}