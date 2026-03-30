console.log('Spoti Background Script carregado');

let trackMonitoringInterval = null;
let isAddingTrack = false;
let lastAddedTime = 0;

setInterval(syncSpotifyState, 5 * 60 * 1000);
syncSpotifyState();

chrome.storage.local.get(['selected_playlist'], (storage) => {
    if (storage.selected_playlist) {
        startTrackMonitoring();
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.selected_playlist) {
        if (changes.selected_playlist.newValue) {
            console.log('Auto-add habilitado! Começando a monitorar...');
            startTrackMonitoring();
        } else {
            console.log('Auto-add desabilitado! Parando rastreamento...');
            stopTrackMonitoring();
        }
    }
});

function startTrackMonitoring() {
    if (trackMonitoringInterval) return;
    console.log('Iniciando monitoramento de tracks em background');
    trackMonitoringInterval = setInterval(trackCurrentSong, 3000);
    trackCurrentSong();
}

function stopTrackMonitoring() {
    if (trackMonitoringInterval) {
        clearInterval(trackMonitoringInterval);
        trackMonitoringInterval = null;
        console.log('Monitoramento de tracks parado');
    }
}

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
        
        if (!token || authState !== 'logged_in' || !selectedPlaylist) {
            return;
        }
        
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
            chrome.storage.local.set({ current_track_monitoring: { trackId: null } });
            return;
        }
        
        const item = data.item;
        const trackId = item.id;
        const progress = item.progress_ms;
        const duration = item.duration_ms;
        const progressPercentage = (progress / duration) * 100;
        
        if (currentTracking.trackId !== trackId) {
            console.log(`Nova música: ${item.name}`);
            
            chrome.storage.local.set({
                current_track_monitoring: {
                    trackId: trackId,
                    trackName: item.name,
                    trackArtist: item.artists.map(a => a.name).join(', '),
                    maxProgress: progressPercentage
                }
            });
        } else {
            const maxProgress = Math.max(currentTracking.maxProgress || 0, progressPercentage);
            
            if (progressPercentage < (currentTracking.maxProgress - 20)) {
                console.log('Track pulada detectada');
                chrome.storage.local.set({
                    current_track_monitoring: {
                        ...currentTracking,
                        maxProgress: progressPercentage
                    }
                });
                return;
            }
            
            if (maxProgress > currentTracking.maxProgress) {
                chrome.storage.local.set({
                    current_track_monitoring: {
                        ...currentTracking,
                        maxProgress: maxProgress
                    }
                });
            }
            
            if (progressPercentage >= thresholdPercentage && !addedTracks[trackId]) {
                console.log(`Track atingiu ${thresholdPercentage}%! Adicionando à playlist...`);
                addedTracks[trackId] = true;
                chrome.storage.local.set({ added_tracks: addedTracks });
                addTrackToPlaylistBackground(trackId, item, selectedPlaylist, token, addedTracks);
            }
        }
    } catch (error) {
        console.error('Erro ao rastrear música:', error);
    }
}

async function addTrackToPlaylistBackground(trackId, item, playlist, token, addedTracks) {
    if (isAddingTrack) return;
    
    const timeSinceLastAdd = Date.now() - lastAddedTime;
    if (timeSinceLastAdd < 1000) return;
    
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
            console.log(`"${item.name}" adicionada à playlist "${playlist.name}"`);
            
            chrome.notifications.create(`track-added-${trackId}`, {
                type: 'basic',
                iconUrl: item.cover || 'icons/icon-128.png',
                title: 'Música Adicionada',
                message: `"${item.name}" foi adicionada à playlist "${playlist.name}"`
            });
        } else {
            console.error('Erro ao adicionar track:', await response.json());
        }
    } catch (error) {
        console.error('Erro ao adicionar track em background:', error);
    } finally {
        isAddingTrack = false;
    }
}

async function syncSpotifyState() {
    try {
        const storage = await new Promise((resolve) => {
            chrome.storage.local.get(['spotify_access_token', 'spotify_auth_state'], resolve);
        });
        
        const token = storage.spotify_access_token;
        const authState = storage.spotify_auth_state;
        
        if (token && authState === 'logged_in') {
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
                console.log('Token expirou - marcando como logado fora');
                chrome.storage.local.set({ spotify_auth_state: 'logged_out' });
                stopTrackMonitoring();
            } else {
                console.log('Token válido - estado sincronizado');
                
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Mensagem recebida no background:', request.type);
    
    if (request.type === 'SYNC_STATE') {
        syncSpotifyState().then(() => sendResponse({ success: true }));
        return true;
    }
});


