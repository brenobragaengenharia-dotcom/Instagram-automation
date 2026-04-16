/**
 * refresh-token.js
 *
 * Renova os tokens de longa duração antes de expirarem (60 dias).
 * Execute: npm run refresh
 *
 * Recomendado: rodar a cada 30 dias via cron/GitHub Actions.
 * O token renovado é impresso no console para atualizar o .env / secrets.
 */

import 'dotenv/config';

const { META_APP_SECRET, INSTAGRAM_TOKEN_MAIN, INSTAGRAM_TOKEN_ESPORTS, INSTAGRAM_TOKEN_COMICS } = process.env;

if (!META_APP_SECRET) {
  console.error('❌ META_APP_SECRET não encontrado no .env');
  process.exit(1);
}

async function refreshToken(token, label) {
  if (!token) {
    console.log(`⏭️  ${label}: token não configurado, pulando.`);
    return null;
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/refresh_access_token` +
      `?grant_type=ig_refresh_token` +
      `&access_token=${token}`
    );
    const data = await res.json();

    if (data.error) {
      console.error(`❌ ${label}: ${data.error.message}`);
      return null;
    }

    const expiresInDays = Math.floor((data.expires_in || 5183944) / 86400);
    console.log(`✅ ${label}: token renovado! Expira em ${expiresInDays} dias.`);
    console.log(`   Novo token: ${data.access_token.substring(0, 20)}...`);
    return data.access_token;

  } catch (err) {
    console.error(`❌ ${label}: erro ao renovar token — ${err.message}`);
    return null;
  }
}

console.log('\n=== RENOVAÇÃO DE TOKENS INSTAGRAM ===\n');

const [mainToken, esportsToken, comicsToken] = await Promise.all([
  refreshToken(INSTAGRAM_TOKEN_MAIN, '@3worlds_entertainment'),
  refreshToken(INSTAGRAM_TOKEN_ESPORTS, '@3wesports'),
  refreshToken(INSTAGRAM_TOKEN_COMICS, '@3wcomics_'),
]);

console.log('\n=== ATUALIZE SEU .env (ou GitHub Secrets) COM: ===\n');
if (mainToken)   console.log(`INSTAGRAM_TOKEN_MAIN=${mainToken}`);
if (esportsToken) console.log(`INSTAGRAM_TOKEN_ESPORTS=${esportsToken}`);
if (comicsToken)  console.log(`INSTAGRAM_TOKEN_COMICS=${comicsToken}`);
console.log('');
