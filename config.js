// config.js – Configuração central do Supabase
const SUPABASE_URL = 'https://gyqkjunfnmgsawwmevbg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5cWtqdW5mbm1nc2F3d21ldmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTA1NjUsImV4cCI6MjA5NjAyNjU2NX0.DkBLm6j56U5pCrgcdwvz4zQRKan-qD__ideoj0O9xlM';


// Modo escuro global
function initDarkMode() {
  const savedMode = localStorage.getItem('bidartigos_dark_mode');
  const isDark = savedMode === 'true';
  if (isDark) document.body.classList.add('dark-mode');
  
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const nowDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('bidartigos_dark_mode', nowDark);
      // Opcional: atualizar ícone (lua/sol)
      const svg = toggleBtn.querySelector('svg');
      if (svg) {
        if (nowDark) {
          svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
        } else {
          svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
      }
    });
  }
}

// Executar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkMode);
} else {
  initDarkMode();
}