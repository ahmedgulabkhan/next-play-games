import React from 'react';
import type { Task } from '../types';
import { PencilIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onEdit?: (task: Task) => void;
  onViewDetails?: (task: Task) => void;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  availableTeamMembers?: Array<{ id: string; name: string; color: string }>;
  isEditOpen?: boolean;
  onEditClose?: () => void;
}

const priorityColors = {
  low: 'bg-green-50 text-green-700 border-green-200',
  normal: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
};

// const labelColors = [
//   'bg-blue-100 text-blue-700 border-blue-200',
//   'bg-green-100 text-green-700 border-green-200',
//   'bg-yellow-100 text-yellow-700 border-yellow-200',
//   'bg-purple-100 text-purple-700 border-purple-200',
//   'bg-pink-100 text-pink-700 border-pink-200',
//   'bg-indigo-100 text-indigo-700 border-indigo-200',
// ];

const priorityLabels = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, isDragging, onEdit, onViewDetails, availableLabels, availableTeamMembers }) => {
  // Function to get label color by name
  const getLabelColor = (labelName: string) => {
    const label = availableLabels?.find(l => l.name === labelName);
    return label?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Function to get team member color by name
  const getTeamMemberColor = (memberName: string) => {
    const member = availableTeamMembers?.find(m => m.name === memberName);
    return member?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };
  return (
    <div
      className={clsx(
        'bg-white rounded-bl-xl rounded-br-xl p-4 cursor-pointer transition-all duration-200 border-0',
        isDragging && 'opacity-50 rotate-2 scale-105'
      )}
      onClick={(e) => {
        // Handle clicks on the card body, but not on buttons
        const target = e.target as HTMLElement;
        const isButton = target.closest('button');
        
        // Only prevent details popup if clicking directly on a button
        if (!isButton) {
          onViewDetails?.(task);
        }
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold !text-gray-800 leading-snug flex-1 mr-3">
          {task.title}
        </h3>
        <div className="flex gap-1">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit?.(task);
            }}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition-all duration-200 hover:scale-105"
            title="Edit task"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-sm text-gray-700 mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
              priorityColors[task.priority]
            )}
          >
            {priorityLabels[task.priority]}
          </span>
        </div>
        
        {task.assignee_id && (
          <div className="flex items-center text-gray-600">
            <UserCircleIcon className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">{task.assignee_id}</span>
          </div>
        )}
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          {task.labels.map((labelName: string, index: number) => (
            <span
              key={index}
              className={clsx(
                'inline-flex items-center px-1.5 py-1 rounded-full text-xs font-small border',
                getLabelColor(labelName)
              )}
            >
              {labelName}
            </span>
          ))}
        </div>
      )}

      {/* Assignees */}
      {task.assignees && task.assignees.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-3">
          {task.assignees.map((assigneeName: string, index: number) => (
            <span
              key={index}
              className={clsx(
                'inline-flex items-center px-1.5 py-1 rounded-full text-xs font-small border',
                getTeamMemberColor(assigneeName)
              )}
            >
              <UserCircleIcon className="w-3 h-3 mr-1" />
              {assigneeName}
            </span>
          ))}
        </div>
      )}

    </div>
  );
};
