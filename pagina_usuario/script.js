import { supabase, getCurrentUser, requireAuth } from '../supabase.js';
import { loadHeader } from '../components/header.js';
import { renderArticleCard } from '../components/articleCard.js';

let currentUser = null;
let profileUser = null;
let isOwnProfile = false;

// Carrega dados do perfil (username, cargo, bio, seguidores, artigos_count, is_following)
async function loadProfile() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id') || currentUser.id;

    // Buscar dados do usuário e se o visitante está seguindo
    let { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, cargo, bio, seguidores_count')
        .eq('id', userId)
        .single();

    if (userError || !userData) {
        document.getElementById('profile-container').innerHTML = '<p>Perfil não encontrado.</p>';
        return;
    }

    profileUser = userData;
    isOwnProfile = (currentUser.id === profileUser.id);

    // Contagem de artigos publicados
    const { count: artigosCount, error: countError } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true })
        .eq('autor_id', profileUser.id)
        .eq('status', 'published');

    // Verifica se o visitante segue este perfil
    let isFollowing = false;
    if (!isOwnProfile && currentUser) {
        const { data: follow } = await supabase
            .from('follows')
            .select('id')
            .eq('follower_id', currentUser.id)
            .eq('following_id', profileUser.id)
            .maybeSingle();
        isFollowing = !!follow;
    }

    // Renderizar cabeçalho do perfil
    const profileHtml = `
        <div class="profile-header">
            <div>
                <h2>${escapeHtml(profileUser.username)}</h2>
                <p class="profile-cargo">Cargo: ${profileUser.cargo}</p>
                <div class="profile-bio">
                    <p id="bio-text">${escapeHtml(profileUser.bio || 'Sem biografia')}</p>
                    ${isOwnProfile ? `<button id="edit-bio-btn" class="btn btn-sm">✏️ Editar bio</button>` : ''}
                </div>
                <div class="profile-stats">
                    <span>📄 ${artigosCount || 0} artigos</span>
                    <span>👥 ${profileUser.seguidores_count || 0} seguidores</span>
                </div>
            </div>
            ${!isOwnProfile && currentUser ? `
                <button id="follow-btn" class="btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}">
                    ${isFollowing ? 'Deixar de Seguir' : 'Seguir'}
                </button>
            ` : ''}
        </div>
    `;
    document.getElementById('profile-container').innerHTML = profileHtml;

    // Editar bio
    if (isOwnProfile) {
        const editBtn = document.getElementById('edit-bio-btn');
        const bioText = document.getElementById('bio-text');
        editBtn.addEventListener('click', async () => {
            const newBio = prompt('Edite sua biografia:', profileUser.bio || '');
            if (newBio !== null) {
                const { error } = await supabase
                    .from('users')
                    .update({ bio: newBio })
                    .eq('id', currentUser.id);
                if (!error) {
                    profileUser.bio = newBio;
                    bioText.innerText = newBio || 'Sem biografia';
                    // Atualizar currentUser no localStorage
                    currentUser.bio = newBio;
                    localStorage.setItem('platform_user', JSON.stringify(currentUser));
                } else {
                    alert('Erro ao atualizar bio: ' + error.message);
                }
            }
        });
    }

    // Seguir / deixar de seguir
    const followBtn = document.getElementById('follow-btn');
    if (followBtn && !isOwnProfile) {
        followBtn.addEventListener('click', async () => {
            if (isFollowing) {
                // Deixar de seguir
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', profileUser.id);
                await supabase.rpc('decrement_followers', { user_id: profileUser.id });
                isFollowing = false;
            } else {
                // Seguir
                await supabase
                    .from('follows')
                    .insert({ follower_id: currentUser.id, following_id: profileUser.id });
                await supabase.rpc('increment_followers', { user_id: profileUser.id });
                isFollowing = true;
            }
            // Recarregar perfil para atualizar contagem e botão
            loadProfile();
        });
    }

    // Carregar artigos do usuário (publicados)
    await loadUserArticles();
    // Carregar lista de quem o usuário segue
    await loadFollowing();
}

// Carrega artigos publicados do perfil atual
async function loadUserArticles() {
    const { data: articles, error } = await supabase
        .from('articles')
        .select(`
            id, titulo, resumo, autor_id, data_publicacao,
            visualizacoes, curtidas, comentarios_count, score, status,
            autor:autor_id (username)
        `)
        .eq('autor_id', profileUser.id)
        .eq('status', 'published')
        .order('data_publicacao', { ascending: false });

    const container = document.getElementById('articles-list');
    if (error || !articles || articles.length === 0) {
        container.innerHTML = '<p>Nenhum artigo publicado.</p>';
        return;
    }
    const adapted = articles.map(art => ({
        ...art,
        autor_username: art.autor?.username || 'Desconhecido'
    }));
    container.innerHTML = adapted.map(art => renderArticleCard(art, currentUser)).join('');
}

// Carrega lista de usuários que este perfil segue
async function loadFollowing() {
    const followingDiv = document.getElementById('following-list');
    if (!followingDiv) return;
    followingDiv.innerHTML = '<p>Carregando...</p>';

    const { data: follows, error } = await supabase
        .from('follows')
        .select(`following_id, following:following_id(id, username, cargo)`)
        .eq('follower_id', profileUser.id);

    if (error) {
        followingDiv.innerHTML = '<p>Erro ao carregar seguindo.</p>';
        return;
    }
    if (!follows || follows.length === 0) {
        followingDiv.innerHTML = '<p>Não segue ninguém ainda.</p>';
        return;
    }

    const followingUsers = follows.map(f => f.following);
    followingDiv.innerHTML = followingUsers.map(user => `
        <div class="following-card">
            <div>
                <strong><a href="/pagina_usuario/index.html?id=${user.id}">${escapeHtml(user.username)}</a></strong>
                <span class="user-cargo">(${user.cargo})</span>
            </div>
            ${isOwnProfile ? `
                <button class="btn btn-sm unfollow-btn" data-id="${user.id}">Deixar de Seguir</button>
            ` : ''}
        </div>
    `).join('');

    if (isOwnProfile) {
        document.querySelectorAll('.unfollow-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const userId = btn.dataset.id;
                await supabase
                    .from('follows')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('following_id', userId);
                await supabase.rpc('decrement_followers', { user_id: userId });
                loadFollowing();    // recarrega lista
                loadProfile();      // atualiza contador de seguidores
            });
        });
    }
}

// Gerenciamento das abas
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = {
        articles: document.getElementById('articles-tab'),
        following: document.getElementById('following-tab')
    };
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(contents).forEach(content => content.classList.remove('active'));
            contents[target].classList.add('active');
        });
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth();
    if (!currentUser) return;
    await loadHeader();
    await loadProfile();
    setupTabs();
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}