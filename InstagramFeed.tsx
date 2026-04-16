/**
 * InstagramFeed.tsx
 *
 * Substitui os 3 widgets Elfsight do site 3W Entretenimento.
 * Lê os dados do instagram-feed.json hospedado publicamente.
 *
 * Cole este arquivo em src/components/ no Lovable.
 */

import { useEffect, useState } from "react";
import { Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";

// =====================================================================
// CONFIGURAÇÃO — altere apenas esta URL após hospedar o JSON
// =====================================================================
const FEED_JSON_URL =
  "https://SEU-USUARIO.github.io/SEU-REPO/instagram-feed.json";
// =====================================================================

type MediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";

interface InstagramPost {
  id: string;
  caption: string;
  mediaType: MediaType;
  mediaUrl: string;
  videoUrl: string | null;
  permalink: string;
  timestamp: string;
  likes: number;
  comments: number;
}

interface InstagramProfile {
  username: string;
  followers: number;
  mediaCount: number;
  profilePicture: string | null;
  bio: string;
}

interface AccountData {
  profile: InstagramProfile | null;
  posts: InstagramPost[];
}

interface FeedData {
  generatedAt: string;
  accounts: {
    main: AccountData;
    esports: AccountData;
    comics: AccountData;
  };
}

// Cache em memória para evitar re-fetch
let cachedFeed: FeedData | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

async function loadFeed(): Promise<FeedData> {
  const now = Date.now();
  if (cachedFeed && now - cacheTime < CACHE_TTL) return cachedFeed;

  const res = await fetch(FEED_JSON_URL);
  if (!res.ok) throw new Error(`Falha ao carregar feed: ${res.status}`);

  cachedFeed = await res.json();
  cacheTime = now;
  return cachedFeed!;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Card de cada post ───────────────────────────────────────────────

function PostCard({ post }: { post: InstagramPost }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={post.permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block overflow-hidden rounded-xl aspect-square group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Imagem / thumb */}
      <img
        src={post.mediaUrl}
        alt={post.caption?.slice(0, 80) || "Post Instagram"}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Badge de vídeo / carrossel */}
      {post.mediaType === "VIDEO" && (
        <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
          ▶ Reels
        </span>
      )}
      {post.mediaType === "CAROUSEL_ALBUM" && (
        <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
          ⊞
        </span>
      )}

      {/* Overlay com stats */}
      <div
        className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition-opacity duration-200 ${
          hovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-4 text-white font-semibold">
          <span className="flex items-center gap-1">
            <Heart size={18} className="fill-white" />
            {formatNumber(post.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={18} className="fill-white" />
            {formatNumber(post.comments)}
          </span>
        </div>
        {post.caption && (
          <p className="text-white text-xs text-center px-3 line-clamp-3 max-w-[200px]">
            {post.caption}
          </p>
        )}
        <span className="text-white/70 text-xs">{formatDate(post.timestamp)}</span>
      </div>
    </a>
  );
}

// ─── Header do perfil ────────────────────────────────────────────────

function ProfileHeader({ profile, handle }: { profile: InstagramProfile | null; handle: string }) {
  if (!profile) return null;
  return (
    <div className="flex items-center gap-4 mb-6">
      {profile.profilePicture ? (
        <img
          src={profile.profilePicture}
          alt={profile.username}
          className="w-14 h-14 rounded-full object-cover border-2 border-primary"
        />
      ) : (
        <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center">
          <Instagram size={24} className="text-white" />
        </div>
      )}
      <div>
        <p className="font-bold text-primary text-lg">@{profile.username}</p>
        <p className="text-muted-foreground text-sm">
          {profile.followers?.toLocaleString("pt-BR")} seguidores
          {" · "}
          {profile.mediaCount?.toLocaleString("pt-BR")} publicações
        </p>
      </div>
      <a
        href={`https://instagram.com/${profile.username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1 text-sm text-primary border border-primary rounded-full px-4 py-1 hover:bg-primary hover:text-white transition-colors"
      >
        <ExternalLink size={14} />
        Seguir
      </a>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────

interface InstagramFeedProps {
  /** Qual conta exibir: "main" | "esports" | "comics" */
  account: "main" | "esports" | "comics";
  /** Quantos posts exibir (padrão: 9) */
  limit?: number;
  /** Mostrar header do perfil (padrão: true) */
  showProfile?: boolean;
}

export function InstagramFeed({
  account,
  limit = 9,
  showProfile = true,
}: InstagramFeedProps) {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFeed()
      .then((feed) => {
        setData(feed.accounts[account]);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [account]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Instagram size={40} className="mx-auto mb-3 opacity-40" />
        <p>Não foi possível carregar o feed do Instagram.</p>
        <a
          href={`https://instagram.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline text-sm mt-1 inline-block"
        >
          Ver no Instagram
        </a>
      </div>
    );
  }

  const posts = data.posts.slice(0, limit);

  return (
    <div>
      {showProfile && <ProfileHeader profile={data.profile} handle={account} />}
      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}

export default InstagramFeed;
