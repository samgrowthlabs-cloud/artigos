import { supabase, getCurrentUser, requireAuth } from './supabase.js';
import { loadHeader } from './components/header.js';
import { renderArticleCard } from './components/articleCard.js';

let currentUser = null;

async function loadArticles() {
    currentUser = getCurrentUser();
    if (!currentUser) return;

    const searchInput = document.getElementById('search-input');
    const orderSelect = document.getElementById('order-select');

    async function fetchArticles() {
        const searchTerm = searchInput.value.toLowerCase();
        const orderBy = orderSelect.value;

        // Buscar TODOS os artigos publicados (feed global)
        let query = supabase
            .from('articles')
            .select(`
                id, titulo, resumo, autor_id, data_publicacao,
                visualizacoes, curtidas, comentarios_count, score, status,
                autor:autor_id (username)
            `)
            .eq('status', 'published');

        const { data: articles, error } = await query;

        if (error) {
            console.error(error);
            document.getElementById('articles-list').innerHTML = '<p>Erro ao carregar artigos.</p>';
            return;
        }

        let filtered = articles;
        if (searchTerm) {
            filtered = articles.filter(art =>
                art.titulo.toLowerCase().includes(searchTerm) ||
                (art.autor?.username || '').toLowerCase().includes(searchTerm)
            );
        }

        // Ordenação
        if (orderBy === 'recent') {
            filtered.sort((a, b) => new Date(b.data_publicacao) - new Date(a.data_publicacao));
        } else if (orderBy === 'likes') {
            filtered.sort((a, b) => b.curtidas - a.curtidas);
        } else if (orderBy === 'views') {
            filtered.sort((a, b) => b.visualizacoes - a.visualizacoes);
        } else {
            // Padrão: destaque (score)
            filtered.sort((a, b) => b.score - a.score);
        }

        const container = document.getElementById('articles-list');
        if (filtered.length === 0) {
            container.innerHTML = '<p>Nenhum artigo encontrado.</p>';
            return;
        }

        const adapted = filtered.map(art => ({
            ...art,
            autor_username: art.autor?.username || 'Desconhecido'
        }));
        container.innerHTML = adapted.map(article => renderArticleCard(article, currentUser)).join('');
    }

    searchInput.addEventListener('input', fetchArticles);
    orderSelect.addEventListener('change', fetchArticles);
    await fetchArticles();
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth();
    if (!currentUser) return;
    await loadHeader();
    await loadArticles();
});