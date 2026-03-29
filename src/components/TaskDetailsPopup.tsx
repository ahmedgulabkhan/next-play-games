import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, UserCircleIcon, FlagIcon, TagIcon, ClockIcon, ChatBubbleLeftRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Task, TaskActivity, TaskComment, Label, TeamMember } from '../types';
import { taskActivityService } from '../services/taskActivityService';
import { taskCommentService } from '../services/taskCommentService';
import clsx from 'clsx';

interface TaskDetailsPopupProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  availableLabels?: Array<{ id: string; name: string; color: string }>;
  availableTeamMembers?: Array<{ id: string; name: string; color: string }>;
}

export const TaskDetailsPopup: React.FC<TaskDetailsPopupProps> = ({
  task,
  isOpen,
  onClose,
  availableLabels,
  availableTeamMembers,
}) => {
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'activity' | 'comments'>('activity');

  useEffect(() => {
    if (isOpen && task?.id) {
      loadActivities();
      loadComments();
    }
  }, [isOpen, task?.id]);

  const loadActivities = async () => {
    if (!task?.id) return;
    
    setIsLoadingActivities(true);
    try {
      const taskActivities = await taskActivityService.getTaskActivities(task.id);
      setActivities(taskActivities);
    } catch (error) {
      console.error('Failed to load task activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const loadComments = async () => {
    if (!task?.id) return;
    
    setIsLoadingComments(true);
    try {
      const taskComments = await taskCommentService.getTaskComments(task.id);
      setComments(taskComments);
    } catch (error) {
      console.error('Failed to load task comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task?.id) return;

    setIsSubmittingComment(true);
    try {
      const comment = await taskCommentService.createTaskComment({
        task_id: task.id,
        content: newComment.trim(),
      });
      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };
  if (!isOpen || !task) return null;

  const priorityColors = {
    low: 'bg-green-50 text-green-700 border-green-200',
    normal: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  const priorityLabels = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
  };

  const getLabelColor = (labelName: string) => {
    const label = availableLabels?.find(l => l.name === labelName);
    return label?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getTeamMemberColor = (memberName: string) => {
    const member = availableTeamMembers?.find(m => m.name === memberName);
    return member?.color || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'done') return false;
    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col relative transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold !text-gray-800">Task Details</h3>
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
          <div className="scrollable-content space-y-4">
            {/* Title */}
            <div>
              <h4 className="text-xl font-bold !text-gray-800 mb-2">{task.title}</h4>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={clsx(
                    'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                    priorityColors[task.priority]
                  )}
                >
                  <FlagIcon className="w-3 h-3 mr-1" />
                  {priorityLabels[task.priority]}
                </span>
                <span className={clsx(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border',
                  task.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                  task.status === 'in_review' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                )}>
                  {task.status === 'todo' ? 'To Do' :
                   task.status === 'in_progress' ? 'In Progress' :
                   task.status === 'in_review' ? 'In Review' :
                   task.status === 'done' ? 'Done' : task.status}
                </span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  Description
                </h5>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {/* Due Date */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                Due Date
              </h5>
              <p className={clsx(
                'text-sm',
                isOverdue() ? 'text-red-600 font-medium' : 'text-gray-600'
              )}>
                {formatDate(task.due_date)}
                {isOverdue() && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    Overdue
                  </span>
                )}
              </p>
            </div>

            {/* Labels */}
            {task.labels && task.labels.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <TagIcon className="w-4 h-4 mr-1" />
                  Labels
                </h5>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((labelName: string, index: number) => (
                    <span
                      key={index}
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                        getLabelColor(labelName)
                      )}
                    >
                      {labelName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            {task.assignees && task.assignees.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <UserCircleIcon className="w-4 h-4 mr-1" />
                  Assignees
                </h5>
                <div className="flex flex-wrap gap-2">
                  {task.assignees.map((assigneeName: string, index: number) => (
                    <span
                      key={index}
                      className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
                        getTeamMemberColor(assigneeName)
                      )}
                    >
                      <UserCircleIcon className="w-3 h-3 mr-1" />
                      {assigneeName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Created/Updated Dates */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Created: {new Date(task.created_at).toLocaleDateString()}</span>
                {task.updated_at && (
                  <span>Updated: {new Date(task.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Task Activity & Comments Tabs */}
            <div className="pt-3 border-t border-gray-200">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200 mb-4">
                <button
                  onClick={() => setActiveTab('activity')}
                  className={clsx(
                    'flex items-center px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <ClockIcon className="w-4 h-4 mr-1" />
                  Activity Timeline ({activities.length})
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={clsx(
                    'flex items-center px-3 py-2 text-xs font-medium border-b-2 transition-colors ml-4',
                    activeTab === 'comments'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <ChatBubbleLeftRightIcon className="w-4 h-4 mr-1" />
                  Comments ({comments.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === 'activity' && (
                <div>
                  {isLoadingActivities ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300 mx-auto mb-2"></div>
                      <p className="text-xs text-gray-500">Loading activity...</p>
                    </div>
                  ) : activities.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 text-xs">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                          <div className="flex-1">
                            <p className="text-gray-700 font-medium">{activity.description}</p>
                            <p className="text-gray-500">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No activity recorded yet</p>
                  )}
                </div>
              )}

              {activeTab === 'comments' && (
                <div>
                  {/* Comments List */}
                  <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                    {isLoadingComments ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mx-auto mb-2"></div>
                        <p className="text-xs text-gray-500">Loading comments...</p>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <UserCircleIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(comment.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-500 italic text-center py-4">No comments yet</p>
                    )}
                  </div>

                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      rows={3}
                      disabled={isSubmittingComment}
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSubmittingComment ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Adding...
                          </>
                        ) : (
                          <>
                            <PlusIcon className="w-3 h-3 mr-1" />
                            Add Comment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
