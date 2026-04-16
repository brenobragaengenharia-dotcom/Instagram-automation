/**
 * setup-token.js
 *
 * Utilitário interativo para gerar o access token do Instagram pela primeira vez.
 * Execute: npm run setup
 *
 * Pré-requisitos:
 * 1. Acesse https://developers.facebook.com e crie um App (tipo: Business)
 * 2. Adicione o produto "Instagram Graph API" ao app
 * 3. Preencha META_APP_ID e META_APP_SECRET no .env
 */

import 'dotenv/config';
import { createServer } from 'http';
import { URL } from 'url';

const { META_APP_ID, META_APP_SECRET } = process.env;

if (!META_APP_ID || !META_APP_SECRET) {
  console.error('❌ Preencha META_APP_ID e META_APP_SECRET no arquivo .env');
  process.exit(1);
}

const REDIRECT_URI = 'http://localhost:3000/callback';
const SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
  'pages_read_engagement',
  'pages_show_list',
].join(',');

// Monta a URL de autorização
const authUrl =
  `https://www.facebook.com/v21.0/dialog/oauth` +
  `?client_id=${META_APP_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&response_type=code`;

console.log('\n=== SETUP DO TOKEN INSTAGRAM ===\n');
console.log('1. Abra esta URL no navegador e autorize o app:\n');
console.log(authUrl);
console.log('\n2. Aguardando callback na porta 3000...\n');

// Servidor temporário para capturar o código de autorização
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3000');
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error_description');

  if (error) {
    res.end(`<h1>Erro: ${error}</h1>`);
    server.close();
    return;
  }

  if (!code) {
    res.end('<h1>Aguardando autorização...</h1>');
    return;
  }

  res.end('<h1>Autorização recebida! Verifique o terminal.</h1>');

  try {
    // Troca o código pelo token de curta duração
    console.log('3. Trocando código por token de curta duração...');
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      throw new Error(tokenData.error.message);
    }

    const shortToken = tokenData.access_token;
    console.log('✅ Token de curta duração obtido.\n');

    // Troca pelo token de longa duração (60 dias)
    console.log('4. Convertendo para token de longa duração (60 dias)...');
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${META_APP_ID}` +
      `&client_secret=${META_APP_SECRET}` +
      `&fb_exchange_token=${shortToken}`
    );
    const longData = await longRes.json();

    if (longData.error) {
      throw new Error(longData.error.message);
    }

    const longToken = longData.access_token;
    const expiresInDays = Math.floor((longData.expires_in || 5183944) / 86400);

    console.log('✅ Token de longa duração gerado!\n');
    console.log('=== ADICIONE ISSO AO SEU .env ===\n');
    console.log(`INSTAGRAM_TOKEN_MAIN=${longToken}`);
    console.log(`\n⏰ Expira em: ${expiresInDays} dias`);
    console.log('💡 Execute "npm run refresh" periodicamente para renovar.\n');

  } catch (err) {
    console.error('❌ Erro:', err.message);
  }

  server.close();
});

server.listen(3000, () => {
  // Servidor iniciado — aguardando callback
});
