import { supabase, getCurrentUser } from '../supabase.js';
import { loadHeader } from '../components/header.js';

let currentUser = null;
let currentModalArticleId = null;

// Carrega artigos pendentes
async function loadPendingArticles() {
    const pendingDiv = document.getElementById('pending-list');
    pendingDiv.innerHTML = '<p>Carregando...</p>';

    const { data: articles, error } = await supabase
        .from('articles')
        .select(`id, titulo, resumo, autor_id, data_criacao, autor:autor_id(username)`)
        .eq('status', 'pending')
        .order('data_criacao', { ascending: true });

    if (error) {
        pendingDiv.innerHTML = `<p class="error">Erro: ${error.message}</p>`;
        return;
    }
    if (!articles.length) {
        pendingDiv.innerHTML = '<p>Nenhum artigo pendente.</p>';
        return;
    }

    pendingDiv.innerHTML = articles.map(art => `
        <div class="pending-card">
            <h4>${escapeHtml(art.titulo)}</h4>
            <p><strong>Autor:</strong> ${escapeHtml(art.autor?.username || 'Desconhecido')}</p>
            <p><strong>Data:</strong> ${new Date(art.data_criacao).toLocaleString()}</p>
            <p><strong>Resumo:</strong> ${escapeHtml(art.resumo.substring(0, 200))}${art.resumo.length > 200 ? '...' : ''}</p>
            <div class="pending-actions">
                <button class="btn btn-info view-btn" data-id="${art.id}">👁️ Visualizar</button>
                <button class="btn btn-success approve-btn" data-id="${art.id}">✅ Aprovar</button>
                <button class="btn btn-danger reject-btn" data-id="${art.id}">❌ Rejeitar</button>
            </div>
        </div>
    `).join('');

    // Eventos de aprovação/rejeição direta (sem modal)
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await supabase
                .from('articles')
                .update({ status: 'published', data_publicacao: new Date() })
                .eq('id', id);
            loadPendingArticles();
        });
    });
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await supabase.from('articles').update({ status: 'rejected' }).eq('id', id);
            loadPendingArticles();
        });
    });

    // Eventos de visualizar (abre modal)
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            await showArticleModal(id);
        });
    });
}

// Exibe modal com o artigo completo
async function showArticleModal(articleId) {
    currentModalArticleId = articleId;
    const { data: article, error } = await supabase
        .from('articles')
        .select(`*, autor:autor_id(username)`)
        .eq('id', articleId)
        .single();

    if (error || !article) {
        alert('Erro ao carregar artigo.');
        return;
    }

    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = `
        <h2>${escapeHtml(article.titulo)}</h2>
        <p><strong>Autor:</strong> ${escapeHtml(article.autor?.username)}</p>
        <p><strong>Data de envio:</strong> ${new Date(article.data_criacao).toLocaleString()}</p>
        <h3>Resumo</h3>
        <p>${escapeHtml(article.resumo)}</p>
        <h3>Conteúdo</h3>
        <div>${escapeHtml(article.conteudo).replace(/\n/g, '<br>')}</div>
        ${article.pdf_url ? `<p><a href="${article.pdf_url}" target="_blank">📄 Baixar PDF</a></p>` : ''}
    `;

    document.getElementById('article-modal').style.display = 'block';
}

// Fechar modal
function closeModal() {
    document.getElementById('article-modal').style.display = 'none';
    currentModalArticleId = null;
}

// Aprovar via modal
async function approveFromModal() {
    if (currentModalArticleId) {
        await supabase
            .from('articles')
            .update({ status: 'published', data_publicacao: new Date() })
            .eq('id', currentModalArticleId);
        closeModal();
        loadPendingArticles();
    }
}

// Rejeitar via modal
async function rejectFromModal() {
    if (currentModalArticleId) {
        await supabase
            .from('articles')
            .update({ status: 'rejected' })
            .eq('id', currentModalArticleId);
        closeModal();
        loadPendingArticles();
    }
}

// Carrega usuários (admin)
async function loadUsers() {
    if (currentUser.cargo !== 'admin') return;
    document.getElementById('admin-section').style.display = 'block';
    const usersDiv = document.getElementById('users-list');
    usersDiv.innerHTML = '<p>Carregando...</p>';

    const { data: users, error } = await supabase
        .from('users')
        .select('id, username, cargo, data_criacao, seguidores_count')
        .order('data_criacao');

    if (error) {
        usersDiv.innerHTML = `<p class="error">Erro: ${error.message}</p>`;
        return;
    }
    if (!users.length) {
        usersDiv.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        return;
    }

    usersDiv.innerHTML = users.map(user => {
        const isSelf = user.id === currentUser.id;
        return `
            <div class="user-card">
                <div><strong>${escapeHtml(user.username)}</strong> (${user.cargo}) - Seguidores: ${user.seguidores_count}</div>
                <div class="user-actions">
                    <select id="role-${user.id}" class="role-select" ${isSelf ? 'disabled' : ''}>
                        <option value="user" ${user.cargo === 'user' ? 'selected' : ''}>user</option>
                        <option value="moderator" ${user.cargo === 'moderator' ? 'selected' : ''}>moderator</option>
                        <option value="supervisor" ${user.cargo === 'supervisor' ? 'selected' : ''}>supervisor</option>
                        <option value="admin" ${user.cargo === 'admin' ? 'selected' : ''}>admin</option>
                    </select>
                    ${!isSelf ? `<button class="btn btn-secondary change-role-btn" data-id="${user.id}">Alterar</button>` : '<span class="text-muted">(você)</span>'}
                    ${!isSelf ? `<button class="btn btn-danger delete-user-btn" data-id="${user.id}">Remover</button>` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Dentro de loadUsers, após gerar a lista
    document.querySelectorAll('.change-role-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const userId = btn.dataset.id;
            const newRole = document.getElementById(`role-${userId}`).value;
            const { error } = await supabase
                .from('users')
                .update({ cargo: newRole })
                .eq('id', userId);

            if (error) {
                alert('Erro: ' + error.message);
            } else {
                // Se o usuário alterado for o próprio logado, atualiza o localStorage e recarrega o header
                if (userId === currentUser.id) {
                    currentUser.cargo = newRole;
                    localStorage.setItem('platform_user', JSON.stringify(currentUser));
                    // Recarrega o header para refletir o novo cargo
                    await loadHeader();
                }
                loadUsers(); // recarrega a lista
            }
        });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = getCurrentUser();
    const allowed = ['moderator', 'supervisor', 'admin'];
    if (!currentUser || !allowed.includes(currentUser.cargo)) {
        alert('Acesso negado.');
        window.location.href = '/index.html';
        return;
    }
    await loadHeader();
    await loadPendingArticles();
    await loadUsers();

    // Eventos do modal
    const modal = document.getElementById('article-modal');
    const closeBtn = document.querySelector('.close');
    const approveBtn = document.getElementById('modal-approve');
    const rejectBtn = document.getElementById('modal-reject');

    closeBtn.onclick = closeModal;
    approveBtn.onclick = approveFromModal;
    rejectBtn.onclick = rejectFromModal;
    window.onclick = (event) => {
        if (event.target === modal) closeModal();
    };
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}