'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUploader } from '@/components/common/ImageUploader';
import { PageSection, Board } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface SectionFormatEditorProps {
  section: PageSection;
  onChange: (content: Record<string, unknown>) => void;
}

function BentoEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch, setValue } = useForm({ defaultValues: { title: '', items: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="섹션 제목" /></div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>아이템</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ title: '', description: '', image_url: '', size: 'medium' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="mb-3 p-3 border rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <Input {...register(`items.${i}.title` as never)} placeholder="아이템 제목" />
                <Input {...register(`items.${i}.description` as never)} placeholder="설명" />
                <select {...register(`items.${i}.size` as never)} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
                  <option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option>
                </select>
              </div>
              <Button type="button" variant="ghost" size="icon" className="mt-0.5 flex-shrink-0" onClick={() => remove(i)}><Trash2 size={14} /></Button>
            </div>
            <ImageUploader
              label="이미지"
              value={(values as unknown as Record<string, unknown[]>).items?.[i] ? (((values as unknown as Record<string, unknown[]>).items[i]) as Record<string, string>).image_url ?? '' : ''}
              onChange={(url) => setValue(`items.${i}.image_url` as never, url as never)}
              previewHeight="h-24"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TextEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, watch } = useForm({ defaultValues: { title: '', subtitle: '', body: '', align: 'left', ...defaultValues } });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="제목" /></div>
      <div className="space-y-1"><Label>부제목</Label><Input {...register('subtitle')} placeholder="부제목" /></div>
      <div className="space-y-1"><Label>정렬</Label>
        <select {...register('align')} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option>
        </select>
      </div>
      <div className="space-y-1"><Label>본문</Label><textarea {...register('body')} className="w-full border rounded-md px-3 py-2 text-sm min-h-[100px] bg-background" placeholder="본문 내용" /></div>
    </div>
  );
}

function GalleryEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch, setValue } = useForm({ defaultValues: { title: '', images: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'images' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="갤러리 제목" /></div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>이미지</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ url: '', alt: '', caption: '' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="mb-3 p-3 border rounded-lg space-y-2">
            <div className="flex justify-end"><Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 size={14} /></Button></div>
            <ImageUploader
              value={(values as unknown as Record<string, unknown[]>).images?.[i] ? (((values as unknown as Record<string, unknown[]>).images[i]) as Record<string, string>).url ?? '' : ''}
              onChange={(url) => setValue(`images.${i}.url` as never, url as never)}
              previewHeight="h-28"
            />
            <Input {...register(`images.${i}.alt` as never)} placeholder="대체 텍스트" />
            <Input {...register(`images.${i}.caption` as never)} placeholder="캡션" />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlassmorphismEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch, setValue } = useForm({ defaultValues: { title: '', description: '', background_image: '', cards: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'cards' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="제목" /></div>
      <div className="space-y-1"><Label>설명</Label><Input {...register('description')} placeholder="설명" /></div>
      <ImageUploader
        label="배경 이미지"
        value={(values as unknown as Record<string, string>).background_image ?? ''}
        onChange={(url) => setValue('background_image', url)}
        previewHeight="h-28"
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>카드</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ icon: '', title: '', description: '' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 mb-2 p-2 border rounded-md">
            <div className="flex-1 space-y-1">
              <Input {...register(`cards.${i}.icon` as never)} placeholder="아이콘 이모지 (예: 🚀)" />
              <Input {...register(`cards.${i}.title` as never)} placeholder="카드 제목" />
              <Input {...register(`cards.${i}.description` as never)} placeholder="카드 설명" />
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 size={14} /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrganicEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch, setValue } = useForm({ defaultValues: { title: '', description: '', items: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="제목" /></div>
      <div className="space-y-1"><Label>설명</Label><Input {...register('description')} placeholder="설명" /></div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>아이템</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ title: '', description: '', image_url: '' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="mb-3 p-3 border rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1">
                <Input {...register(`items.${i}.title` as never)} placeholder="제목" />
                <Input {...register(`items.${i}.description` as never)} placeholder="설명" />
              </div>
              <Button type="button" variant="ghost" size="icon" className="flex-shrink-0" onClick={() => remove(i)}><Trash2 size={14} /></Button>
            </div>
            <ImageUploader
              label="아이콘 이미지"
              value={(values as unknown as Record<string, unknown[]>).items?.[i] ? (((values as unknown as Record<string, unknown[]>).items[i]) as Record<string, string>).image_url ?? '' : ''}
              onChange={(url) => setValue(`items.${i}.image_url` as never, url as never)}
              previewHeight="h-20"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function HeaderEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch, setValue } = useForm({ defaultValues: { title: '', logo_url: '', background_color: '#ffffff', nav_links: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'nav_links' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>사이트명</Label><Input {...register('title')} placeholder="사이트 이름" /></div>
      <div className="space-y-1"><Label>배경 색상</Label>
        <div className="flex items-center gap-2">
          <input type="color" {...register('background_color')} className="h-8 w-10 rounded border cursor-pointer" />
          <Input {...register('background_color')} placeholder="#ffffff" className="flex-1" />
        </div>
      </div>
      <ImageUploader
        label="로고 이미지"
        value={(values as unknown as Record<string, string>).logo_url ?? ''}
        onChange={(url) => setValue('logo_url', url)}
        previewHeight="h-20"
      />
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>네비게이션 링크</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ label: '', url: '' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <Input {...register(`nav_links.${i}.label` as never)} placeholder="링크 텍스트" />
            <Input {...register(`nav_links.${i}.url` as never)} placeholder="/about" />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 size={14} /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, watch, setValue } = useForm({ defaultValues: { title: '', subtitle: '', description: '', background_image: '', background_color: '#f8fafc', cta_label: '', cta_url: '', align: 'center', ...defaultValues } });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>제목</Label><Input {...register('title')} placeholder="메인 제목" /></div>
      <div className="space-y-1"><Label>부제목</Label><Input {...register('subtitle')} placeholder="부제목" /></div>
      <div className="space-y-1"><Label>설명</Label><Input {...register('description')} placeholder="설명 문구" /></div>
      <div className="space-y-1"><Label>정렬</Label>
        <select {...register('align')} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="left">왼쪽</option><option value="center">가운데</option><option value="right">오른쪽</option>
        </select>
      </div>
      <div className="space-y-1"><Label>배경 색상</Label>
        <div className="flex items-center gap-2">
          <input type="color" {...register('background_color')} className="h-8 w-10 rounded border cursor-pointer" />
          <Input {...register('background_color')} placeholder="#f8fafc" className="flex-1" />
        </div>
      </div>
      <ImageUploader
        label="배경 이미지 (선택)"
        value={(values as unknown as Record<string, string>).background_image ?? ''}
        onChange={(url) => setValue('background_image', url)}
        previewHeight="h-28"
      />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1"><Label>CTA 버튼 텍스트</Label><Input {...register('cta_label')} placeholder="시작하기" /></div>
        <div className="space-y-1"><Label>CTA URL</Label><Input {...register('cta_url')} placeholder="/contact" /></div>
      </div>
    </div>
  );
}

function FooterEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, control, watch } = useForm({ defaultValues: { text: '', background_color: '#1f2937', links: [], ...defaultValues } });
  const { fields, append, remove } = useFieldArray({ control, name: 'links' as never });
  const values = watch();
  useEffect(() => { onChange(values); }, [JSON.stringify(values)]);
  return (
    <div className="space-y-3">
      <div className="space-y-1"><Label>저작권 텍스트</Label><Input {...register('text')} placeholder="© 2026 My Company. All rights reserved." /></div>
      <div className="space-y-1"><Label>배경 색상</Label>
        <div className="flex items-center gap-2">
          <input type="color" {...register('background_color')} className="h-8 w-10 rounded border cursor-pointer" />
          <Input {...register('background_color')} placeholder="#1f2937" className="flex-1" />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>링크</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => append({ label: '', url: '' })}><Plus size={12} className="mr-1" /> 추가</Button>
        </div>
        {fields.map((field, i) => (
          <div key={field.id} className="flex gap-2 mb-2">
            <Input {...register(`links.${i}.label` as never)} placeholder="개인정보처리방침" />
            <Input {...register(`links.${i}.url` as never)} placeholder="/privacy" />
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 size={14} /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BoardWidgetEditor({ defaultValues, onChange }: { defaultValues: Record<string, unknown>; onChange: (v: Record<string, unknown>) => void }) {
  const { register, watch } = useForm({
    defaultValues: { board_id: '', title: '', max_posts: 5, display_style: 'list', ...defaultValues },
  });
  const values = watch();
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    api.get<{ items: Board[] }>('/boards?limit=100').then((r) => setBoards(r.data.items)).catch(() => {});
  }, []);

  useEffect(() => { onChange(values); }, [JSON.stringify(values)]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>게시판 선택</Label>
        <select {...register('board_id')} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="">-- 게시판 선택 --</option>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label>위젯 제목 (선택)</Label>
        <Input {...register('title')} placeholder="최근 게시글" />
      </div>
      <div className="space-y-1">
        <Label>표시 개수</Label>
        <select {...register('max_posts', { valueAsNumber: true })} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
          {[3, 5, 10].map((n) => <option key={n} value={n}>{n}개</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <Label>표시 형식</Label>
        <select {...register('display_style')} className="w-full border rounded-md px-3 py-1.5 text-sm bg-background">
          <option value="list">목록형</option>
          <option value="card">카드형</option>
        </select>
      </div>
    </div>
  );
}

export function SectionFormatEditor({ section, onChange }: SectionFormatEditorProps) {
  const content = (section.content ?? {}) as Record<string, unknown>;
  if (section.type === 'header') return <HeaderEditor defaultValues={content} onChange={onChange} />;
  if (section.type === 'banner') return <BannerEditor defaultValues={content} onChange={onChange} />;
  if (section.type === 'footer') return <FooterEditor defaultValues={content} onChange={onChange} />;
  switch (section.format) {
    case 'bento': return <BentoEditor defaultValues={content} onChange={onChange} />;
    case 'organic': return <OrganicEditor defaultValues={content} onChange={onChange} />;
    case 'glassmorphism': return <GlassmorphismEditor defaultValues={content} onChange={onChange} />;
    case 'text': return <TextEditor defaultValues={content} onChange={onChange} />;
    case 'gallery': return <GalleryEditor defaultValues={content} onChange={onChange} />;
    case 'board_widget': return <BoardWidgetEditor defaultValues={content} onChange={onChange} />;
    default: return <p className="text-sm text-muted-foreground">지원하지 않는 포맷입니다.</p>;
  }
}
