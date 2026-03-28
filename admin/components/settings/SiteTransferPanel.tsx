'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export function SiteTransferPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 내보내기 — 브라우저 다운로드
  const handleExport = () => {
    const token = getToken();
    // fetch로 받아서 Blob 다운로드 (Authorization 헤더 필요)
    fetch(`${API_URL}/admin/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error('내보내기에 실패했습니다.');
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `site-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((e) => {
        alert(e instanceof Error ? e.message : '내보내기 실패');
      });
  };

  // 파일 선택 후 가져오기
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setImportResult(null);
    setImporting(true);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      const token = getToken();
      const res = await fetch(`${API_URL}/admin/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(json),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setImportResult({ type: 'error', message: data.error ?? '가져오기에 실패했습니다.' });
      } else {
        setImportResult({ type: 'success', message: '사이트 구성을 성공적으로 가져왔습니다. 페이지를 새로고침하세요.' });
      }
    } catch (e) {
      setImportResult({
        type: 'error',
        message: e instanceof Error ? e.message : '파일 파싱에 실패했습니다.',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        사이트 구성(페이지, 섹션, 게시판, 설정)을 JSON 파일로 내보내거나 가져옵니다.
        게시글·댓글·미디어 파일은 포함되지 않습니다.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* 내보내기 */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Download size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">내보내기</span>
          </div>
          <p className="text-xs text-muted-foreground">
            현재 사이트의 전체 구성을 JSON 파일로 다운로드합니다.
          </p>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleExport}>
            JSON 다운로드
          </Button>
        </div>

        {/* 가져오기 */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-muted-foreground" />
            <span className="text-sm font-medium">가져오기</span>
          </div>
          <p className="text-xs text-muted-foreground">
            내보내기 JSON을 업로드하여 구성을 복원합니다. 기존 데이터는 유지됩니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? '가져오는 중...' : 'JSON 파일 선택'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 결과 메시지 */}
      {importResult && (
        <div
          className={`flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs ${
            importResult.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
          }`}
        >
          {importResult.type === 'success' ? (
            <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          )}
          {importResult.message}
        </div>
      )}

      {/* 주의사항 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 flex items-start gap-2">
        <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          가져오기는 기존 데이터를 삭제하지 않습니다. slug 충돌 시 <code className="font-mono">-imported</code> 접미어가 붙습니다.
        </p>
      </div>
    </div>
  );
}
