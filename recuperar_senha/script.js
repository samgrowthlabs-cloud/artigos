import { loadHeader } from '../components/header.js'
import { recoverPassword } from '../auth.js'

document.addEventListener('DOMContentLoaded', async () => {
    await loadHeader()
    
    const form = document.getElementById('recover-form')
    const errorDiv = document.getElementById('error')
    const successDiv = document.getElementById('success')
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const username = document.getElementById('username').value
        const pergunta = document.getElementById('pergunta').value
        const resposta = document.getElementById('resposta').value
        const novaSenha = document.getElementById('nova_senha').value
        
        try {
            await recoverPassword(username, pergunta, resposta, novaSenha)
            successDiv.textContent = 'Senha alterada com sucesso! Redirecionando para login...'
            setTimeout(() => {
                window.location.href = '/login/index.html'
            }, 2000)
        } catch (err) {
            errorDiv.textContent = err.message
        }
    })
})