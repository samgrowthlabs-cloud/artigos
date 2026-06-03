import { supabase, getCurrentUser, requireAuth } from '../supabase.js';
import { loadHeader } from '../components/header.js';
import { renderMarkdown } from '../utils/markdown.js';

let currentUser = null;
let currentArticle = null;
let hasLiked = false;

async function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    if (!articleId) {
        window.location.href = '/index.html';
        return;
    }

    const { data: article, error } = await supabase
        .from('articles')
        .select(`
            id, titulo, resumo, conteudo, pdf_url,
            autor_id, status, data_criacao, data_publicacao,
            visualizacoes, curtidas, comentarios_count,
            autor:autor_id (id, username, cargo)
        `)
        .eq('id', articleId)
        .single();

    if (error || !article) {
        document.getElementById('article-container').innerHTML = '<p>Artigo não encontrado.</p>';
        return;
    }
    currentArticle = article;

    // Visualização única
    if (currentUser) {
        await supabase.rpc('increment_unique_view', {
            p_article_id: articleId,
            p_user_id: currentUser.id
        });
        const { data: updated } = await supabase
            .from('articles')
            .select('visualizacoes')
            .eq('id', articleId)
            .single();
        if (updated) article.visualizacoes = updated.visualizacoes;
    }

    // Like
    if (currentUser) {
        const { data: like } = await supabase
            .from('likes')
            .select('id')
            .eq('artigo_id', articleId)
            .eq('usuario_id', currentUser.id)
            .maybeSingle();
        hasLiked = !!like;
    }

    const autorNome = article.autor?.username || 'Desconhecido';
    const autorId = article.autor_id;
    const podeEditar = currentUser && (currentUser.id === autorId || ['moderator','supervisor','admin'].includes(currentUser.cargo));
    const editButton = podeEditar ? `<a href="/pagina_postagem/index.html?id=${articleId}" class="btn btn-secondary">✏️ Editar Artigo</a>` : '';

    const pdfButton = article.pdf_url 
        ? `<a href="${article.pdf_url}" download class="btn">📄 Baixar PDF</a>` 
        : '';

    // Renderizar conteúdo com Markdown
    const renderedContent = renderMarkdown(article.conteudo);

    document.getElementById('article-container').innerHTML = `
        <h1>${escapeHtml(article.titulo)}</h1>
        <div class="article-meta">
            <span>Autor: <a href="/pagina_usuario/index.html?id=${autorId}">${escapeHtml(autorNome)}</a></span>
            <span>Data: ${new Date(article.data_publicacao || article.data_criacao).toLocaleDateString()}</span>
            <span>Status: ${article.status}</span>
        </div>
        <div class="article-stats">
            <span>👁️ ${article.visualizacoes}</span>
            <button id="like-btn" class="like-btn">${hasLiked ? '❤️' : '🤍'} ${article.curtidas}</button>
            <span>💬 ${article.comentarios_count}</span>
        </div>
        <div class="article-resumo">
            <h3>Resumo</h3>
            <p>${escapeHtml(article.resumo)}</p>
        </div>
        <div class="article-conteudo">
            <h3>Conteúdo</h3>
            <div>${renderedContent}</div>
        </div>
        <div class="article-actions">
            ${pdfButton}
            ${editButton}
        </div>
    `;

    const likeBtn = document.getElementById('like-btn');
    if (likeBtn && currentUser) {
        likeBtn.style.cursor = 'pointer';
        likeBtn.addEventListener('click', async () => {
            if (hasLiked) {
                await supabase
                    .from('likes')
                    .delete()
                    .eq('artigo_id', articleId)
                    .eq('usuario_id', currentUser.id);
                await supabase
                    .from('articles')
                    .update({ curtidas: currentArticle.curtidas - 1 })
                    .eq('id', articleId);
                hasLiked = false;
            } else {
                await supabase
                    .from('likes')
                    .insert({ artigo_id: articleId, usuario_id: currentUser.id });
                await supabase
                    .from('articles')
                    .update({ curtidas: currentArticle.curtidas + 1 })
                    .eq('id', articleId);
                hasLiked = true;
            }
            loadArticle();
            loadComments();
        });
    }

    await loadComments();
}

async function loadComments() {
    if (!currentArticle) return;
    const { data: comments, error } = await supabase
        .from('comments')
        .select(`*, autor:autor_id (id, username)`)
        .eq('artigo_id', currentArticle.id)
        .order('data_criacao', { ascending: false });

    if (error) return;

    const commentsHtml = (comments || []).map(c => `
        <div class="comment">
            <div class="comment-author">
                <a href="/pagina_usuario/index.html?id=${c.autor.id}">${escapeHtml(c.autor.username)}</a>
                <span class="comment-date">${new Date(c.data_criacao).toLocaleString()}</span>
            </div>
            <div class="comment-content">${escapeHtml(c.conteudo)}</div>
        </div>
    `).join('');

    document.getElementById('comments-list').innerHTML = commentsHtml || '<p>Nenhum comentário ainda.</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth();
    if (!currentUser) return;
    await loadHeader();
    await loadArticle();

    const submitBtn = document.getElementById('submit-comment');
    const commentContent = document.getElementById('comment-content');
    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            const content = commentContent.value.trim();
            if (!content) return;
            await supabase
                .from('comments')
                .insert({ artigo_id: currentArticle.id, autor_id: currentUser.id, conteudo: content });
            commentContent.value = '';
            await loadComments();
            const { count } = await supabase
                .from('comments')
                .select('*', { count: 'exact', head: true })
                .eq('artigo_id', currentArticle.id);
            await supabase
                .from('articles')
                .update({ comentarios_count: count })
                .eq('id', currentArticle.id);
            loadArticle();
        });
    }
});

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}