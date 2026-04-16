/**
 * fetch-posts.js
 *
 * Busca posts das 3 contas Instagram do site 3W Entretenimento.
 *
 * Sem cookie → retorna 12 posts por conta (limite do Instagram sem login)
 * Com cookie → retorna até 30 posts por conta via paginação autenticada
 *
 * Execute: npm run fetch
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';

const {
  INSTAGRAM_MAIN        = '3worlds_entertainment',
  INSTAGRAM_ESPORTS     = '3wesports',
  INSTAGRAM_COMICS      = '3wcomics_',
  MAX_POSTS             = '30',
  INSTAGRAM_SESSION_ID,
  INSTAGRAM_CSRF_TOKEN,
} = process.env;

const MAX = parseInt(MAX_POSTS);
const HAS_SESSION = !!(INSTAGRAM_SESSION_ID && INSTAGRAM_CSRF_TOKEN);

// ─── Headers base ────────────────────────────────────────────────────────────

const BASE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': '*/*',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'x-ig-app-id': '936619743392459',
  'Referer': 'https://www.instagram.com/',
  'Origin': 'https://www.instagram.com',
};

// Headers SEM cookie — para o endpoint de perfil (web_profile_info)
// Adicionar cookie aqui causa redirect loop no Instagram
function publicHeaders() {
  return { ...BASE_HEADERS };
}

// Headers COM cookie — para paginação (feed/user)
// Requer ds_user_id além de sessionid e csrftoken
function authHeaders(userId) {
  return {
    ...BASE_HEADERS,
    'Referer': `https://www.instagram.com/`,
    'x-csrftoken': INSTAGRAM_CSRF_TOKEN,
    'Cookie': [
      `sessionid=${INSTAGRAM_SESSION_ID}`,
      `csrftoken=${INSTAGRAM_CSRF_TOKEN}`,
      `ds_user_id=${userId}`,
    ].join('; '),
  };
}

const pause = (ms) => new Promise(r => setTimeout(r, ms));

// ─── Normaliza post do endpoint web_profile_info (page 1) ───────────────────

function normalizeGraphEdge({ node }) {
  const isVideo    = node.__typename === 'GraphVideo';
  const isCarousel = node.__typename === 'GraphSidecar';
  return {
    id:        node.id,
    shortcode: node.shortcode,
    caption:   node.edge_media_to_caption?.edges?.[0]?.node?.text || '',
    mediaType: isVideo ? 'VIDEO' : isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE',
    mediaUrl:  node.thumbnail_src || node.display_url || '',
    videoUrl:  isVideo ? (node.video_url || null) : null,
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
    timestamp: new Date(node.taken_at_timestamp * 1000).toISOString(),
    likes:     node.edge_liked_by?.count ?? node.edge_media_preview_like?.count ?? 0,
    comments:  node.edge_media_to_comment?.count ?? 0,
  };
}

// ─── Normaliza post do endpoint feed/user (pages 2+) ────────────────────────

function normalizeFeedItem(item) {
  const isVideo    = item.media_type === 2;
  const isCarousel = item.media_type === 8;
  const code       = item.code || item.shortcode || '';

  // Pega melhor imagem disponível
  const candidates = item.image_versions2?.candidates || [];
  const mediaUrl   = candidates[0]?.url
    || item.thumbnail_url
    || item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url
    || '';

  const videoUrl = isVideo
    ? (item.video_versions?.[0]?.url || null)
    : null;

  return {
    id:        item.pk || item.id?.split('_')[0] || '',
    shortcode: code,
    caption:   item.caption?.text || '',
    mediaType: isVideo ? 'VIDEO' : isCarousel ? 'CAROUSEL_ALBUM' : 'IMAGE',
    mediaUrl,
    videoUrl,
    permalink: code ? `https://www.instagram.com/p/${code}/` : '',
    timestamp: new Date((item.taken_at || item.device_timestamp / 1000 || 0) * 1000).toISOString(),
    likes:     item.like_count || 0,
    comments:  item.comment_count || 0,
  };
}

// ─── Busca uma conta completa ────────────────────────────────────────────────

async function fetchAccount(username, label) {
  console.log(`📥 Buscando ${label} (@${username})...`);
  const posts = [];

  try {
    // ── Página 1 — sem cookie (cookie causa redirect loop neste endpoint) ───
    const r1 = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
      { headers: publicHeaders() }
    );

    if (!r1.ok) throw new Error(`HTTP ${r1.status} ao buscar perfil`);

    const d1   = await r1.json();
    const user = d1.data?.user;
    if (!user) throw new Error(`Usuário @${username} não encontrado`);

    const mediaEdge = user.edge_owner_to_timeline_media;
    posts.push(...(mediaEdge?.edges || []).map(normalizeGraphEdge));

    const profile = {
      id:             user.id,
      username:       user.username,
      fullName:       user.full_name || '',
      followers:      user.edge_followed_by?.count || 0,
      following:      user.edge_follow?.count || 0,
      mediaCount:     mediaEdge?.count || 0,
      profilePicture: user.profile_pic_url_hd || user.profile_pic_url || null,
      bio:            user.biography || '',
      website:        user.external_url || null,
      isVerified:     user.is_verified || false,
    };

    // ── Páginas 2+ — requer sessão autenticada ───────────────────────────────
    if (HAS_SESSION && posts.length < MAX && mediaEdge?.page_info?.has_next_page) {
      let nextCursor = mediaEdge.page_info.end_cursor;

      while (posts.length < MAX && nextCursor) {
        await pause(1200); // pausa para não ser bloqueado

        const r = await fetch(
          `https://www.instagram.com/api/v1/feed/user/${user.id}/?max_id=${encodeURIComponent(nextCursor)}&count=12`,
          { headers: authHeaders(user.id) }
        );

        if (!r.ok) {
          const body = await r.text();
          if (body.includes('require_login') || r.status === 401) {
            console.warn(`   ⚠️  Cookie expirado para @${username}. Renove o sessionid no .env`);
          } else {
            console.warn(`   ⚠️  Paginação parou: HTTP ${r.status}`);
          }
          break;
        }

        const page = await r.json();
        if (!page.items?.length) break;

        posts.push(...page.items.map(normalizeFeedItem));
        nextCursor = page.next_max_id || null;
      }
    }

    const finalPosts = posts.slice(0, MAX);
    console.log(`✅ ${label}: ${finalPosts.length} posts | ${profile.followers.toLocaleString('pt-BR')} seguidores`);
    return { profile, posts: finalPosts };

  } catch (err) {
    console.error(`❌ ${label}: ${err.message}`);
    return { profile: null, posts: [] };
  }
}

// ─── Execução principal ──────────────────────────────────────────────────────

console.log('\n=== FETCH INSTAGRAM POSTS - 3W ENTRETENIMENTO ===\n');
console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
console.log(`📦 Posts por conta: ${MAX}`);
console.log(`🔐 Sessão: ${HAS_SESSION ? 'sim (paginação ativa)' : 'não (máx. 12 por conta)'}\n`);

if (!HAS_SESSION && MAX > 12) {
  console.log('⚠️  Para buscar mais de 12 posts, adicione INSTAGRAM_SESSION_ID e');
  console.log('   INSTAGRAM_CSRF_TOKEN no .env (veja .env.example para instruções)\n');
}

const main    = await fetchAccount(INSTAGRAM_MAIN,    '3W Entretenimento');
await pause(2000);
const esports = await fetchAccount(INSTAGRAM_ESPORTS, '3W Esports');
await pause(2000);
const comics  = await fetchAccount(INSTAGRAM_COMICS,  '3W Comics');

const output = {
  generatedAt: new Date().toISOString(),
  accounts: { main, esports, comics },
};

mkdirSync('./public', { recursive: true });
writeFileSync('./public/instagram-feed.json', JSON.stringify(output, null, 2), 'utf-8');

const total = main.posts.length + esports.posts.length + comics.posts.length;
console.log(`\n✅ Salvo em ./public/instagram-feed.json`);
console.log(`📊 Total: ${total} posts\n`);
