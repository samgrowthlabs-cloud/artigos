// ==============================================
// Home – Busca Full Text Search (apenas tema claro)
// ==============================================
const articlesList = document.getElementById('articles-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const periodFilter = document.getElementById('period-filter');
const sortBySelect = document.getElementById('sort-by');

let currentPage = 1;
const limit = 12;
let currentAbortController = null;
let searchTimeout = null;

// ==============================================
// CATEGORIAS E ORDENAÇÃO
// ==============================================
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
    fetchArticles();
  });
}

// ==============================================
// SKELETON E RENDERIZAÇÃO
// ==============================================
function showSkeleton() {
  articlesList.innerHTML = '';
  for (let i = 0; i < limit; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-cover"></div>
      <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-meta"></div>
      </div>
    `;
    articlesList.appendChild(skeleton);
  }
  articlesList.style.display = 'flex';
  emptyState.style.display = 'none';
}

function renderArticles(articles, searchTerm, totalCount) {
  articlesList.innerHTML = '';
  if (!articles || articles.length === 0) {
    articlesList.style.display = 'none';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';
  articlesList.style.display = 'flex';

  const existingCounter = document.querySelector('.results-counter');
  if (existingCounter) existingCounter.remove();
  const counter = document.createElement('div');
  counter.className = 'results-counter';
  counter.textContent = `${totalCount} ${totalCount === 1 ? 'artigo encontrado' : 'artigos encontrados'}`;
  articlesList.parentNode.insertBefore(counter, articlesList);

  articles.forEach(article => {
    const link = document.createElement('a');
    link.href = `ler-artigo/index.html?id=${article.id}`;
    link.className = 'article-card';

    let coverHtml = '';
    if (article.cover_image) {
      const imageUrl = normalizeImageUrl(article.cover_image);
      coverHtml = `
        <div class="article-cover-wrapper">
          <img
            src="${imageUrl}"
            class="article-cover"
            loading="lazy"
            decoding="async"
            alt="Capa">
        </div>
      `;
    } else {
      coverHtml = `<div class="article-cover-wrapper"><div class="article-cover placeholder" style="background:#f0f0f0;"></div></div>`;
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

function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
}

function renderPagination(current, total) {
  const existing = document.querySelector('.pagination');
  if (existing) existing.remove();
  if (total <= 1) return;

  const div = document.createElement('div');
  div.className = 'pagination';
  const maxButtons = 5;
  let start = Math.max(1, current - Math.floor(maxButtons / 2));
  let end = Math.min(total, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.add('page-btn');
    if (i === current) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (i === currentPage) return;
      currentPage = i;
      fetchArticles();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    div.appendChild(btn);
  }
  articlesList.parentNode.insertBefore(div, articlesList.nextSibling);
}

// ==============================================
// BUSCA PRINCIPAL
// ==============================================
async function fetchArticles() {
  if (currentAbortController) {
    currentAbortController.abort();
  }

  const searchTerm = searchInput.value.trim() || null;
  const category = categoryFilter.value || null;
  const periodDays = periodFilter.value ? parseInt(periodFilter.value) : null;
  const sortBy = sortBySelect?.value || 'relevance';

  const params = {
    search_term: searchTerm,
    category_filter: category,
    period_days: periodDays,
    sort_by: sortBy,
    page_size: limit,
    page_number: currentPage
  };

  showSkeleton();

  currentAbortController = new AbortController();
  const signal = currentAbortController.signal;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_articles_v2`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params),
      signal
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const articles = await res.json();

    const total = articles.length > 0 ? articles[0].total_count : 0;
    renderArticles(articles, searchTerm, total);
    renderPagination(currentPage, Math.ceil(total / limit));
  } catch (err) {
    if (err.name === 'AbortError') return;
    console.error(err);
    articlesList.innerHTML = '<p class="error-message">Erro ao carregar artigos.</p>';
  } finally {
    currentAbortController = null;
  }
}

// ==============================================
// DEBOUNCE E EVENTOS
// ==============================================
function handleSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1;
    fetchArticles();
  }, 300);
}
function handleFilterChange() {
  currentPage = 1;
  fetchArticles();
}
searchInput.addEventListener('input', handleSearchInput);
categoryFilter.addEventListener('change', handleFilterChange);
periodFilter.addEventListener('change', handleFilterChange);
sortBySelect.addEventListener('change', handleFilterChange);

// ==============================================
// AUXILIARES
// ==============================================
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}
function isNew(createdAt) {
  return (Date.now() - new Date(createdAt).getTime()) / 86400000 < 3;
}
function truncateSummary(summary, max = 150) {
  if (!summary) return '';
  return summary.length <= max ? summary : summary.substring(0, max).trimEnd() + '…';
}
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

const svgUser = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
const svgEye = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const svgHeart = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

// ==============================================
// INICIALIZAÇÃO
// ==============================================
function init() {
  loadCategories();
  loadSortOptions();
  fetchArticles();
}
init();