/**
 * publish.js
 *
 * Busca os posts do Instagram e publica o JSON no GitHub Pages.
 * Execute: npm run publish
 */

import 'dotenv/config';
import { execSync }  from 'child_process';
import { existsSync } from 'fs';
import ghpages       from 'gh-pages';

function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

console.log('\n=== PUBLICAR FEED INSTAGRAM → GITHUB PAGES ===\n');

// 1. Busca os posts
console.log('📥 Buscando posts do Instagram...\n');
run('node fetch-posts.js');

if (!existsSync('./public/instagram-feed.json')) {
  console.error('\n❌ JSON não gerado. Verifique os erros acima.');
  process.exit(1);
}

// 2. Publica a pasta public/ na branch gh-pages
console.log('\n📤 Publicando no GitHub Pages...\n');

const date = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

ghpages.publish('public', {
  branch: 'gh-pages',
  message: `chore: atualiza feed Instagram - ${date}`,
  repo: 'https://github.com/brenobragaengenharia-dotcom/Instagram-automation.git',
}, (err) => {
  if (err) {
    console.error('\n❌ Erro ao publicar:', err.message);
    process.exit(1);
  }
  console.log('\n✅ Feed publicado com sucesso!');
  console.log('🔗 https://brenobragaengenharia-dotcom.github.io/Instagram-automation/instagram-feed.json\n');
});
