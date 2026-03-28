'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageSection } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  section: PageSection;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function SortableItem({ section, isSelected, onSelect, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors',
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <Badge variant="outline" className="text-xs capitalize">
          {section.type}
        </Badge>
        <span className="ml-2 text-xs text-muted-foreground capitalize">{section.format}</span>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

interface SectionTreeProps {
  sections: PageSection[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onReorder: (ids: number[]) => void;
  onDelete: (id: number) => void;
  onAddClick: () => void;
}

export function SectionTree({
  sections,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  onAddClick,
}: SectionTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const reordered = [...sections];
    const [removed] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, removed);
    onReorder(reordered.map((s) => s.id));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <span className="text-sm font-medium">섹션 목록</span>
        <Button size="sm" variant="outline" onClick={onAddClick}>
          <Plus size={14} className="mr-1" /> 추가
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sections.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            섹션을 추가해주세요
          </p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableItem
                  key={section.id}
                  section={section}
                  isSelected={selectedId === section.id}
                  onSelect={() => onSelect(section.id)}
                  onDelete={() => onDelete(section.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}
