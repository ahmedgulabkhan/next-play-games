import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, CalendarIcon, FlagIcon } from '@heroicons/react/24/outline';
import type { Task, TaskUpdateInput, Label, TeamMember } from '../types';
import { taskService } from '../services/taskService';
import clsx from 'clsx';

interface TaskEditPopupProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  availableLabels?: Label[];
  availableTeamMembers?: TeamMember[];
}

export const TaskEditPopup: React.FC<TaskEditPopupProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  availableLabels,
  availableTeamMembers,
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>(task?.priority || 'normal');
  const [dueDate, setDueDate] = useState(task?.due_date || '');
  const [labels, setLabels] = useState<string[]>(task?.labels || []);
  const [assignees, setAssignees] = useState<string[]>(task?.assignees || []);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const dueDateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'normal');
      setDueDate(task.due_date || '');
      setLabels(task.labels || []);
      setAssignees(task.assignees || []);
    }
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!title.trim()) return;

    setIsLoading(true);
    try {
      const updates: TaskUpdateInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        labels: labels,
        assignees: assignees,
      };

      const updatedTask = await taskService.updateTask(task.id, updates);
      onUpdate(updatedTask);
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await taskService.deleteTask(task.id);
      onDelete(task.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const priorityColors = {
    low: 'bg-green-50 text-green-700 border-green-200',
    normal: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={popupRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col relative transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold !text-gray-800">Edit Task</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-4"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#d1d5db transparent',
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
              .scrollable-content::-webkit-scrollbar {
                width: 6px;
              }
              .scrollable-content::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollable-content::-webkit-scrollbar-thumb {
                background-color: #d1d5db;
                border-radius: 3px;
              }
              .scrollable-content::-webkit-scrollbar-thumb:hover {
                background-color: #9ca3af;
              }
              .scrollable-content::-webkit-scrollbar-thumb:active {
                background-color: #6b7280;
              }
            `
          }} />
          <form onSubmit={handleSubmit} className="scrollable-content">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task title"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Task description"
              rows={3}
            />
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium !text-gray-700 mb-2">
              Labels
            </label>
            {availableLabels && availableLabels.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableLabels.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => {
                        if (labels.includes(label.name)) {
                          setLabels(labels.filter(l => l !== label.name));
                        } else {
                          if (labels.length >= 3) {
                            return; // Limit to 3 labels
                          }
                          setLabels([...labels, label.name]);
                        }
                      }}
                      className={clsx(
                        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                        labels.includes(label.name)
                          ? label.color
                          : labels.length >= 3 && !labels.includes(label.name)
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      )}
                      disabled={labels.length >= 3 && !labels.includes(label.name)}
                      title={labels.length >= 3 && !labels.includes(label.name) ? 'Maximum 3 labels allowed' : ''}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500">Selected:</span>
                    {labels.map((labelName) => {
                      const label = availableLabels.find(l => l.name === labelName);
                      return (
                        <span
                          key={labelName}
                          className={clsx(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                            label?.color || 'bg-gray-100 text-gray-700 border-gray-200'
                          )}
                        >
                          {labelName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No labels available. Create labels using the Labels button in the main board.
              </p>
            )}
          </div>

          {/* Assignees */}
          <div>
            <label className="block text-sm font-medium !text-gray-700 mb-2">
              Assignees
            </label>
            {availableTeamMembers && availableTeamMembers.length > 0 ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableTeamMembers.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => {
                        if (assignees.includes(member.name)) {
                          setAssignees(assignees.filter(a => a !== member.name));
                        } else {
                          if (assignees.length >= 3) {
                            return; // Limit to 3 assignees
                          }
                          setAssignees([...assignees, member.name]);
                        }
                      }}
                      className={clsx(
                        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                        assignees.includes(member.name)
                          ? member.color
                          : assignees.length >= 3 && !assignees.includes(member.name)
                            ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      )}
                      disabled={assignees.length >= 3 && !assignees.includes(member.name)}
                      title={assignees.length >= 3 && !assignees.includes(member.name) ? 'Maximum 3 assignees allowed' : ''}
                    >
                      {member.name}
                    </button>
                  ))}
                </div>
                {assignees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500">Selected:</span>
                    {assignees.map((assigneeName) => {
                      const member = availableTeamMembers.find(m => m.name === assigneeName);
                      return (
                        <span
                          key={assigneeName}
                          className={clsx(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                            member?.color || 'bg-gray-100 text-gray-700 border-gray-200'
                          )}
                        >
                          {assigneeName}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                No team members available. Create team members using the Team button in the main board.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium !text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  ref={dueDateInputRef}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => dueDateInputRef.current?.showPicker?.() || dueDateInputRef.current?.focus()}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Open calendar"
                >
                  <CalendarIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Current Priority Display */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-600">Current Priority:</span>
            <span
              className={clsx(
                'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                priorityColors[priority]
              )}
            >
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};
