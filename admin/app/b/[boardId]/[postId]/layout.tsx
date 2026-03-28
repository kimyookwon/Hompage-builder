import type { Metadata } from 'next';

interface PostData {
  title?: string;
  content?: string;
  thumbnail_url?: string;
  author_name?: string;
  board_name?: string;
  created_at?: string;
}

async function fetchPost(postId: string): Promise<PostData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
  try {
    // 비로그인으로 조회 (공개 게시글만 메타데이터 제공)
    const res = await fetch(`${apiUrl}/posts/${postId}`, { next: { revalidate: 30 } });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data ?? {};
  } catch {
    return {};
  }
}

/** 본문에서 OG description 추출 (마크다운 이미지/URL 제거 후 120자) */
function makeDescription(content: string): string {
  const clean = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.length > 120 ? clean.slice(0, 120) + '…' : clean;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string; postId: string }>;
}): Promise<Metadata> {
  const { postId } = await params;
  const post = await fetchPost(postId);

  if (!post.title) return {};

  const description = post.content ? makeDescription(post.content) : (post.board_name ?? '');
  const images = post.thumbnail_url
    ? [{ url: post.thumbnail_url, width: 1200, height: 630, alt: post.title }]
    : [];

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      ...(images.length > 0 ? { images } : {}),
      ...(post.author_name ? { authors: [post.author_name] } : {}),
      ...(post.created_at ? { publishedTime: post.created_at } : {}),
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title: post.title,
      description,
      ...(images.length > 0 ? { images: [images[0].url] } : {}),
    },
  };
}

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
