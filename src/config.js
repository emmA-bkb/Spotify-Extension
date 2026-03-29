/**
 * Arquivo de configuração centralizado
 * Define qual servidor usar (local ou Render)
 */

// Função para detectar o servidor disponível
async function getBackendUrl() {
    // Tentar ler do localStorage primeiro (permite override manual)
    const stored = localStorage.getItem('backend_url');
    if (stored) {
        console.log('📍 Usando BACKEND_URL customizado:', stored);
        return stored;
    }

    // Em produção (extension instalada no navegador), tenta localhost primeiro
    try {
        const response = await fetch('http://127.0.0.1:5000/auth/spotify/login', {
            method: 'HEAD',
            mode: 'no-cors'
        });
        console.log('✅ Servidor LOCAL detectado (127.0.0.1:5000)');
        return 'http://127.0.0.1:5000';
    } catch (e) {
        console.log('❌ Servidor local não acessível, usando RENDER');
        return 'https://spotify-extencao.onrender.com';
    }
}

// Exportar para uso em outros arquivos
let BACKEND_URL = 'https://spotify-extencao.onrender.com'; // Default

// Inicializar assim que o script carregar
(async () => {
    BACKEND_URL = await getBackendUrl();
    console.log('🎵 BACKEND_URL definido como:', BACKEND_URL);
})();

// Função para permitir mudança manual (para debugging)
function setBackendUrl(url) {
    BACKEND_URL = url;
    localStorage.setItem('backend_url', url);
    console.log('🔧 BACKEND_URL alterado para:', url);
}

// Função para resetar para detecção automática
function resetBackendUrl() {
    localStorage.removeItem('backend_url');
    location.reload();
    console.log('🔄 BACKEND_URL resetado - recarregando...');
}
