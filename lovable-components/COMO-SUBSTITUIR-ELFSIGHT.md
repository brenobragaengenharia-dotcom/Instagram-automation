# Como substituir os widgets Elfsight no Lovable

## 1. Adicione o componente InstagramFeed

Cole o arquivo `InstagramFeed.tsx` em `src/components/` no Lovable.

Depois atualize a constante `FEED_JSON_URL` no topo do arquivo com a URL
pública onde você hospedou o `instagram-feed.json`.

---

## 2. Substitua cada widget Elfsight

Localize e substitua os três trechos abaixo no código do Lovable:

---

### Widget 1 — Feed Principal (@3worlds_entertainment)

**ANTES (Elfsight):**
```tsx
useEffect(() => {
  const e = document.createElement("script");
  e.src = "https://elfsightcdn.com/platform.js";
  e.async = true;
  document.body.appendChild(e);
  return () => { document.body.removeChild(e) };
}, []);

// ...dentro do JSX:
<div
  className="elfsight-app-83ed9953-da00-4cc6-999a-af4508f63bc8"
  data-elfsight-app-lazy={true}
/>
```

**DEPOIS (componente próprio):**
```tsx
import { InstagramFeed } from "@/components/InstagramFeed";

// ...dentro do JSX (remova o useEffect e a div Elfsight):
<InstagramFeed account="main" limit={9} />
```

---

### Widget 2 — Feed Esports (@3wesports)

**ANTES:**
```tsx
<div
  className="elfsight-app-aefa0de6-54cb-44fa-a8b6-497960529d0f"
  data-elfsight-app-lazy={true}
/>
```

**DEPOIS:**
```tsx
<InstagramFeed account="esports" limit={9} />
```

---

### Widget 3 — Feed Comics (@3wcomics_)

**ANTES:**
```tsx
<div
  className="elfsight-app-47ad5afc-d845-417e-8d3c-f60acfcc8288"
  data-elfsight-app-lazy={true}
/>
```

**DEPOIS:**
```tsx
<InstagramFeed account="comics" limit={9} />
```

---

## 3. Remova o script do Elfsight

Depois de substituir todos os widgets, remova também os `useEffect` que
injetam o `platform.js` do Elfsight (aparece 3 vezes no código).

---

## Props disponíveis no InstagramFeed

| Prop          | Tipo                          | Padrão | Descrição                        |
|---------------|-------------------------------|--------|----------------------------------|
| `account`     | `"main" \| "esports" \| "comics"` | —      | Qual conta exibir (obrigatório) |
| `limit`       | `number`                      | `9`    | Quantos posts mostrar            |
| `showProfile` | `boolean`                     | `true` | Mostrar header do perfil         |
