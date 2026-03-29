import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Column, Task } from '../types';
import { SortableTaskCard } from './SortableTaskCard';
import { PlusIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  availableTeamMembers?: Array<{ id: string; name: string; color: string }>;
  onAddTaskClick: (columnId: string) => void;
  onEditTask?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  editingTask?: Task | null;
  isEditPopupOpen?: boolean;
  onEditClose?: () => void;
}

const columnColors = {
  todo: 'border-gray-300 bg-gray-50/80',
  in_progress: 'border-blue-300 bg-blue-50/80',
  in_review: 'border-purple-300 bg-purple-50/80',
  done: 'border-green-300 bg-green-50/80',
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  availableLabels,
  availableTeamMembers,
  onAddTaskClick,
  onEditTask,
  onViewDetails,
  editingTask,
  isEditPopupOpen,
  onEditClose,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const columnTasks = tasks.filter(task => task.status === column.status);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold !text-gray-800">{column.title}</h2>
          <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
            {columnTasks.length}
          </span>
        </div>
        <button
          onClick={() => {
            console.log('=== ADD TASK BUTTON CLICKED ===');
            onAddTaskClick?.(column.id);
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          title="Add task"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 rounded-xl border-2 border-dashed p-4 transition-all duration-200 min-h-[500px]',
          columnColors[column.status],
          isOver && 'border-solid shadow-inner bg-opacity-60 scale-[1.02]'
        )}
      >
        <SortableContext items={columnTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {columnTasks.map((task) => (
              <SortableTaskCard 
                key={task.id} 
                task={task} 
                availableLabels={availableLabels}
                availableTeamMembers={availableTeamMembers}
                onEdit={onEditTask}
                onViewDetails={onViewDetails}
                isEditOpen={isEditPopupOpen && editingTask?.id === task.id}
                onEditClose={onEditClose}
              />
            ))}
            
            {columnTasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-base font-medium mb-2">No tasks yet</p>
                <p className="text-sm">Drag tasks here or click + to add</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};
