// Background Script - Roda sempre em segundo plano
// BACKEND_URL é carregado de config.js

console.log('🎵 Spoti Background Script carregado!');

// Estado de rastreamento
let trackMonitoringInterval = null;
let isAddingTrack = false; // Lock para evitar adições simultâneas
let lastAddedTime = 0; // Timestamp da última adição

// Sincronizar estado a cada 5 minutos
setInterval(syncSpotifyState, 5 * 60 * 1000);

// Sincronizar também quando a extensão é inicializada
syncSpotifyState();

// Verificar se auto-add está habilitado ao carregar
chrome.storage.local.get(['selected_playlist'], (storage) => {
    if (storage.selected_playlist) {
        startTrackMonitoring();
    }
});

// Ouvir mudanças no storage (para saber se playlist foi selecionada)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.selected_playlist) {
        if (changes.selected_playlist.newValue) {
            console.log('🎵 Auto-add habilitado! Começando a monitorar...');
            startTrackMonitoring();
        } else {
            console.log('🎵 Auto-add desabilitado! Parando rastreamento...');
            stopTrackMonitoring();
        }
    }
});

/**
 * Inicia o monitoramento de tracks
 */
function startTrackMonitoring() {
    if (trackMonitoringInterval) return; // Já está rodando
    
    console.log('▶️ Iniciando monitoramento de tracks em background');
    
    trackMonitoringInterval = setInterval(trackCurrentSong, 3000); // Aumentado para 3 segundos
    // Executar imediatamente
    trackCurrentSong();
}

/**
 * Para o monitoramento de tracks
 */
function stopTrackMonitoring() {
    if (trackMonitoringInterval) {
        clearInterval(trackMonitoringInterval);
        trackMonitoringInterval = null;
        console.log('⏸️ Monitoramento de tracks parado');
    }
}

/**
 * Rastreia a música atualmente tocando
 */
async function trackCurrentSong() {
    try {
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get([
                'spotify_access_token',
                'spotify_auth_state',
                'selected_playlist',
                'threshold_percentage',
                'current_track_monitoring',
                'added_tracks'
            ], resolve);
        });
        
        const token = storage.spotify_access_token;
        const authState = storage.spotify_auth_state;
        const selectedPlaylist = storage.selected_playlist;
        const thresholdPercentage = storage.threshold_percentage || 70;
        const currentTracking = storage.current_track_monitoring || {};
        const addedTracks = storage.added_tracks || {};
        
        // Verificar se está autenticado e tem playlist selecionada
        if (!token || authState !== 'logged_in' || !selectedPlaylist) {
            return;
        }
        
        // Buscar track atual
        const response = await fetch(`${BACKEND_URL}/auth/spotify/current_track`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ access_token: token })
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (!data.is_playing || !data.item) {
            // Música não está tocando, resetar tracking
            chrome.storage.local.set({ current_track_monitoring: { trackId: null } });
            return;
        }
        
        const item = data.item;
        const trackId = item.id;
        const progress = item.progress_ms;
        const duration = item.duration_ms;
        const progressPercentage = (progress / duration) * 100;
        
        // Se é uma música diferente, resetar rastreamento
        if (currentTracking.trackId !== trackId) {
            console.log(`🎵 Nova música: ${item.name}`);
            
            chrome.storage.local.set({
                current_track_monitoring: {
                    trackId: trackId,
                    trackName: item.name,
                    trackArtist: item.artists.map(a => a.name).join(', '),
                    maxProgress: progressPercentage
                }
            });
        } else {
            // Mesmo track, atualizar progresso máximo (para detectar pulo)
            const maxProgress = Math.max(currentTracking.maxProgress || 0, progressPercentage);
            
            // Se pulou para trás de forma significativa (mais de 20%), reseta máximo
            if (progressPercentage < (currentTracking.maxProgress - 20)) {
                console.log('⏭️ Track pulada detectada');
                chrome.storage.local.set({
                    current_track_monitoring: {
                        ...currentTracking,
                        maxProgress: progressPercentage
                    }
                });
                return; // Não adiciona
            }
            
            // Atualizar máximo progresso
            if (maxProgress > currentTracking.maxProgress) {
                chrome.storage.local.set({
                    current_track_monitoring: {
                        ...currentTracking,
                        maxProgress: maxProgress
                    }
                });
            }
            
            // Se atingiu o threshold e ainda não foi adicionada
            if (progressPercentage >= thresholdPercentage && !addedTracks[trackId]) {
                console.log(`✅ Track atingiu ${thresholdPercentage}%! Adicionando à playlist...`);
                // Marcar como adicionada IMEDIATAMENTE (antes da chamada ao servidor)
                // Isto evita múltiplas requisições da mesma música
                addedTracks[trackId] = true;
                chrome.storage.local.set({ added_tracks: addedTracks });
                addTrackToPlaylistBackground(trackId, item, selectedPlaylist, token, addedTracks);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao rastrear música:', error);
    }
}

/**
 * Adiciona track à playlist em background
 */
async function addTrackToPlaylistBackground(trackId, item, playlist, token, addedTracks) {
    // Proteção contra múltiplas adições simultâneas
    if (isAddingTrack) {
        console.log('⏳ Já estou adicionando uma track. Ignorando...');
        return;
    }
    
    // Proteção contra adições muito rápidas (menos de 1 segundo)
    const timeSinceLastAdd = Date.now() - lastAddedTime;
    if (timeSinceLastAdd < 1000) {
        console.log(`⏳ Última adição foi há ${timeSinceLastAdd}ms. Aguardando...`);
        return;
    }
    
    isAddingTrack = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/auth/spotify/add_track_to_playlist`, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                access_token: token,
                playlist_id: playlist.id,
                track_uri: `spotify:track:${trackId}`
            })
        });
        
        if (response.ok) {
            lastAddedTime = Date.now();
            
            console.log(`🎵 "${item.name}" adicionada à playlist "${playlist.name}"!`);
            
            // Notificar o usuário com notificação
            chrome.notifications.create(`track-added-${trackId}`, {
                type: 'basic',
                iconUrl: item.cover || 'icons/icon-128.png',
                title: '✅ Música Adicionada!',
                message: `"${item.name}" foi adicionada à playlist "${playlist.name}"`
            });
        } else {
            console.error('❌ Erro ao adicionar track:', await response.json());
        }
    } catch (error) {
        console.error('❌ Erro ao adicionar track em background:', error);
    } finally {
        isAddingTrack = false;
    }
}

/**
 * Sincroniza o estado do Spotify em background
 */
async function syncSpotifyState() {
    try {
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token', 'spotify_auth_state'], resolve);
        });
        
        const token = storage.spotify_access_token;
        const authState = storage.spotify_auth_state;
        
        console.log('Background sync - Auth state:', authState, 'Token:', token ? 'exists' : 'not found');
        
        if (token && authState === 'logged_in') {
            // Validar token com backend
            const response = await fetch(`${BACKEND_URL}/auth/spotify/user`, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ access_token: token })
            });
            
            if (!response.ok) {
                console.log('❌ Token expirou - marcando como logado fora');
                chrome.storage.local.set({ spotify_auth_state: 'logged_out' });
                stopTrackMonitoring();
            } else {
                console.log('✅ Token válido - estado sincronizado');
                
                // Se tem playlist selecionada, iniciar monitoramento
                const checkPlaylist = await new Promise((resolve) => {
                    chrome.storage.local.get(['selected_playlist'], resolve);
                });
                
                if (checkPlaylist.selected_playlist) {
                    startTrackMonitoring();
                }
            }
        } else {
            stopTrackMonitoring();
        }
    } catch (error) {
        console.error('Erro ao sincronizar estado:', error);
    }
}

// Listener para mensagens de outras partes da extensão
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Mensagem recebida no background:', request.type);
    
    if (request.type === 'SYNC_STATE') {
        syncSpotifyState().then(() => sendResponse({ success: true }));
        return true;
    }
});


