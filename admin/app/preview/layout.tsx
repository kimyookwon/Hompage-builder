// 미리보기 페이지는 AdminLayout 없이 렌더링
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
