window.addEventListener('storage', (event) => {
    if (event.key === 'spotify_access_token') {
        const token = event.newValue;
        const refreshToken = localStorage.getItem('spotify_refresh_token');
        
        chrome.storage.local.set({
            spotify_access_token: token,
            spotify_refresh_token: refreshToken,
            spotify_auth_state: 'logged_in'
        }, () => {
            console.log('Tokens salvos');
            
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                data: { access_token: token, refresh_token: refreshToken }
            }).catch((err) => {
                console.error('Erro ao notificar:', err);
            });
        });
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkLocalStorage);
} else {
    checkLocalStorage();
}

function checkLocalStorage() {
    const token = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    
    if (token) {
        chrome.storage.local.set({
            spotify_access_token: token,
            spotify_refresh_token: refreshToken,
            spotify_auth_state: 'logged_in'
        }, () => {
            console.log('Tokens salvos');
            
            chrome.runtime.sendMessage({
                type: 'AUTH_SUCCESS',
                data: { access_token: token, refresh_token: refreshToken }
            }).catch((err) => {
                console.error('Erro ao notificar:', err);
            });
            
            setTimeout(() => {
                window.close();
            }, 2000);
        });
    }
}

