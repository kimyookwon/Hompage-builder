// 날짜를 상대적/맥락적으로 포맷
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  if (date >= todayStart) {
    // 오늘: "오늘 HH:MM"
    return '오늘 ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  if (date >= yesterdayStart) {
    return '어제';
  }
  if (date >= thisYearStart) {
    // 올해: "M월 D일"
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  }
  // 그 이전: "YYYY. M. D."
  return date.toLocaleDateString('ko-KR');
}

// 댓글/상세 등 시간도 표시
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);

  const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

  if (date >= todayStart) {
    return `오늘 ${timeStr}`;
  }
  if (date >= yesterdayStart) {
    return `어제 ${timeStr}`;
  }
  if (date >= thisYearStart) {
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) + ' ' + timeStr;
  }
  return date.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}
