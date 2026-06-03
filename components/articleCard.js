export function renderArticleCard(article, currentUser) {
    const statusBadge = article.status !== 'published' 
        ? `<span style="background:#ffc107; padding:2px 8px; border-radius:4px; font-size:12px;">${article.status}</span>`
        : '';
    
    return `
        <div class="article-card">
            <h2 class="article-title">
                <a href="/pagina_artigo/index.html?id=${article.id}">${escapeHtml(article.titulo)}</a>
            </h2>
            <div class="article-meta">
                <span>Autor: <a href="/pagina_usuario/index.html?id=${article.autor_id}">${escapeHtml(article.autor_username)}</a></span>
                <span>Data: ${new Date(article.data_publicacao).toLocaleDateString()}</span>
                ${statusBadge}
            </div>
            <div class="article-resumo">${escapeHtml(article.resumo)}</div>
            <div class="article-stats">
                <span>👁️ ${article.visualizacoes}</span>
                <span>❤️ ${article.curtidas}</span>
                <span>💬 ${article.comentarios_count}</span>
            </div>
        </div>
    `;
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}