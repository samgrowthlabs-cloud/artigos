// ==============================================
// ler-artigo/script.js – Completo com CAPA, AUTOR, ÍNDICE, RELACIONADOS,
//                        ÁUDIO, TRENDING, CITAÇÃO, IMPRESSÃO
//              (botão de modo escuro apenas no header)
// ==============================================

const DEFAULT_FONT_SIZE = 1.5; // rem

const articleContent = document.getElementById('article-content');
const progressBar = document.getElementById('progress-bar');
const fontSmaller = document.getElementById('font-smaller');
const fontLarger = document.getElementById('font-larger');
const articleIndex = document.getElementById('article-index');
const indexNav = document.getElementById('index-nav');
const indexToggle = document.getElementById('index-toggle');
const relatedSection = document.getElementById('related-articles');
const relatedList = document.getElementById('related-list');
const backToTop = document.getElementById('back-to-top');

// ---------- MODO ESCURO (controlado pelo botão no header) ----------
let darkMode = localStorage.getItem('bidartigos_dark_mode') === 'true';

function applyDarkMode() {
  if (darkMode) document.body.classList.add('dark-mode');
  else document.body.classList.remove('dark-mode');
}

function toggleDarkMode() {
  darkMode = !darkMode;
  localStorage.setItem('bidartigos_dark_mode', darkMode);
  applyDarkMode();
  
  // Atualiza ícone do botão do header
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) {
    const svg = toggleBtn.querySelector('svg');
    if (svg) {
      if (darkMode) {
        // Ícone de sol (modo escuro ativo)
        svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
      } else {
        // Ícone de lua (modo claro)
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    }
  }
}

// ---------- CITAÇÃO E IMPRESSÃO ----------
function generateCitation(article) {
  const authorName = article.author_name || article.author || 'Autor desconhecido';
  const date = new Date(article.created_at).toLocaleDateString('pt-BR');
  const title = article.title;
  const url = window.location.href;
  return `${authorName}. ${title}. BIDARTIGOS, ${date}. Disponível em: ${url}. Acesso em: ${new Date().toLocaleDateString('pt-BR')}.`;
}
function copyCitation(article) {
  navigator.clipboard.writeText(generateCitation(article))
    .then(() => alert('Citação copiada!'))
    .catch(() => alert('Não foi possível copiar.'));
}
function printArticle() {
  window.print();
}

function getArticleId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function fetchArticle(id) {
  const url = `${SUPABASE_URL}/rest/v1/articles?id=eq.${id}&select=*`;
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();
    return data.length ? data[0] : null;
  } catch (e) {
    console.error('Erro ao carregar artigo:', e);
    return null;
  }
}

async function fetchAuthor(authorId) {
  if (!authorId) return null;
  const url = `${SUPABASE_URL}/rest/v1/authors?id=eq.${authorId}&select=*`;
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const data = await res.json();
    return data.length ? data[0] : null;
  } catch (e) {
    console.error('Erro ao carregar autor:', e);
    return null;
  }
}

function calculateReadingTime(text) {
  const words = text.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function countWords(text) {
  return text.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

async function trackView(articleId) {
  const key = `bidartigos_viewed_${articleId}`;
  if (localStorage.getItem(key)) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_article_views`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ article_id: articleId })
    });
    localStorage.setItem(key, 'true');
  } catch (e) { console.warn('Erro view:', e); }
}

async function handleLike(articleId, button) {
  const key = `bidartigos_liked_${articleId}`;
  if (localStorage.getItem(key)) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_article_likes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ article_id: articleId })
    });
    localStorage.setItem(key, 'true');
    button.classList.add('liked');
    button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Curtido`;
  } catch (e) { console.warn('Erro like:', e); }
}

function buildSourcesHTML(sourceField) {
  if (!sourceField) return '<div class="article-source"><span class="source-label">Fontes</span><p>não informadas</p></div>';
  try {
    const arr = JSON.parse(sourceField);
    if (Array.isArray(arr) && arr.length) {
      const items = arr.map(s => {
        const esc = escapeHtml(s);
        return s.startsWith('http') ? `<li><a href="${esc}" target="_blank" rel="noopener">${esc}</a></li>` : `<li>${esc}</li>`;
      }).join('');
      return `<div class="article-source"><span class="source-label">Fontes</span><ul class="source-list">${items}</ul></div>`;
    }
  } catch (e) {}
  return `<div class="article-source"><span class="source-label">Fonte</span><p>${escapeHtml(sourceField)}</p></div>`;
}

function generateIndex(content) {
  const container = document.createElement('div');
  container.innerHTML = content;
  const headings = container.querySelectorAll('h2, h3');
  const items = [];
  headings.forEach((h, i) => {
    const id = `heading-${i}`;
    h.id = id;
    items.push({ level: h.tagName.toLowerCase(), text: h.textContent, id });
  });
  return { updatedContent: container.innerHTML, indexItems: items };
}

function buildIndexNav(items) {
  indexNav.innerHTML = '';
  if (!items.length) {
    articleIndex.style.display = 'none';
    return;
  }
  articleIndex.style.display = 'block';
  items.forEach(item => {
    const a = document.createElement('a');
    a.href = `#${item.id}`;
    a.textContent = item.text;
    a.className = item.level === 'h3' ? 'h3' : '';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById(item.id).scrollIntoView({ behavior: 'smooth' });
      if (window.innerWidth <= 1024) articleIndex.classList.remove('open');
    });
    indexNav.appendChild(a);
  });
}

if (indexToggle) {
  indexToggle.addEventListener('click', () => {
    articleIndex.classList.toggle('open');
  });
}

function setupProgressBar() {
  window.addEventListener('scroll', () => {
    const article = document.querySelector('.article-container');
    if (!article) return;
    const top = article.offsetTop;
    const height = article.scrollHeight;
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    let progress = ((scrollTop - top) / (height - windowHeight)) * 100;
    progress = Math.min(100, Math.max(0, progress));
    progressBar.style.width = `${progress}%`;
  });
}

function setupBackToTopBtn() {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function setupShareButtons(title) {
  const url = window.location.href;
  const encodedTitle = encodeURIComponent(title || "BIDARTIGOS");
  const encodedUrl = encodeURIComponent(url);
  const copyBtn = document.getElementById('share-copy');
  if (copyBtn) copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(url).then(() => alert('Link copiado!'));
  });
  const waLink = document.getElementById('share-whatsapp');
  if (waLink) {
    waLink.href = `https://api.whatsapp.com/send?text=${encodedTitle}%20-%20${encodedUrl}`;
    waLink.setAttribute('target', '_blank');
    waLink.setAttribute('rel', 'noopener noreferrer');
  }
  const twLink = document.getElementById('share-twitter');
  if (twLink) {
    twLink.href = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
    twLink.setAttribute('target', '_blank');
    twLink.setAttribute('rel', 'noopener noreferrer');
  }
}

// ----- CONTAGEM DE POSTS NO MÊS (para badge do autor) -----
async function fetchAuthorMonthlyCount(authorId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const startDate = new Date(year, month, 1).toISOString();
  const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
  const url = `${SUPABASE_URL}/rest/v1/articles?select=id&author_id=eq.${authorId}&created_at=gte.${startDate}&created_at=lte.${endDate}`;
  try {
    const res = await fetch(url, {
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return data.length;
  } catch (e) {
    console.warn('Erro ao contar posts mensais:', e);
    return 0;
  }
}

function getProductivityBadge(count) {
  if (count >= 10) return { class: 'ultra-productive', text: '⚡ Ultra Produtivo', icon: '⚡' };
  if (count >= 5) return { class: 'productive', text: '🔥 Produtivo', icon: '🔥' };
  return null;
}

// ---------- LEITURA EM VOZ ALTA (Web Speech API) ----------
let speechSynthesis = window.speechSynthesis;
let currentUtterance = null;
let currentArticleText = '';

function getPlainTextFromArticle() {
  const articleBody = document.querySelector('.article-body');
  if (!articleBody) return '';
  return articleBody.innerText || articleBody.textContent || '';
}

function startReading(text) {
  if (!text) return;
  stopReading();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => {
    const playBtn = document.getElementById('audio-play');
    const pauseBtn = document.getElementById('audio-pause');
    if (playBtn) playBtn.style.display = 'inline-flex';
    if (pauseBtn) pauseBtn.style.display = 'none';
    currentUtterance = null;
  };
  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
  const playBtn = document.getElementById('audio-play');
  const pauseBtn = document.getElementById('audio-pause');
  if (playBtn) playBtn.style.display = 'none';
  if (pauseBtn) pauseBtn.style.display = 'inline-flex';
}

function pauseReading() {
  if (speechSynthesis.speaking && !speechSynthesis.paused) {
    speechSynthesis.pause();
    const playBtn = document.getElementById('audio-play');
    const pauseBtn = document.getElementById('audio-pause');
    if (playBtn) playBtn.style.display = 'inline-flex';
    if (pauseBtn) pauseBtn.style.display = 'none';
  }
}

function resumeReading() {
  if (speechSynthesis.paused) {
    speechSynthesis.resume();
    const playBtn = document.getElementById('audio-play');
    const pauseBtn = document.getElementById('audio-pause');
    if (playBtn) playBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-flex';
  }
}

function stopReading() {
  if (speechSynthesis.speaking || speechSynthesis.paused) {
    speechSynthesis.cancel();
  }
  currentUtterance = null;
  const playBtn = document.getElementById('audio-play');
  const pauseBtn = document.getElementById('audio-pause');
  if (playBtn) playBtn.style.display = 'inline-flex';
  if (pauseBtn) pauseBtn.style.display = 'none';
}

function setupAudioButtons() {
  const playBtn = document.getElementById('audio-play');
  const pauseBtn = document.getElementById('audio-pause');
  const stopBtn = document.getElementById('audio-stop');
  if (!playBtn || !pauseBtn || !stopBtn) return;
  currentArticleText = getPlainTextFromArticle();
  playBtn.addEventListener('click', () => {
    if (speechSynthesis.paused) resumeReading();
    else startReading(currentArticleText);
  });
  pauseBtn.addEventListener('click', pauseReading);
  stopBtn.addEventListener('click', stopReading);
}

// ---------- RENDER PRINCIPAL (sem botão de modo escuro na toolbar) ----------
async function renderArticle(article) {
  if (!article) {
    articleContent.innerHTML = `<div class="error-message" style="text-align:center;padding:3rem 0;font-family:sans-serif;color:#c00;"><p>Artigo não encontrado.</p><a href="../">← Voltar</a></div>`;
    renderCodeAndMath();
    document.title = 'Artigo não encontrado – BIDARTIGOS';
    return;
  }

  document.title = `${article.title} – BIDARTIGOS`;

  let authorData = null;
  if (article.author_id) {
    authorData = await fetchAuthor(article.author_id);
  }

  const wordCount = countWords(article.content);
  const readingTime = calculateReadingTime(article.content);
  const liked = localStorage.getItem(`bidartigos_liked_${article.id}`);
  const likeIcon = liked
    ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg> Curtido`
    : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Curtir`;

  let authorHTML = '';
  if (authorData) {
    const monthlyCount = await fetchAuthorMonthlyCount(authorData.id);
    const prodBadge = getProductivityBadge(monthlyCount);
    const badgeHtml = prodBadge ? `<span class="productivity-badge ${prodBadge.class}" title="${prodBadge.text}">${prodBadge.icon}</span>` : '';
    const avatarUrl = authorData.avatar_url || `https://ui-avatars.com/api/?background=0D8F81&color=fff&name=${encodeURIComponent(authorData.name)}`;
    const verifiedBadge = authorData.verified ? '<span class="verified-badge-small" title="Verificado">✓</span>' : '';
    authorHTML = `
      <span class="meta-author">
        <img src="${avatarUrl}" class="author-avatar-small" onerror="this.src='https://ui-avatars.com/api/?background=ccc&name=${encodeURIComponent(authorData.name)}'">
        <a href="../perfil_autor/?id=${authorData.id}">${escapeHtml(authorData.name)}</a>
        ${verifiedBadge}
        ${badgeHtml}
      </span>
    `;
  } else if (article.author) {
    authorHTML = `<span class="meta-author">Por: ${escapeHtml(article.author)}</span>`;
  }

  const categoryHTML = article.category
    ? `<span class="meta-category"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> ${escapeHtml(article.category)}</span>`
    : '';

  const summaryHTML = article.summary ? `<div class="article-summary">${escapeHtml(article.summary)}</div>` : '';
  let tagsHTML = '';
  if (Array.isArray(article.tags) && article.tags.length) {
    tagsHTML = '<div class="article-tags">' + article.tags.map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`).join('') + '</div>';
  }

  const { updatedContent, indexItems } = generateIndex(article.content);
  const sourcesHTML = buildSourcesHTML(article.source);
  const coverHTML = article.cover_image ? `<img src="${article.cover_image}" class="article-cover-full" loading="lazy" alt="Capa do artigo">` : '';

  // Badge de tendência
  const trendingBadge = article.is_trending ? '<span class="trending-badge-article">🔥 Em alta</span>' : '';

  // Barra de ferramentas (apenas citação e impressão – sem modo escuro)
  articleContent.innerHTML = `
    ${coverHTML}
    <h1 class="article-title">${escapeHtml(article.title)} ${trendingBadge}</h1>
    
    <div class="article-toolbar">
      <button id="citation-btn" class="tool-btn" title="Copiar citação">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 4v16h16V4H4z M8 9h8M8 13h6"/>
          <line x1="12" y1="17" x2="12" y2="19"/>
        </svg>
      </button>
      <button id="print-btn" class="tool-btn" title="Imprimir / PDF">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9V3h12v6M6 21h12v-6H6v6zM4 15h16v4H4z"/>
        </svg>
      </button>
    </div>

    <!-- Botões de áudio -->
    <div class="audio-controls-top">
      <button id="audio-play" title="Ouvir artigo" class="audio-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
      <button id="audio-pause" title="Pausar" class="audio-btn" style="display: none;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      </button>
      <button id="audio-stop" title="Parar" class="audio-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="6" width="12" height="12"/>
        </svg>
      </button>
    </div>

    <div class="article-meta">
      <span>${formatDate(article.created_at)}</span>
      ${authorHTML}
      ${categoryHTML}
      <span>${wordCount} palavras</span>
      <span>${readingTime} min de leitura</span>
      <span>${article.views ?? 0} visualizações</span>
      <span>${article.likes ?? 0} curtidas</span>
    </div>
    ${summaryHTML}
    ${tagsHTML}
    <div class="article-body">${updatedContent}</div>
    ${sourcesHTML}
    <div class="article-actions">
      <button id="like-button" class="like-button ${liked ? 'liked' : ''}">${likeIcon}</button>
    </div>
  `;

  // Renderiza código e fórmulas
  renderCodeAndMath();

  buildIndexNav(indexItems);
  setupProgressBar();
  setupAudioButtons();

  // Eventos da barra de ferramentas
  const citationBtn = document.getElementById('citation-btn');
  if (citationBtn) citationBtn.addEventListener('click', () => copyCitation(article));
  const printBtn = document.getElementById('print-btn');
  if (printBtn) printBtn.addEventListener('click', printArticle);

  const likeBtn = document.getElementById('like-button');
  if (!liked) likeBtn.addEventListener('click', () => handleLike(article.id, likeBtn));
}

// Renderização de código e matemática
function renderCodeAndMath() {
  if (typeof Prism !== 'undefined') Prism.highlightAll();
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
}

// ---------- ARTIGOS RELACIONADOS ----------
async function loadRelatedArticles(currentId, category) {
  if (!category) { relatedSection.style.display = 'none'; return; }
  try {
    const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,created_at,cover_image&category=eq.${encodeURIComponent(category)}&id=neq.${currentId}&limit=3&order=created_at.desc`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return;
    const articles = await res.json();
    if (!articles.length) { relatedSection.style.display = 'none'; return; }
    relatedSection.style.display = 'block';
    renderRelated(articles);
  } catch (e) { console.warn('Relacionados:', e); }
}

function renderRelated(articles) {
  relatedList.innerHTML = '';
  articles.forEach(a => {
    const link = document.createElement('a');
    link.href = `?id=${a.id}`;
    link.className = 'related-card';
    let coverRelated = '';
    if (a.cover_image) coverRelated = `<img src="${a.cover_image}" class="related-cover" loading="lazy" alt="">`;
    link.innerHTML = `
      <div class="related-card-inner">
        ${coverRelated}
        <div class="related-card-content">
          <h3>${escapeHtml(a.title)}</h3>
          <div class="related-date">${formatDate(a.created_at)}</div>
        </div>
      </div>
    `;
    relatedList.appendChild(link);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------- INICIALIZAÇÃO ----------
async function init() {
  // Aplica modo escuro salvo
  applyDarkMode();
  
  // Configura botão de modo escuro no header (se existir)
  const headerToggle = document.getElementById('dark-mode-toggle');
  if (headerToggle) {
    headerToggle.addEventListener('click', toggleDarkMode);
    // Define o ícone inicial correto
    const svg = headerToggle.querySelector('svg');
    if (svg) {
      if (darkMode) {
        svg.innerHTML = '<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6 12a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/>';
      } else {
        svg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
      }
    }
  }
  
  const id = getArticleId();
  if (!id) {
    articleContent.innerHTML = '<div class="error-message" style="text-align:center;padding:3rem 0;font-family:sans-serif;"><p>Artigo não especificado.</p><a href="../">← Voltar</a></div>';
    return;
  }
  const article = await fetchArticle(id);
  if (article) {
    await renderArticle(article);
    setupShareButtons(article.title);
    setupBackToTopBtn();
    await trackView(id);
    loadRelatedArticles(id, article.category);
    const updated = await fetchArticle(id);
    if (updated) {
      const spans = document.querySelectorAll('.article-meta span');
      spans.forEach(s => {
        if (s.textContent.includes('visualizações')) {
          s.textContent = `${updated.views} visualizações`;
        }
      });
    }
  } else {
    await renderArticle(null);
  }
}

init();