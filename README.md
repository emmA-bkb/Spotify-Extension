# Spoti - Extensão Firefox para Spotify

Adicione automaticamente suas músicas favoritas a uma playlist quando você ouve um percentual configurável delas (padrão 70%).

## Características

Auto-add automático que adiciona música quando você ouve 70% dela (configurável). Detecta pulos para não adicionar se você pular a música. Impede duplicatas onde a mesma música nunca é adicionada duas vezes. Funciona em background mesmo com a extensão fechada. Notificações visuais quando uma música é adicionada. Suport para múltiplas playlists. Configurável para ajustar o percentual de reprodução (10-100%). Seguro com OAuth 2.0 Spotify e dados não compartilhados.

## Instalação

1. Download do arquivo `spoti.xpi`
2. Abra Firefox e vá em `about:addons`
3. Clique no ícone de configurações e selecione "Install Add-on From File"
4. Escolha `spoti.xpi`

Para publicar na Firefox Add-ons Store, veja a seção "Publicar no Firefox".

## Como Usar

1. Conecte ao Spotify clicando em "Conectar ao Spotify" e autorize as permissões
2. Escolha uma playlist clicando em "Escolher Playlist" e selecione onde adicionar
3. Configure o percentual em "Configurações" (padrão: 70%)
4. A extensão adiciona automaticamente quando atingir o percentual e você recebe notificações

## Desenvolvimento Local

### Instalação

```bash
cd backend
pip install -r requirements.txt
python main.py
```

O servidor ficará em `http://127.0.0.1:5000`

### Carregar no Firefox

1. Abra `about:debugging` no Firefox
2. Clique em "This Firefox"
3. Clique em "Load Temporary Add-on"
4. Selecione `manifest.json` do projeto

### Estrutura do Projeto

```
spoti/
├── manifest.json
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── background/
│   └── background.js
├── content/
│   └── content.js
├── icons/
├── src/
│   └── config.js
└── backend/
    ├── app/
    │   ├── main.py
    │   ├── config/
    │   │   └── settings.py
    │   └── routes/
    │       └── auth.py
    ├── requirements.txt
    ├── .env.example
    └── main.py
```

### Variáveis de Ambiente

Crie um arquivo `.env` em `backend/`:

```
SPOTIFY_CLIENT_ID=seu_client_id
SPOTIFY_CLIENT_SECRET=seu_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:5000/auth/spotify/callback
SECRET_KEY=gere_uma_chave_segura_aqui
FLASK_DEBUG=False
```

Gere uma chave segura:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

## Deploy em Produção

### Backend no Render.com

1. Acesse https://render.com e crie uma conta com GitHub
2. Clique em "New" depois "Web Service"
3. Configure:
   - Nome: spoti-backend
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app.main:app`

4. Adicione Environment Variables:
   ```
   SPOTIFY_CLIENT_ID=seu_id
   SPOTIFY_CLIENT_SECRET=seu_secret
   SPOTIFY_REDIRECT_URI=
   SECRET_KEY=sua_chave_segura
   FLASK_DEBUG=False
   ```

5. Deploy leva 2-3 minutos e você copia a URL

### Atualizar URLs da Extensão

Edite `popup.js` e `background.js`:
```javascript
const BACKEND_URL = 'https://seu-backend.onrender.com';
```

No arquivo `src/config.js`:
```javascript
const BACKEND_URL = 'https://seu-backend.onrender.com';
```

### Criar Arquivo .xpi

Windows (PowerShell):
```powershell
cd c:\Visual Studio\spoti
Compress-Archive -Path * -DestinationPath spoti.zip
```

Renomeie `spoti.zip` para `spoti.xpi`

Linux/Mac:
```bash
cd /caminho/do/spoti
zip -r spoti.xpi * -x "*.git*" "backend/*" "node_modules/*"
```

### Publicar no Firefox

1. Crie conta em addons.mozilla.org
2. Vá em "Submit Your Add-on"
3. Envie um arquivo `.zip` da extensão
4. Preencha informações:
   - Nome: Spoti - Auto-Add Playlist
   - Descrição: Adicione automaticamente músicas à sua playlist do Spotify quando atingir 70%
   - Ícones (128x128, 256x256, 512x512)
5. Aguarde review (5-7 dias)

## Segurança

Nenhum dado pessoal é coletado. Comunicação criptografada via HTTPS com Spotify. Backend não armazena tokens permanentemente. OAuth 2.0 conforme RFC 6749. Tokens com expiração e refresh automático.

### Checklist de Segurança em Produção

Backend (Python/Flask):
- Criar arquivo `.env` e gerar `SECRET_KEY` forte
- CORS restrito apenas a `moz-extension://*`
- DEBUG sempre `False` em produção
- Usar HTTPS em todas as URLs
- Tokens salvos na sessão (servidor-side)

Frontend (JavaScript):
- Usar `chrome.storage.local` (isolado por extensão)
- Validar token antes de usar
- Renovar com refresh_token quando expirar
- Solicitar apenas permissões necessárias

OAuth 2.0:
- State token gerado automaticamente pelo Spotify
- Redirect URI validado
- Scopes limitados: playlist-modify-private, user-read-playback-state, playlist-read-private

Credenciais Spotify:
- Nunca commitar .env com credenciais reais
- Nunca compartilhar screenshots com credenciais
- Rotacionar se comprometidas
- Usar diferentes credenciais para dev/prod

Dependências:
- Manter Flask e bibliotecas atualizadas
- Usar `pip install -r requirements.txt` com versões fixas
- Revisar regularmente: `pip audit`

## Permissões

- `storage` - Armazenar preferências localmente
- `tabs` - Redirect do OAuth
- `notifications` - Avisos ao adicionar música
- `host_permissions` - Comunicar com APIs

## Troubleshooting

Erro ao conectar:
- Verifique se backend está rodando: `python main.py`
- Confirme URLs corretas em `BACKEND_URL`

Permissão negada:
- Faça logout e login novamente
- Playlist deve ser sua (não de outra pessoa)
- Tokens expiram em 1 hora, sistema faz refresh automático

Botão não responde:
- Abra console do Firefox (F12)
- Procure erros na aba "Console"
- Verifique logs do backend

## Dependências

Backend:
- Flask 2.3.2
- Flask-CORS 4.0.0
- python-dotenv 1.0.0
- requests 2.31.0
- gunicorn (produção)

Frontend:
- Nenhuma dependência externa (APIs nativas do Firefox)

## Informações

Versão: 1.0.0
Requisitos: Firefox 109+, Conta Spotify (gratuita ou premium)
Licença: MIT
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




 **IMPORTANTE**: Essas são credenciais de exemplo. Para produção, use suas próprias credenciais do Spotify Developer Dashboard.

## 📦 Dependências

### Backend (Python)
- Flask 2.3.2
- Flask-CORS 4.0.0
- python-dotenv 1.0.0
- requests 2.31.0

### Frontend (JavaScript)
- Nenhuma dependência externa (usa APIs nativas do Firefox)

## 🛠️ Desenvolvimento

### Modificar a interface
- Edite `popup/popup.html` para estrutura
- Edite `popup/popup.css` para estilos
- Edite `popup/popup.js` para lógica

### Modificar rotas de autenticação
- Edite `backend/app/routes/auth.py` para adicionar/modificar endpoints

### Recarregar extensão
1. Vá para `about:debugging`
2. Clique no ícone de reload próximo à extensão

## 🐛 Troubleshooting

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

## 📝 Próximos Passos

- [ ] Adicionar ícones da extensão (icons/)
- [ ] Implementar funcionalidades do Spotify (player control, playlists, etc)
- [ ] Deploy do backend (Heroku, Railway, etc)
- [ ] Publicar extensão na Mozilla Add-ons Store

