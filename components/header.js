import { getCurrentUser, clearCurrentUser } from '../supabase.js'

export async function loadHeader() {
    const user = getCurrentUser()
    const container = document.getElementById('header-container')
    
    let navLinks = ''
    
    if (user) {
        navLinks = `
            <div class="user-info">
                <span>Bem-vindo, ${user.username} (${user.cargo})</span>
                <a href="/dashboard/index.html">Dashboard</a>
                <a href="/pagina_postagem/index.html">Novo Artigo</a>
                <a href="/pagina_usuario/index.html?id=${user.id}">Meu Perfil</a>
                <button id="logout-btn" class="btn btn-secondary">Sair</button>
            </div>
        `
    } else {
        navLinks = `
            <div>
                <a href="/login/index.html">Login</a>
                <a href="/registro/index.html">Registro</a>
            </div>
        `
    }
    
    container.innerHTML = `
        <header>
            <div class="header-container">
                <div class="logo">
                    <a href="/index.html">Artigos Científicos</a>
                </div>
                <div class="nav-links">
                    ${navLinks}
                </div>
            </div>
        </header>
    `
    
    const logoutBtn = document.getElementById('logout-btn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            clearCurrentUser()
            window.location.href = '/login/index.html'
        })
    }
}