
const SUPABASE_URL = 'https://gyqkjunfnmgsawwmevbg.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uzCqzcTbNwt75g0_3k1yCw_wp6DnwT-';


import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'


export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Gerenciamento de sessão manual
let currentUser = null

export function getCurrentUser() {
    const userJson = localStorage.getItem('platform_user')
    if (userJson) {
        currentUser = JSON.parse(userJson)
        return currentUser
    }
    return null
}

export function setCurrentUser(user) {
    currentUser = user
    localStorage.setItem('platform_user', JSON.stringify(user))
}

export function clearCurrentUser() {
    currentUser = null
    localStorage.removeItem('platform_user')
}

export function requireAuth() {
    const user = getCurrentUser()
    if (!user) {
        window.location.href = '/login/index.html'
        return null
    }
    return user
}

export function requireCargo(minCargo) {
    const user = requireAuth()
    if (!user) return null
    
    const cargos = ['user', 'moderator', 'supervisor', 'admin']
    const userIndex = cargos.indexOf(user.cargo)
    const requiredIndex = cargos.indexOf(minCargo)
    
    if (userIndex < requiredIndex) {
        alert('Acesso negado. Permissão insuficiente.')
        window.location.href = '/index.html'
        return null
    }
    return user
}