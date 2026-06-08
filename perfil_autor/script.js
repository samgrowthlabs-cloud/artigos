// perfil_autor/script.js – Perfil do autor com badge de produtividade
const profileContent = document.getElementById('profile-content');

function getAuthorId() {
  return new URLSearchParams(window.location.search).get('id');
}

async function fetchAuthor(id) {
  const url = `${SUPABASE_URL}/rest/v1/authors?id=eq.${id}&select=*`;
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

async function fetchAuthorArticles(authorId) {
  const url = `${SUPABASE_URL}/rest/v1/articles?select=id,title,created_at,cover_image&author_id=eq.${authorId}&order=created_at.desc`;
  try {
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Erro artigos do autor:', e);
    return [];
  }
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ----- BADGE DE PRODUTIVIDADE (conta posts no mês atual) -----
function getMonthlyPostCount(articles) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  return articles.filter(article => {
    const created = new Date(article.created_at);
    return created.getFullYear() === currentYear && created.getMonth() === currentMonth;
  }).length;
}

function getProductivityBadge(count) {
  if (count >= 10) {
    return {
      class: 'ultra-productive',
      text: '⚡ Ultra Produtivo (10+ posts/mês)',
      icon: '⚡'
    };
  } else if (count >= 5) {
    return {
      class: 'productive',
      text: '🔥 Produtivo (5+ posts/mês)',
      icon: '🔥'
    };
  }
  return null;
}

function renderProfile(author, articles) {
  if (!author) {
    profileContent.innerHTML = `
      <div class="profile-card" style="text-align:center;">
        <p style="color:#c00;">Autor não encontrado.</p>
        <a href="../">← Voltar para o início</a>
      </div>
    `;
    document.title = 'Autor não encontrado – BIDARTIGOS';
    return;
  }

  document.title = `${author.name} – Perfil | BIDARTIGOS`;

  // Avatar fallback
  const avatarUrl = author.avatar_url || `https://ui-avatars.com/api/?background=eee&color=333&name=${encodeURIComponent(author.name)}`;

  // Selo verificado
  const verifiedBadge = author.verified
    ? `<span class="verified-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Verificado
      </span>`
    : '';

  // Badge de produtividade
  const monthlyCount = getMonthlyPostCount(articles);
  const prodBadge = getProductivityBadge(monthlyCount);
  let prodBadgeHtml = '';
  if (prodBadge) {
    prodBadgeHtml = `<div class="productivity-badge ${prodBadge.class}" title="${prodBadge.text}">
      ${prodBadge.icon} ${prodBadge.text}
    </div>`;
  }

  // Links sociais
  let socialLinks = '';
  if (author.twitter) {
    socialLinks += `<a href="https://twitter.com/${author.twitter.replace('@', '')}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg> Twitter
    </a>`;
  }
  if (author.github) {
    socialLinks += `<a href="https://github.com/${author.github.replace('@', '')}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.73-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z"/></svg> GitHub
    </a>`;
  }
  if (author.website) {
    socialLinks += `<a href="${author.website}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Site
    </a>`;
  }
  if (author.instagram) {
    socialLinks += `<a href="https://instagram.com/${author.instagram.replace('@', '')}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> Instagram
    </a>`;
  }
  if (author.tiktok) {
    socialLinks += `<a href="https://tiktok.com/@${author.tiktok.replace('@', '')}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg> TikTok
    </a>`;
  }
  if (author.youtube) {
    let youtubeUrl = author.youtube;
    if (!youtubeUrl.startsWith('http')) {
      youtubeUrl = `https://youtube.com/${author.youtube.replace('@', '@')}`;
    }
    socialLinks += `<a href="${youtubeUrl}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg> YouTube
    </a>`;
  }

  // Grid de artigos com capa
  let articlesHtml = '';
  if (articles && articles.length) {
    articlesHtml = `
      <div class="articles-list">
        <h2>📝 Trabalhos publicados</h2>
        <div class="articles-grid">
          ${articles.map(art => `
            <a href="../ler-artigo/?id=${art.id}" class="article-card">
              ${art.cover_image ? `<img src="${art.cover_image}" class="article-cover" loading="lazy">` : '<div class="article-cover" style="background:#f5f5f5;"></div>'}
              <div class="article-info">
                <div class="article-title">${escapeHtml(art.title)}</div>
                <div class="article-date">${formatDate(art.created_at)}</div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    articlesHtml = `<div class="no-articles">✍️ Nenhum artigo publicado ainda.</div>`;
  }

  const bioHTML = author.bio ? `<div class="profile-bio">${escapeHtml(author.bio).replace(/\n/g, '<br>')}</div>` : '';

  profileContent.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <img src="${avatarUrl}" class="avatar" alt="${escapeHtml(author.name)}" onerror="this.src='https://ui-avatars.com/api/?background=ddd&color=333&name=${encodeURIComponent(author.name)}'">
        <div class="profile-title">
          <div class="profile-name">
            ${escapeHtml(author.name)}
            ${verifiedBadge}
          </div>
          ${prodBadgeHtml}
          ${socialLinks ? `<div class="profile-meta">${socialLinks}</div>` : ''}
        </div>
      </div>
      ${bioHTML}
      ${articlesHtml}
    </div>
  `;
}

async function init() {
  const id = getAuthorId();
  if (!id) {
    profileContent.innerHTML = `<div class="profile-card" style="text-align:center;"><p>ID do autor não informado.</p><a href="../">← Voltar</a></div>`;
    return;
  }
  const author = await fetchAuthor(id);
  if (author) {
    const articles = await fetchAuthorArticles(id);
    renderProfile(author, articles);
  } else {
    renderProfile(null, []);
  }
}

init();