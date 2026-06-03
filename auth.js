import { supabase, setCurrentUser, clearCurrentUser } from './supabase.js'

// Funções de hash usando Web Crypto API
async function deriveKeyFromPassword(password, salt, isHash = false) {
    const encoder = new TextEncoder()
    const passwordBuffer = encoder.encode(password)
    const saltBuffer = encoder.encode(salt)
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw', passwordBuffer, 'PBKDF2', false, ['deriveBits']
    )
    
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBuffer, iterations: 100000, hash: 'SHA-256' },
        keyMaterial, 256
    )
    
    const hashArray = Array.from(new Uint8Array(derivedBits))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    return hashHex
}

function generateSalt() {
    return Math.random().toString(36) + Date.now().toString(36)
}

export async function register(username, password, pergunta, resposta) {
    // Verificar se username já existe
    const { data: existing } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()
    
    if (existing) throw new Error('Username já existe')
    
    const salt = generateSalt()
    const passwordHash = await deriveKeyFromPassword(password, salt)
    const respostaSalt = generateSalt()
    const respostaHash = await deriveKeyFromPassword(resposta, respostaSalt)
    
    const { data, error } = await supabase
        .from('users')
        .insert({
            username,
            password_hash: passwordHash,
            password_salt: salt,
            pergunta_seguranca: pergunta,
            resposta_hash: respostaHash,
            resposta_salt: respostaSalt,
            bio: ''
        })
        .select('id, username, cargo, bio, seguidores_count')
        .single()
    
    if (error) throw new Error(error.message)
    
    setCurrentUser(data)
    return data
}

export async function login(username, password) {
    const { data: user, error } = await supabase
        .from('users')
        .select('id, username, cargo, bio, seguidores_count, password_hash, password_salt')
        .eq('username', username)
        .single()
    
    if (error || !user) throw new Error('Usuário não encontrado')
    
    const hash = await deriveKeyFromPassword(password, user.password_salt)
    if (hash !== user.password_hash) throw new Error('Senha incorreta')
    
    delete user.password_hash
    delete user.password_salt
    
    setCurrentUser(user)
    return user
}

export function logout() {
    clearCurrentUser()
    window.location.href = '/login/index.html'
}

export async function recoverPassword(username, pergunta, resposta, novaSenha) {
    const { data: user, error } = await supabase
        .from('users')
        .select('id, pergunta_seguranca, resposta_hash, resposta_salt')
        .eq('username', username)
        .single()
    
    if (error || !user) throw new Error('Usuário não encontrado')
    
    if (user.pergunta_seguranca !== pergunta) throw new Error('Pergunta de segurança incorreta')
    
    const respostaHash = await deriveKeyFromPassword(resposta, user.resposta_salt)
    if (respostaHash !== user.resposta_hash) throw new Error('Resposta incorreta')
    
    const newSalt = generateSalt()
    const newPasswordHash = await deriveKeyFromPassword(novaSenha, newSalt)
    
    const { error: updateError } = await supabase
        .from('users')
        .update({
            password_hash: newPasswordHash,
            password_salt: newSalt
        })
        .eq('id', user.id)
    
    if (updateError) throw new Error('Erro ao atualizar senha')
    
    return true
}