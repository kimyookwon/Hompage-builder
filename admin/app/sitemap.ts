import { MetadataRoute } from 'next';

interface PageItem {
  slug: string;
  updated_at: string;
}

interface BoardItem {
  id: number;
  updated_at: string;
}

interface PostItem {
  id: number;
  board_id: number;
  updated_at: string;
}

async function fetchPublishedPages(): Promise<PageItem[]> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');
  try {
    // 공개된 페이지 목록은 public API가 없으므로 admin API 활용 (캐시 허용)
    const res = await fetch(`${apiUrl}/api/pages?limit=200`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const pages = (json.data?.items ?? json.data ?? []) as Array<{ slug: string; is_published: boolean; updated_at: string }>;
    return pages.filter((p) => p.is_published).map((p) => ({
      slug: p.slug,
      updated_at: p.updated_at,
    }));
  } catch {
    return [];
  }
}

async function fetchPublicBoards(): Promise<BoardItem[]> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');
  try {
    const res = await fetch(`${apiUrl}/api/boards`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const boards = (json.data ?? []) as Array<{ id: number; read_permission: string; updated_at: string }>;
    return boards.filter((b) => b.read_permission === 'public').map((b) => ({
      id: b.id,
      updated_at: b.updated_at,
    }));
  } catch {
    return [];
  }
}

async function fetchRecentPosts(boards: BoardItem[]): Promise<PostItem[]> {
  const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');
  const results: PostItem[] = [];

  // 공개 게시판별 최근 200개 게시글 수집 (너무 많으면 검색 엔진 크롤 부하)
  await Promise.all(
    boards.slice(0, 10).map(async (board) => {
      try {
        const res = await fetch(
          `${apiUrl}/api/boards/${board.id}/posts?page=1&limit=200&sort=latest`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) return;
        const json = await res.json();
        const items = (json.data?.items ?? []) as Array<{ id: number; updated_at: string }>;
        items.forEach((p) => results.push({ id: p.id, board_id: board.id, updated_at: p.updated_at }));
      } catch {
        // 개별 게시판 실패는 무시
      }
    })
  );

  return results;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const [pages, boards] = await Promise.all([fetchPublishedPages(), fetchPublicBoards()]);

  const pageEntries: MetadataRoute.Sitemap = pages.map((p) => ({
    url: `${siteUrl}/p/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const boardEntries: MetadataRoute.Sitemap = boards.map((b) => ({
    url: `${siteUrl}/b/${b.id}`,
    lastModified: new Date(b.updated_at),
    changeFrequency: 'daily',
    priority: 0.6,
  }));

  const posts = await fetchRecentPosts(boards);
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${siteUrl}/b/${p.board_id}/${p.id}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/boards`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    ...pageEntries,
    ...boardEntries,
    ...postEntries,
  ];
}
