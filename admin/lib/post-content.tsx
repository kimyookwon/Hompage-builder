import React from 'react';

// 이미지 태그: ![alt](url)
const IMG_PATTERN = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
// URL 패턴 (이미지 태그 내 URL 제외)
const URL_PATTERN = /https?:\/\/[^\s<>"']+/g;

/**
 * 게시글 본문 한 줄을 파싱해 React 노드 배열로 반환
 * - ![alt](url) → <img>
 * - http(s):// URL → <a>
 * - 나머지 → 텍스트
 */
function parseLine(line: string, lineIdx: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];

  // 이미지 패턴을 먼저 찾아 분리
  const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = imgRegex.exec(line)) !== null) {
    // 이미지 앞 텍스트 — URL 링크화
    if (match.index > lastIndex) {
      nodes.push(...linkifyText(line.slice(lastIndex, match.index), `${lineIdx}-pre-${match.index}`));
    }
    // 이미지 렌더링
    nodes.push(
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={`${lineIdx}-img-${match.index}`}
        src={match[2]}
        alt={match[1] || '이미지'}
        className="max-w-full rounded-lg my-2 border"
        loading="lazy"
      />
    );
    lastIndex = match.index + match[0].length;
  }

  // 나머지 텍스트 — URL 링크화
  if (lastIndex < line.length) {
    nodes.push(...linkifyText(line.slice(lastIndex), `${lineIdx}-post`));
  }

  return nodes;
}

/** 텍스트 내 URL을 <a> 태그로 변환 */
function linkifyText(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const urlRegex = /https?:\/\/[^\s<>"']+/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const url = match[0];
    nodes.push(
      <a
        key={`${keyPrefix}-url-${match.index}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline break-all"
      >
        {url}
      </a>
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

/** 게시글 본문 렌더러 컴포넌트 */
export function PostContent({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {lines.map((line, i) => {
        const nodes = parseLine(line, i);
        const hasImage = nodes.some((n) => React.isValidElement(n) && n.type === 'img');

        return (
          <React.Fragment key={i}>
            {hasImage ? (
              // 이미지가 있는 줄은 block 레이아웃
              <div>{nodes}</div>
            ) : (
              // 빈 줄은 빈 단락, 나머지는 인라인
              line === '' ? (
                <br />
              ) : (
                <p className="mb-0">{nodes}</p>
              )
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// void 참조 방지
void IMG_PATTERN;
void URL_PATTERN;
