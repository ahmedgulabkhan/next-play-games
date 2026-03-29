import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';
import { TaskCard } from './TaskCard';
import { Bars2Icon } from '@heroicons/react/24/outline';

interface SortableTaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  availableTeamMembers?: Array<{ id: string; name: string; color: string }>;
  isEditOpen?: boolean;
  onEditClose?: () => void;
}

export const SortableTaskCard: React.FC<SortableTaskCardProps> = ({ task, onEdit, onViewDetails, availableLabels, availableTeamMembers, isEditOpen, onEditClose }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div className="relative bg-white rounded-xl border border-gray-200">
      <div
          {...listeners}
          className="drag-handle absolute top-1 left-1/2 transform -translate-x-1/2 text-gray-400 hover:text-gray-600 cursor-grab rounded transition-all duration-200 hover:scale-105 z-10"
          title="Drag task"
          onClick={(e) => e.stopPropagation()}
        >
          <Bars2Icon className="w-5 h-5" />
        </div>
      <div className="border-t border-gray-200 mt-7"></div>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="bg-white rounded-xl transition-all duration-200"
      >
        <TaskCard task={task} isDragging={isDragging} onEdit={onEdit} onViewDetails={onViewDetails} availableLabels={availableLabels} availableTeamMembers={availableTeamMembers} isEditOpen={isEditOpen} onEditClose={onEditClose} />
      </div>
    </div>
  );
};
