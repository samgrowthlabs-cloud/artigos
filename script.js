// script.js – Busca inteligente (autor, tags, título, conteúdo, relevância) + TRENDING
const articlesList = document.getElementById('articles-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const periodFilter = document.getElementById('period-filter');
const customPeriod = document.getElementById('custom-period');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

let allArticles = [];

// ----- CATEGORIAS -----
function loadCategories() {
  const categories = [
    'Investimento', 'Notícias', 'Finanças', 'Educação Financeira',
    'Matemática Financeira', 'Economia', 'Mercado de Ações',
    'Criptomoedas', 'Planejamento', 'Informática', 'Outros'
  ];
  categoryFilter.innerHTML = '<option value="">Todas as categorias</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// ----- PERÍODO -----
periodFilter.addEventListener('change', () => {
  if (periodFilter.value === 'custom') {
    customPeriod.style.display = 'flex';
  } else {
    customPeriod.style.display = 'none';
    applyFilters();
  }
});
dateFrom.addEventListener('change', applyFilters);
dateTo.addEventListener('change', applyFilters);

function getPeriodFilter() {
  const val = periodFilter.value;
  if (val === 'custom') {
    const from = dateFrom.value ? new Date(dateFrom.value).toISOString() : null;
    const to = dateTo.value ? new Date(dateTo.value + 'T23:59:59').toISOString() : null;
    return { from, to };
  }
  if (!val) return null;
  const days = parseInt(val);
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return { from, to: null };
}

// ----- NORMALIZAÇÃO -----
function normalize(str) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// ----- ESCAPE HTML -----
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ----- SVG ICONS (preto/branco) -----
const svgUser = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const svgEye = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const svgHeart = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

// ----- CARREGA TODOS OS ARTIGOS (cache) – INCLUINDO is_trending -----
async function loadAllArticles() {
  if (allArticles.length > 0) return allArticles;
  try {
    // 🔥 Adicionado 'is_trending' no SELECT
    const urlArticles = `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,content,created_at,category,tags,cover_image,views,likes,author_id,is_trending&order=created_at.desc`;
    const resArticles = await fetch(urlArticles, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!resArticles.ok) throw new Error(`Erro artigos ${resArticles.status}`);
    const articles = await resArticles.json();

    // Busca todos os autores
    const urlAuthors = `${SUPABASE_URL}/rest/v1/authors?select=id,name`;
    const resAuthors = await fetch(urlAuthors, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!resAuthors.ok) throw new Error(`Erro autores ${resAuthors.status}`);
    const authors = await resAuthors.json();

    // Mapeia autor_id -> nome
    const authorMap = new Map(authors.map(a => [a.id, a.name]));

    // Enriquece os artigos
    allArticles = articles.map(article => ({
      ...article,
      author_name: article.author_id ? authorMap.get(article.author_id) : (article.author || 'Autor desconhecido')
    }));
    return allArticles;
  } catch (e) {
    console.error('Erro ao carregar artigos:', e);
    return [];
  }
}

// ----- BUSCA POR RELEVÂNCIA (com penalidade para popularidade) -----
function searchRelevantArticles(articles, query) {
  if (!query.trim()) return articles;

  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);

  const scored = articles.map(article => {
    let score = 0;
    const titleNorm = normalize(article.title);
    const summaryNorm = normalize(article.summary || '');
    const contentNorm = normalize(article.content || '');
    const authorNorm = normalize(article.author_name || '');
    let tagsNorm = '';
    if (article.tags) {
      if (Array.isArray(article.tags)) tagsNorm = normalize(article.tags.join(' '));
      else tagsNorm = normalize(article.tags);
    }

    if (titleNorm.includes(normalizedQuery)) score += 20;
    if (authorNorm.includes(normalizedQuery)) score += 15;
    if (tagsNorm.includes(normalizedQuery)) score += 12;
    if (summaryNorm.includes(normalizedQuery)) score += 8;
    if (contentNorm.includes(normalizedQuery)) score += 5;

    for (const w of queryWords) {
      if (titleNorm.includes(w)) score += 10;
      if (authorNorm.includes(w)) score += 7;
      if (tagsNorm.includes(w)) score += 6;
      if (summaryNorm.includes(w)) score += 4;
      if (contentNorm.includes(w)) score += 2;
    }

    // Penalidade para popularidade (artigos populares vão para o fim)
    const viewPenalty = Math.min(20, (article.views || 0) / 50);
    const likePenalty = Math.min(15, (article.likes || 0) / 30);
    score = score - viewPenalty - likePenalty;

    return { article, score };
  });

  const filtered = scored.filter(item => item.score > 0);
  filtered.sort((a, b) => a.score - b.score); // ordem crescente (menos popular primeiro)
  return filtered.map(item => item.article);
}

// ----- FILTROS DE CATEGORIA E PERÍODO -----
function filterByCategoryAndPeriod(articles, category, period) {
  let result = [...articles];
  if (category) result = result.filter(a => a.category === category);
  if (period?.from) {
    const fromDate = new Date(period.from);
    const toDate = period.to ? new Date(period.to) : null;
    result = result.filter(a => {
      const created = new Date(a.created_at);
      if (toDate) return created >= fromDate && created <= toDate;
      return created >= fromDate;
    });
  }
  return result;
}

// ----- RENDER (com SVGs e BADGE DE TRENDING) -----
function renderArticles(articles) {
  articlesList.innerHTML = '';
  if (!articles || articles.length === 0) {
    articlesList.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  articlesList.style.display = 'flex';

  articles.forEach(article => {
    const link = document.createElement('a');
    link.href = `ler-artigo/?id=${article.id}`;
    link.className = 'article-card';

    let coverHtml = '';
    if (article.cover_image) {
      coverHtml = `<div class="article-cover-wrapper"><img src="${article.cover_image}" class="article-cover" loading="lazy" alt="Capa"></div>`;
    }

    const left = document.createElement('div');
    left.className = 'article-info';

    const h2 = document.createElement('h2');
    h2.textContent = article.title;
    if (isNew(article.created_at)) {
      const badge = document.createElement('span');
      badge.className = 'new-badge';
      badge.textContent = 'Novo';
      h2.appendChild(badge);
    }
    // 🔥 BADGE DE TRENDING
    if (article.is_trending === true) {
      const trendingBadge = document.createElement('span');
      trendingBadge.className = 'trending-badge';
      trendingBadge.textContent = '🔥 Em alta';
      h2.appendChild(trendingBadge);
    }

    left.appendChild(h2);

    // Resumo
    const summaryText = truncateSummary(article.summary);
    if (summaryText) {
      const summaryEl = document.createElement('p');
      summaryEl.className = 'article-summary-preview';
      summaryEl.textContent = summaryText;
      left.appendChild(summaryEl);
    }

    // Autor com SVG
    if (article.author_name) {
      const authorSpan = document.createElement('div');
      authorSpan.className = 'article-author';
      authorSpan.innerHTML = `${svgUser} ${escapeHtml(article.author_name)}`;
      left.appendChild(authorSpan);
    }

    // Métricas com SVGs
    const metrics = document.createElement('div');
    metrics.className = 'article-metrics';
    metrics.innerHTML = `
      <span>${svgEye} ${article.views || 0}</span>
      <span>${svgHeart} ${article.likes || 0}</span>
    `;
    left.appendChild(metrics);

    // Tags
    if (Array.isArray(article.tags) && article.tags.length) {
      const tagsDiv = document.createElement('div');
      tagsDiv.className = 'article-tags';
      article.tags.forEach(tag => {
        const span = document.createElement('span');
        span.className = 'tag-badge';
        span.textContent = tag;
        tagsDiv.appendChild(span);
      });
      left.appendChild(tagsDiv);
    }

    const dateSpan = document.createElement('span');
    dateSpan.className = 'article-date';
    dateSpan.textContent = formatDate(article.created_at);

    link.innerHTML = '';
    if (coverHtml) link.insertAdjacentHTML('beforeend', coverHtml);
    link.appendChild(left);
    link.appendChild(dateSpan);
    articlesList.appendChild(link);
  });
}

// ----- AUXILIARES -----
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function isNew(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / 86400000 < 3;
}

function truncateSummary(summary, max = 150) {
  if (!summary) return '';
  return summary.length <= max ? summary : summary.substring(0, max).trimEnd() + '…';
}

// ----- APLICA FILTROS (com TRENDING NO TOPO) -----
async function applyFilters() {
  const searchText = searchInput.value.trim();
  const category = categoryFilter.value;
  const period = getPeriodFilter();

  let articles = await loadAllArticles();
  if (!articles.length) return;

  let working = articles;
  if (searchText) {
    working = searchRelevantArticles(articles, searchText);
  } else {
    working = [...working].sort((a, b) => (b.views || 0) - (a.views || 0));
  }

  // 🔥 SEPARA OS TRENDING E COLOCA NO TOPO
  const trending = working.filter(a => a.is_trending === true);
  const normal = working.filter(a => !a.is_trending);
  working = [...trending, ...normal];

  working = filterByCategoryAndPeriod(working, category, period);
  renderArticles(working);
}

// ----- EVENTOS -----
searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);
periodFilter.addEventListener('change', applyFilters);

// ----- INICIALIZAÇÃO -----
async function init() {
  loadCategories();
  await loadAllArticles();
  applyFilters();
}
init();