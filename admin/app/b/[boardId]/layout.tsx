import type { Metadata } from 'next';

interface BoardData {
  name?: string;
  description?: string;
}

async function fetchBoard(boardId: string): Promise<BoardData> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';
  try {
    const res = await fetch(`${apiUrl}/boards/${boardId}`, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data ?? {};
  } catch {
    return {};
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ boardId: string }>;
}): Promise<Metadata> {
  const { boardId } = await params;
  const board = await fetchBoard(boardId);

  if (!board.name) return {};

  return {
    title: board.name,
    description: board.description || `${board.name} 게시판`,
    openGraph: {
      title: board.name,
      description: board.description || `${board.name} 게시판`,
      type: 'website',
    },
  };
}

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
