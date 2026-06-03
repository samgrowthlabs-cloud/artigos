import { loadHeader } from '../components/header.js'
import { login } from '../auth.js'

document.addEventListener('DOMContentLoaded', async () => {
    await loadHeader()
    
    const form = document.getElementById('login-form')
    const errorDiv = document.getElementById('error')
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const username = document.getElementById('username').value
        const password = document.getElementById('password').value
        
        try {
            await login(username, password)
            window.location.href = '/index.html'
        } catch (err) {
            errorDiv.textContent = err.message
        }
    })
})