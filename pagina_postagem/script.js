import { supabase, getCurrentUser, requireAuth } from '../supabase.js';
import { loadHeader } from '../components/header.js';

let currentUser = null;
let editArticleId = null; // Se não null, estamos editando

// Configurar editor rich text
function setupEditor() {
    const editorDiv = document.getElementById('editor-content');
    const hiddenTextarea = document.getElementById('conteudo');
    const toolbar = document.querySelector('.editor-toolbar');
    
    // Carregar conteúdo existente se for edição
    if (editArticleId) {
        // O conteúdo será carregado depois
    }
    
    // Sincronizar ao enviar formulário
    const form = document.getElementById('article-form');
    form.addEventListener('submit', () => {
        hiddenTextarea.value = editorDiv.innerHTML;
    });
    
    // Botões de formatação
    toolbar.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.dataset.cmd;
            if (cmd === 'createLink') {
                const url = prompt('Digite a URL do link:', 'https://');
                if (url) document.execCommand(cmd, false, url);
            } else {
                document.execCommand(cmd, false, null);
            }
            editorDiv.focus();
        });
    });
    
    // Sincronizar conteúdo inicial (se houver)
    if (editArticleId) {
        loadArticleForEdit();
    }
}

async function loadArticleForEdit() {
    const { data: article, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', editArticleId)
        .single();
    if (error) {
        document.getElementById('error').innerText = 'Erro ao carregar artigo para edição.';
        return;
    }
    document.getElementById('titulo').value = article.titulo;
    document.getElementById('resumo').value = article.resumo;
    document.getElementById('editor-content').innerHTML = article.conteudo;
    document.getElementById('conteudo').value = article.conteudo;
    document.getElementById('form-title').innerText = 'Editar Artigo';
}

document.addEventListener('DOMContentLoaded', async () => {
    currentUser = await requireAuth();
    if (!currentUser) return;
    await loadHeader();
    
    // Verificar se estamos editando (parâmetro ?id=xxx)
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
        // Verificar permissão: só pode editar se for autor ou moderador+
        const { data: art } = await supabase.from('articles').select('autor_id').eq('id', id).single();
        if (art && (art.autor_id === currentUser.id || ['moderator','supervisor','admin'].includes(currentUser.cargo))) {
            editArticleId = id;
        } else {
            alert('Você não tem permissão para editar este artigo.');
            window.location.href = '/index.html';
            return;
        }
    }
    
    setupEditor();
    
    const form = document.getElementById('article-form');
    const errorDiv = document.getElementById('error');
    const successDiv = document.getElementById('success');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const titulo = document.getElementById('titulo').value;
        const resumo = document.getElementById('resumo').value;
        const conteudoHtml = document.getElementById('editor-content').innerHTML;
        const pdfFile = document.getElementById('pdf-file').files[0];
        
        let pdfUrl = null;
        if (pdfFile) {
            const fileExt = pdfFile.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('pdfs').upload(fileName, pdfFile);
            if (uploadError) {
                errorDiv.innerText = 'Erro no upload do PDF: ' + uploadError.message;
                return;
            }
            const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(fileName);
            pdfUrl = urlData.publicUrl;
        }
        
        if (editArticleId) {
            // EDITANDO
            const { data: original } = await supabase.from('articles').select('autor_id, status').eq('id', editArticleId).single();
            const isModerator = ['moderator','supervisor','admin'].includes(currentUser.cargo);
            
            if (isModerator || original.autor_id === currentUser.id && currentUser.cargo !== 'user') {
                // Moderador ou autor com cargo superior: atualiza diretamente
                const { error: updateError } = await supabase
                    .from('articles')
                    .update({
                        titulo, resumo, conteudo: conteudoHtml,
                        pdf_url: pdfUrl || original.pdf_url,
                        updated_at: new Date()
                    })
                    .eq('id', editArticleId);
                if (updateError) throw updateError;
                successDiv.innerText = 'Artigo atualizado com sucesso!';
            } else {
                // Usuário comum: cria nova versão pendente
                const { data: newArticle, error: insertError } = await supabase
                    .from('articles')
                    .insert({
                        titulo, resumo, conteudo: conteudoHtml,
                        pdf_url: pdfUrl,
                        autor_id: currentUser.id,
                        status: 'pending',
                        original_article_id: editArticleId
                    })
                    .select();
                if (insertError) throw insertError;
                successDiv.innerText = 'Edição enviada para aprovação.';
            }
        } else {
            // NOVO ARTIGO
            const { data: articleId, error: createError } = await supabase.rpc('create_article', {
                p_titulo: titulo,
                p_resumo: resumo,
                p_conteudo: conteudoHtml,
                p_pdf_url: pdfUrl,
                p_autor_id: currentUser.id
            });
            if (createError) throw createError;
            successDiv.innerText = currentUser.cargo === 'user' ? 'Artigo enviado para aprovação!' : 'Artigo publicado com sucesso!';
        }
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
    });
});