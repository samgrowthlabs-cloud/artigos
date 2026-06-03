import { loadHeader } from '../components/header.js'
import { register } from '../auth.js'

document.addEventListener('DOMContentLoaded', async () => {
    await loadHeader()
    
    const form = document.getElementById('register-form')
    const errorDiv = document.getElementById('error')
    const successDiv = document.getElementById('success')
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        const pergunta = document.getElementById('pergunta').value
        const resposta = document.getElementById('resposta').value
        
        try {
            await register(username, password, pergunta, resposta)
            successDiv.textContent = 'Registro realizado com sucesso! Redirecionando...'
            setTimeout(() => {
                window.location.href = '/index.html'
            }, 1500)
        } catch (err) {
            errorDiv.textContent = err.message
        }
    })
})