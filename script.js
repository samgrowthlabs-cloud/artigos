// script.js – Home com busca, filtro de período, tags, selo "Novo", resumo
const articlesList = document.getElementById('articles-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const periodFilter = document.getElementById('period-filter');
const customPeriod = document.getElementById('custom-period');
const dateFrom = document.getElementById('date-from');
const dateTo = document.getElementById('date-to');

// ----- CATEGORIAS FIXAS -----
function loadCategories() {
  const categories = [
    'Investimento', 'Notícias', 'Finanças', 'Educação Financeira',
    'Matemática Financeira', 'Economia', 'Mercado de Ações',
    'Criptomoedas', 'Planejamento', 'Outros'
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

// ----- BUSCA -----
async function fetchFilteredArticles(search = '', category = '', period = null) {
  let url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,summary,created_at,category,tags&order=created_at.desc`;

  if (category) url += `&category=eq.${encodeURIComponent(category)}`;
  if (period?.from) {
    url += `&created_at=gte.${encodeURIComponent(period.from)}`;
    if (period.to) url += `&created_at=lte.${encodeURIComponent(period.to)}`;
  }
  if (search) {
    const enc = encodeURIComponent(`*${search}*`);
    url += `&or=(title.ilike.${enc},content.ilike.${enc},summary.ilike.${enc})`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Erro na busca:', e);
    return null;
  }
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
    link.href = `ler-artigo/index.html?id=${article.id}`;
    link.className = 'article-card';

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

    const summaryText = truncateSummary(article.summary);
    const summaryEl = document.createElement('p');
    summaryEl.className = 'article-summary-preview';
    summaryEl.textContent = summaryText;

    left.appendChild(h2);
    if (summaryText) left.appendChild(summaryEl);

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

    link.appendChild(left);
    link.appendChild(dateSpan);
    articlesList.appendChild(link);
  });
}

async function applyFilters() {
  const search = searchInput.value.trim();
  const category = categoryFilter.value;
  const period = getPeriodFilter();
  const articles = await fetchFilteredArticles(search, category, period);
  renderArticles(articles);
}

searchInput.addEventListener('input', applyFilters);
categoryFilter.addEventListener('change', applyFilters);

async function init() {
  loadCategories();
  applyFilters();
}

init();