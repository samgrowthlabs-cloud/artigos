// ==============================================
// CONFIGURAÇÃO DOS LINKS (altere aqui se necessário)
// ==============================================

const CONTATO_EMAIL = "contato@samgrowthlabs.com.br";     // substitua pelo seu e-mail
const FORMULARIO_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe-GPMB-oCz-351QaKb0v7ZrGaERMGXDJPnTLoiiMoSsrxVUQ/viewform?usp=dialog"; // substitua pelo link real

// ==============================================
// SCRIPT – insere os links dinamicamente
// ==============================================

document.addEventListener("DOMContentLoaded", () => {
  // Preenche o link de e-mail
  const emailLink = document.getElementById("emailLink");
  if (emailLink) {
    emailLink.href = `mailto:${CONTATO_EMAIL}?subject=Envio%20de%20artigo%20-%20%5BTítulo%5D`;
    emailLink.textContent = CONTATO_EMAIL;
  }

  // Preenche o link do formulário Google
  const formLink = document.getElementById("formLink");
  if (formLink) {
    formLink.href = FORMULARIO_URL;
  }
});