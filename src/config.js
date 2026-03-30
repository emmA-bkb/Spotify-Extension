const BACKEND_URL = 'https://spotify-extencao.onrender.com';

function setBackendUrl(url) {
    window.BACKEND_URL = url;
    localStorage.setItem('backend_url', url);
    console.log('Backend URL alterado:', url);
}

function resetBackendUrl() {
    localStorage.removeItem('backend_url');
    console.log('Backend URL resetado');
}
