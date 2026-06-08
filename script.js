// ==============================================
// Home – Busca local, paginação, ordenação, trending, modo escuro (CORRIGIDO)
// ==============================================
const articlesList = document.getElementById('articles-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const periodFilter = document.getElementById('period-filter');
const customPeriod = document.getElementById('custom-period');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');
const sortBySelect = document.getElementById('sort-by');

let currentPage = 1;
const limit = 12;
let totalPages = 1;
let allArticlesLight = [];

// ----- MODO ESCURO (global) -----
function applyDarkMode() {
  const isDark = localStorage.getItem('bidartigos_dark_mode') === 'true';
  if (isDark) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
  updateDarkModeButtonIcon(isDark);
}

function updateDarkModeButtonIcon(isDark) {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (!toggleBtn) return;
  const svg = toggleBtn.querySelector('svg');
  if (!svg) return;
  if (isDark) {
    // Ícone de sol
    svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
  } else {
    // Ícone de lua
    svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}

function toggleDarkMode() {
  const isDark = !document.body.classList.contains('dark-mode');
  if (isDark) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
  localStorage.setItem('bidartigos_dark_mode', isDark);
  updateDarkModeButtonIcon(isDark);
}

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

// ----- ORDENAÇÃO -----
function loadSortOptions() {
  if (!sortBySelect) return;
  sortBySelect.innerHTML = `
    <option value="relevance">Mais relevante</option>
    <option value="recent">Mais recentes</option>
    <option value="views">Mais visualizados</option>
    <option value="likes">Mais curtidos</option>
  `;
  sortBySelect.value = 'relevance';
  sortBySelect.addEventListener('change', () => {
    currentPage = 1;
    applyFiltersAndRender();
  });
}

// ----- PERÍODO -----
periodFilter.addEventListener('change', () => {
  if (periodFilter.value === 'custom') {
    customPeriod.style.display = 'flex';
  } else {
    customPeriod.style.display = 'none';
    currentPage = 1;
    applyFiltersAndRender();
  }
});
dateFrom.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
dateTo.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });

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

// ----- SVG ICONS -----
const svgUser = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const svgEye = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const svgHeart = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
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
function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  const words = query.trim().toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (words.length === 0) return escapeHtml(text);
  let escaped = escapeHtml(text);
  words.forEach(word => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    escaped = escaped.replace(regex, '<mark>$1</mark>');
  });
  return escaped;
}

function renderArticles(articles, searchTerm) {
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
    link.href = `ler-artigo/index.html?id=${article.id}`;
    link.className = 'article-card';

    let coverHtml = '';
    if (article.cover_image) {
      coverHtml = `<div class="article-cover-wrapper"><img src="${article.cover_image}" class="article-cover" loading="lazy" alt="Capa"></div>`;
    }

    const left = document.createElement('div');
    left.className = 'article-info';

    const h2 = document.createElement('h2');
    if (searchTerm) h2.innerHTML = highlightText(article.title, searchTerm);
    else h2.textContent = article.title;
    if (isNew(article.created_at)) {
      const badge = document.createElement('span');
      badge.className = 'new-badge';
      badge.textContent = 'Novo';
      h2.appendChild(badge);
    }
    if (article.is_trending === true) {
      const trendingBadge = document.createElement('span');
      trendingBadge.className = 'trending-badge';
      trendingBadge.textContent = '🔥 Em alta';
      h2.appendChild(trendingBadge);
    }
    left.appendChild(h2);

    const summaryText = truncateSummary(article.summary);
    if (summaryText) {
      const summaryEl = document.createElement('p');
      summaryEl.className = 'article-summary-preview';
      if (searchTerm) summaryEl.innerHTML = highlightText(summaryText, searchTerm);
      else summaryEl.textContent = summaryText;
      left.appendChild(summaryEl);
    }

    if (article.author_name) {
      const authorSpan = document.createElement('div');
      authorSpan.className = 'article-author';
      authorSpan.innerHTML = `${svgUser} ${escapeHtml(article.author_name)}`;
      left.appendChild(authorSpan);
    }

    const metrics = document.createElement('div');
    metrics.className = 'article-metrics';
    metrics.innerHTML = `<span>${svgEye} ${article.views || 0}</span><span>${svgHeart} ${article.likes || 0}</span>`;
    left.appendChild(metrics);

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

function renderPagination(current, total) {
  const existing = document.querySelector('.pagination');
  if (existing) existing.remove();
  if (total <= 1) return;

  const div = document.createElement('div');
  div.className = 'pagination';
  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.add('page-btn');
    if (i === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      applyFiltersAndRender();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    div.appendChild(btn);
  }
  articlesList.parentNode.insertBefore(div, articlesList.nextSibling);
}

// ----- CARREGAR ARTIGOS LEVES -----
async function loadAllArticlesLight() {
  const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,category,tags,cover_image,views,likes,created_at,author_id,is_trending&order=created_at.desc`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  if (!res.ok) throw new Error('Erro ao carregar artigos');
  const articles = await res.json();
  // Buscar nomes dos autores
  const authorIds = [...new Set(articles.filter(a => a.author_id).map(a => a.author_id))];
  let authorMap = new Map();
  if (authorIds.length) {
    const authorsUrl = `${SUPABASE_URL}/rest/v1/authors?select=id,name&id=in.(${authorIds.map(id => `"${id}"`).join(',')})`;
    const authorsRes = await fetch(authorsUrl, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (authorsRes.ok) {
      const authors = await authorsRes.json();
      authorMap = new Map(authors.map(a => [a.id, a.name]));
    }
  }
  return articles.map(art => ({
    ...art,
    author_name: art.author_id ? authorMap.get(art.author_id) : (art.author || 'Autor desconhecido')
  }));
}

// ----- BUSCA LOCAL (relevância) -----
function searchRelevantArticles(articles, query) {
  if (!query.trim()) return articles;
  const normalizedQuery = normalize(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
  const scored = articles.map(article => {
    let score = 0;
    const titleNorm = normalize(article.title);
    const summaryNorm = normalize(article.summary || '');
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
    for (const w of queryWords) {
      if (titleNorm.includes(w)) score += 10;
      if (authorNorm.includes(w)) score += 7;
      if (tagsNorm.includes(w)) score += 6;
      if (summaryNorm.includes(w)) score += 4;
    }
    // Penalidade para popularidade
    const viewPenalty = Math.min(20, (article.views || 0) / 50);
    const likePenalty = Math.min(15, (article.likes || 0) / 30);
    score = score - viewPenalty - likePenalty;
    return { article, score };
  });
  const filtered = scored.filter(item => item.score > 0);
  filtered.sort((a, b) => b.score - a.score);
  return filtered.map(item => item.article);
}

// ----- APLICAR FILTROS E RENDER -----
async function applyFiltersAndRender() {
  if (!allArticlesLight.length) {
    allArticlesLight = await loadAllArticlesLight();
  }

  const searchText = searchInput.value.trim();
  const category = categoryFilter.value;
  const period = getPeriodFilter();
  const sortBy = sortBySelect?.value || 'relevance';

  let working = [...allArticlesLight];

  // Filtro categoria
  if (category) working = working.filter(a => a.category === category);
  // Filtro período
  if (period?.from) {
    const fromDate = new Date(period.from);
    const toDate = period.to ? new Date(period.to) : null;
    working = working.filter(a => {
      const created = new Date(a.created_at);
      if (toDate) return created >= fromDate && created <= toDate;
      return created >= fromDate;
    });
  }
  // Busca textual (local)
  if (searchText) {
    working = searchRelevantArticles(working, searchText);
  }
  // Ordenação
  if (sortBy === 'recent') working.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
  else if (sortBy === 'views') working.sort((a,b) => (b.views||0) - (a.views||0));
  else if (sortBy === 'likes') working.sort((a,b) => (b.likes||0) - (a.likes||0));
  else if (sortBy === 'relevance') {
    if (searchText) {
      // Já ordenado pela pontuação da busca
      // (searchRelevantArticles já ordena)
    } else {
      // Sem busca, ordena por trending (is_trending primeiro, depois data)
      working.sort((a,b) => (b.is_trending===true?1:0) - (a.is_trending===true?1:0) || new Date(b.created_at) - new Date(a.created_at));
    }
  }

  totalPages = Math.ceil(working.length / limit);
  const start = (currentPage - 1) * limit;
  const paginated = working.slice(start, start + limit);
  renderArticles(paginated, searchText);
  renderPagination(currentPage, totalPages);
}

// ----- EVENTOS -----
searchInput.addEventListener('input', () => { currentPage = 1; applyFiltersAndRender(); });
categoryFilter.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
periodFilter.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
dateFrom.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
dateTo.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });
if (sortBySelect) sortBySelect.addEventListener('change', () => { currentPage = 1; applyFiltersAndRender(); });


// Forçar a leitura do modo escuro ao carregar a página
(function() {
  const darkMode = localStorage.getItem('bidartigos_dark_mode') === 'true';
  if (darkMode) {
    document.body.classList.add('dark-mode');
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (toggleBtn) {
      const svg = toggleBtn.querySelector('svg');
      if (svg) svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
    }
  }
})();

// Evento do botão (garantido)
document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('bidartigos_dark_mode', isDark);
      const svg = this.querySelector('svg');
      if (svg) {
        if (isDark) {
          svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
        } else {
          svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
        }
      }
    });
  }
});

// ----- INICIALIZAÇÃO -----
async function init() {
  loadCategories();
  loadSortOptions();
  await loadAllArticlesLight();
  applyFiltersAndRender();

  // Aplica modo escuro salvo
  applyDarkMode();

  // Atrela evento do botão (garantindo que o elemento existe)
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', toggleDarkMode);
  } else {
    console.warn('Botão dark-mode-toggle não encontrado');
  }
}

init();