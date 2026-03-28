'use client';

// 관리자 공지 관리 페이지 — 공지 CRUD + 활성 토글

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/date';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

// 관리자용 공지 타입 (isActive, startsAt, endsAt 포함)
interface AdminNotice {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
}

// 공지 생성/수정 폼 데이터
interface NoticeFormData {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: NoticeFormData = {
  title: '',
  content: '',
  type: 'info',
  startsAt: '',
  endsAt: '',
};

// 공지 타입 배지 색상
const TYPE_BADGE: Record<AdminNotice['type'], string> = {
  info: 'bg-blue-100 text-blue-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
};

const TYPE_LABEL: Record<AdminNotice['type'], string> = {
  info: '정보',
  warning: '주의',
  error: '오류',
  success: '완료',
};

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<AdminNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<AdminNotice | null>(null);
  const [form, setForm] = useState<NoticeFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<NoticeFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  // 삭제 확인 상태
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<AdminNotice[]>('/admin/notices');
      setNotices(res.data);
    } catch {
      setError('공지 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  // 모달 열기 (신규)
  const openCreateModal = () => {
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  // 모달 열기 (수정)
  const openEditModal = (notice: AdminNotice) => {
    setEditingNotice(notice);
    setForm({
      title: notice.title,
      content: notice.content,
      type: notice.type,
      startsAt: notice.startsAt ? notice.startsAt.slice(0, 16) : '',
      endsAt: notice.endsAt ? notice.endsAt.slice(0, 16) : '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotice(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  // 폼 유효성 검사
  const validateForm = (): boolean => {
    const errors: Partial<NoticeFormData> = {};
    if (!form.title.trim()) errors.title = '제목을 입력해주세요.';
    if (!form.content.trim()) errors.content = '내용을 입력해주세요.';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 공지 저장 (생성 / 수정)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        type: form.type,
        starts_at: form.startsAt || null,
        ends_at: form.endsAt || null,
      };

      if (editingNotice) {
        await api.patch(`/admin/notices/${editingNotice.id}`, payload);
      } else {
        await api.post('/admin/notices', payload);
      }
      closeModal();
      fetchNotices();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : '저장에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 활성 토글
  const handleToggle = async (notice: AdminNotice) => {
    try {
      await api.patch(`/admin/notices/${notice.id}/toggle`, {});
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, isActive: !n.isActive } : n))
      );
    } catch {
      alert('토글에 실패했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/admin/notices/${id}`, {});
      setNotices((prev) => prev.filter((n) => n.id !== id));
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">공지 관리</h1>
            <p className="text-sm text-muted-foreground mt-1">공개 페이지에 표시될 공지를 관리합니다.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            공지 추가
          </button>
        </div>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm dark:bg-red-950/40 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {/* 테이블 */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
        ) : notices.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            등록된 공지가 없습니다.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">제목</th>
                  <th className="text-left px-4 py-3 font-medium w-20">유형</th>
                  <th className="text-left px-4 py-3 font-medium w-16">활성</th>
                  <th className="text-left px-4 py-3 font-medium w-28">시작일</th>
                  <th className="text-left px-4 py-3 font-medium w-28">종료일</th>
                  <th className="text-right px-4 py-3 font-medium w-28">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium truncate max-w-xs">{notice.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{notice.content}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[notice.type]}`}>
                        {TYPE_LABEL[notice.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggle(notice)}
                        aria-label={notice.isActive ? '비활성화' : '활성화'}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {notice.isActive ? (
                          <ToggleRight size={22} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={22} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {notice.startsAt ? formatDate(notice.startsAt) : '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {notice.endsAt ? formatDate(notice.endsAt) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(notice)}
                          aria-label="수정"
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        {deletingId === notice.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(notice.id)}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              확인
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-1 border text-xs rounded hover:bg-muted transition-colors"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingId(notice.id)}
                            aria-label="삭제"
                            className="p-1.5 rounded hover:bg-muted transition-colors text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 공지 추가/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="w-full max-w-lg bg-background border rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">
              {editingNotice ? '공지 수정' : '공지 추가'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 제목 */}
              <div className="space-y-1">
                <label className="text-sm font-medium">제목</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="공지 제목"
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                {formErrors.title && (
                  <p className="text-xs text-red-500">{formErrors.title}</p>
                )}
              </div>

              {/* 내용 */}
              <div className="space-y-1">
                <label className="text-sm font-medium">내용</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  placeholder="공지 내용"
                  rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                {formErrors.content && (
                  <p className="text-xs text-red-500">{formErrors.content}</p>
                )}
              </div>

              {/* 유형 */}
              <div className="space-y-1">
                <label className="text-sm font-medium">유형</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AdminNotice['type'] }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-background"
                >
                  <option value="info">정보 (파란색)</option>
                  <option value="warning">주의 (노란색)</option>
                  <option value="error">오류 (빨간색)</option>
                  <option value="success">완료 (초록색)</option>
                </select>
              </div>

              {/* 시작일 / 종료일 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">시작일 (선택)</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">종료일 (선택)</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm((p) => ({ ...p, endsAt: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary bg-background"
                  />
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border text-sm rounded-lg hover:bg-muted transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
