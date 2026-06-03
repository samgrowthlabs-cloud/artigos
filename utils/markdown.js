// utils/markdown.js - Conversor simples de Markdown para HTML
export function renderMarkdown(md) {
    if (!md) return '';
    
    let html = md;
    
    // Escapar HTML primeiro para evitar injeção
    html = html.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if ( m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
    
    // Negrito: **texto** ou __texto__
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Itálico: *texto* ou _texto_
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Títulos: # H1, ## H2, ### H3
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Listas não ordenadas: - item ou * item
    html = html.replace(/^[\-\*] (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Listas ordenadas: 1. item
    html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');
    
    // Links: [texto](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Parágrafos: linhas em branco separam parágrafos
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    html = html.replace(/<p><\/p>/g, '');
    
    // Quebras de linha simples
    html = html.replace(/\n/g, '<br>');
    
    return html;
}