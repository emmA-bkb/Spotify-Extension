# Spoti - Extensão Firefox para Spotify

Adicione automaticamente suas músicas favoritas a uma playlist quando você ouve um percentual configurável delas (padrão 70%).

## Features

- Auto-Add Automático - Adiciona música quando você ouve 70% dela (configurável)
- Detecção de Pulos - Não adiciona se você pular a música
- Sem Duplicatas - Mesma música nunca é adicionada duas vezes
- Funciona em Background - Continua funcionando mesmo com a extensão fechada
- Notificações - Aviso visual quando uma música é adicionada
- Múltiplas Playlists - Escolha qualquer playlist da sua conta
- Configurável - Ajuste o percentual de reprodução (10-100%)
- Seguro - OAuth 2.0 Spotify, seus dados não são compartilhados

## Como Instalar

### Opção 1: Firefox Add-ons (Em Breve)
[Disponível em breve na Mozilla Store]

### Opção 2: Instalação Manual
1. Download do arquivo `spoti.xpi`
2. Abra Firefox e vá em `about:addons`
3. Clique no ícone de configurações e selecione "Install Add-on From File"
4. Escolha `spoti.xpi`
5. Pronto!

## Como Usar

1. **Conectar ao Spotify**
   - Clique em "Conectar ao Spotify"
   - Autorize as permissões necessárias
   - Você será redirecionado automaticamente

2. **Escolher Playlist**
   - Clique em "Escolher Playlist"
   - Selecione a playlist onde quer adicionar músicas

3. **Configurar Percentual (Opcional)**
   - Clique em "Configurações"
   - Ajuste o percentual (padrão: 70%)
   - Veja a playlist selecionada

4. **Curtir Músicas!**
   - A extensão automaticamente adiciona quando você atinge o percentual
   - Recebe notificação quando cada música é adicionada

## Para Desenvolvedores / Desenvolvimento Local

### Instalação

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py
```

O servidor ficará em `http://127.0.0.1:5000`

### Carregar a Extensão no Firefox

1. Abra `about:debugging` no Firefox
2. Clique em "This Firefox"
3. Clique em "Load Temporary Add-on"
4. Navegue até a pasta `spoti` e selecione `manifest.json`

### Estrutura do Projeto

```
spoti/
├── manifest.json              # Configuração da extensão
├── popup/                     # Interface Popup
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/                # Scripts em background
│   └── background.js          # Auto-add logic
├── content/                   # Content scripts
│   └── content.js
├── icons/                     # Ícones
├── backend/                   # Backend Python
│   ├── app/
│   │   ├── main.py
│   │   ├── config/
│   │   │   └── settings.py
│   │   ├── routes/
│   │   │   └── auth.py        # OAuth & Spotify API
│   │   └── utils/
│   ├── requirements.txt
│   ├── .env
│   └── main.py
├── PUBLICACAO.md              # Guia para publicar
├── QUICK-START.md             # Guia rápido
└── README.md
```

### Variáveis de Ambiente (.env)

```
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
SPOTIFY_AUTH_URL=https://accounts.spotify.com/authorize
SPOTIFY_API_URL=https://api.spotify.com/v1
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/auth/spotify/callback
```

## Publicar a Extensão

Veja [QUICK-START.md](QUICK-START.md) para instruções rápidas de publicação.

## Privacidade & Segurança

- Nenhum dado pessoal é coletado
- Comunicação criptografada com Spotify
- Backend não armazena seus tokens
- Código Open Source
- Sem anúncios ou tracking

## Permissões

- `storage` - Armazenar suas preferências localmente
- `tabs` - Redirect do OAuth
- `notifications` - Notificar quando adiciona música
- `host_permissions` - Comunicar com Spotify API e backend

## Reportar Bugs

Encontrou um problema? Abra uma issue!

## Licença

MIT License

## Créditos

Desenvolvido com dedicação para fãs de Spotify

---

**Versão:** 1.0.0  
**Última Atualização:** Março 2026  
**Requisitos:** Firefox 109+, Conta Spotify (grátis ou premium)
    ├── README.md
    └── app/
        ├── __init__.py
        ├── config/
        │   ├── __init__.py
        │   └── settings.py
        └── routes/
            ├── __init__.py
            └── auth.py
```

##  Fluxo de Autenticação

1. **Extensão** → Clica em "Conectar ao Spotify"
2. **Backend** → Retorna URL de autenticação do Spotify
3. **Navegador** → Abre página de autorização do Spotify
4. **Spotify** → Redireciona para callback do backend com código
5. **Backend** → Troca código por token de acesso
6. **Extensão** → Exibe informações do usuário

##  Credenciais Spotify

As credenciais já estão configuradas em `backend/.env`:

```
SPOTIFY_CLIENT_ID=001db0a7a817434f9b38c8505da2a5f4
SPOTIFY_CLIENT_SECRET=fe00f8b4ee264c8485e1c77cbc846fdf
```

 **IMPORTANTE**: Essas são credenciais de exemplo. Para produção, use suas próprias credenciais do Spotify Developer Dashboard.

##  Dependências

### Backend (Python)
- Flask 2.3.2
- Flask-CORS 4.0.0
- python-dotenv 1.0.0
- requests 2.31.0

### Frontend (JavaScript)
- Nenhuma dependência externa (usa APIs nativas do Firefox)

##  Desenvolvimento

### Modificar a interface
- Edite `popup/popup.html` para estrutura
- Edite `popup/popup.css` para estilos
- Edite `popup/popup.js` para lógica

### Modificar rotas de autenticação
- Edite `backend/app/routes/auth.py` para adicionar/modificar endpoints

### Recarregar extensão
1. Vá para `about:debugging`
2. Clique no ícone de reload próximo à extensão

##  Troubleshooting

### "Erro ao conectar ao Spotify"
- Verifique se o backend está rodando: `python main.py`
- Verifique se as credenciais em `.env` estão corretas

### "Acesso negado" (CORS)
- Certifique-se de que o backend está configurado com CORS
- Verifique a URL de redirect em `backend/app/config/settings.py`

### Botão não responde
- Abra o console do Firefox (F12)
- Procure por erros na aba "Console"
- Verifique as logs do backend

##  Próximos Passos

- [ ] Adicionar ícones da extensão (icons/)
- [ ] Implementar funcionalidades do Spotify (player control, playlists, etc)
- [ ] Deploy do backend (Heroku, Railway, etc)
- [ ] Publicar extensão na Mozilla Add-ons Store

