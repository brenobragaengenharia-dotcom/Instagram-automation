# Setup — Instagram Automation sem Meta Developer App

## Por que não precisamos do Meta Developer App?

O Elfsight tem o app registrado na Meta **para eles mesmos** — todos os clientes
usam os servidores do Elfsight como intermediário. Para replicar isso
sem depender do Elfsight, usamos uma de duas alternativas:

---

## OPÇÃO 1 — RapidAPI (recomendado, ~5 minutos)

### Passo a passo:

1. **Crie conta grátis em** https://rapidapi.com  
   (pode entrar com conta Google)

2. **Acesse a API:**  
   https://rapidapi.com/thetechguy32744/api/instagram-scraper-stable-api

3. **Clique em "Subscribe to Test"** → escolha o plano **Basic** (gratuito)  
   - 100 requisições/mês grátis  
   - Suficiente para rodar diariamente (3 contas × 30 dias = 90 req/mês)

4. **Copie sua chave API:**  
   Na aba "Code Snippets", copie o valor de `X-RapidAPI-Key`

5. **Configure o .env:**
   ```
   DATA_SOURCE=rapidapi
   RAPIDAPI_KEY=cole_sua_chave_aqui
   ```

6. **Teste:**
   ```bash
   npm install
   npm run fetch
   ```

---

## OPÇÃO 2 — Cookie de sessão do Instagram (sem nenhum cadastro extra)

Use isso se não quiser criar conta no RapidAPI.

### Passo a passo:

1. **Abra** https://www.instagram.com no Chrome ou Edge

2. **Faça login** na conta do Instagram  
   *(recomendado: use uma conta secundária, não a principal)*

3. **Abra o DevTools:**  
   Pressione `F12` → aba **Application** → **Cookies** → `https://www.instagram.com`

4. **Copie dois valores:**
   - `sessionid` → cole em `INSTAGRAM_SESSION_ID`
   - `csrftoken` → cole em `INSTAGRAM_CSRF_TOKEN`

5. **Configure o .env:**
   ```
   DATA_SOURCE=cookie
   INSTAGRAM_SESSION_ID=cole_aqui
   INSTAGRAM_CSRF_TOKEN=cole_aqui
   ```

6. **Teste:**
   ```bash
   npm install
   npm run fetch
   ```

> ⏰ **Atenção:** Os cookies expiram em ~90 dias. Quando o script der erro  
> "Cookie expirado", repita os passos 3–4 para renovar.

---

## Após configurar qualquer uma das opções

### Rodar manualmente:
```bash
npm run fetch
# Gera ./public/instagram-feed.json
```

### Automatizar via GitHub Actions (roda todo dia sozinho):

1. Suba esta pasta para um repositório GitHub
2. Vá em **Settings → Secrets and Variables → Actions**
3. Adicione os secrets (mesmos valores do .env):
   - `RAPIDAPI_KEY` (se usar RapidAPI)
   - `INSTAGRAM_SESSION_ID` + `INSTAGRAM_CSRF_TOKEN` (se usar cookie)
4. Ative **GitHub Pages** em Settings → Pages → Branch: `gh-pages`
5. O JSON ficará disponível em:  
   `https://SEU-USUARIO.github.io/SEU-REPO/instagram-feed.json`

### Atualizar o componente React no Lovable:
- Abra `src/components/InstagramFeed.tsx`
- Atualize `FEED_JSON_URL` com a URL do GitHub Pages acima
- Siga as instruções em `COMO-SUBSTITUIR-ELFSIGHT.md`
