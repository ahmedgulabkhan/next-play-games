import React, { useState, useEffect } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, KeyboardSensor, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Task, Column, Label, TeamMember } from '../types';
import { TaskCard } from './TaskCard';
import { TaskEditPopup } from './TaskEditPopup';
import { TaskAddPopup } from './TaskAddPopup';
import { KanbanColumn } from './KanbanColumn';
import { taskService } from '../services/taskService';
import { labelService } from '../services/labelService';
import { teamMemberService } from '../services/teamMemberService';
import { useGuestSession } from '../hooks/useGuestSession';
import { LabelsPopup } from './LabelsPopup';
import { TeamPopup } from './TeamPopup';
import { TaskDetailsPopup } from './TaskDetailsPopup';

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo',
    taskIds: [],
    color: 'gray',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    status: 'in_progress',
    taskIds: [],
    color: 'blue',
  },
  {
    id: 'in_review',
    title: 'In Review',
    status: 'in_review',
    taskIds: [],
    color: 'purple',
  },
  {
    id: 'done',
    title: 'Done',
    status: 'done',
    taskIds: [],
    color: 'green',
  },
];

export const KanbanBoard: React.FC = () => {
  const { userId, isLoading: sessionLoading } = useGuestSession();
  const [columns] = useState<Column[]>(initialColumns);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'normal' | 'high'>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [labels, setLabels] = useState<Label[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLabelsPopupOpen, setIsLabelsPopupOpen] = useState(false);
  const [isTeamPopupOpen, setIsTeamPopupOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [addTaskColumnId, setAddTaskColumnId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load tasks from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadTasks = async () => {
      try {
        const fetchedTasks = await taskService.getTasks(userId);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Failed to load tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();

    // Subscribe to real-time updates
    const unsubscribe = taskService.subscribeToTasks(userId, (updatedTasks) => {
      setTasks(updatedTasks);
    });

    return unsubscribe;
  }, [userId]);

  // Load labels from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadLabels = async () => {
      try {
        const fetchedLabels = await labelService.getLabels(userId);
        setLabels(fetchedLabels);
      } catch (error) {
        console.error('Failed to load labels:', error);
      }
    };

    loadLabels();

    // Subscribe to real-time label updates
    const unsubscribeLabels = labelService.subscribeToLabels(userId, (updatedLabels) => {
      setLabels(updatedLabels);
    });

    return unsubscribeLabels;
  }, [userId]);

  // Load team members from Supabase
  useEffect(() => {
    if (!userId) return;

    const loadTeamMembers = async () => {
      try {
        const fetchedTeamMembers = await teamMemberService.getTeamMembers(userId);
        setTeamMembers(fetchedTeamMembers);
      } catch (error) {
        console.error('Failed to load team members:', error);
      }
    };

    loadTeamMembers();

    // Subscribe to real-time team member updates
    const unsubscribeTeamMembers = teamMemberService.subscribeToTeamMembers(userId, (updatedTeamMembers) => {
      setTeamMembers(updatedTeamMembers);
    });

    return unsubscribeTeamMembers;
  }, [userId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
    
    // Don't start drag if clicking on edit button
    if ((event.originalEvent as any)?.target?.closest('.edit-button')) {
      return false; // Prevent drag
    }
  };

  const handleDragOver = async (event: any) => {
    const { active, over } = event;
    if (!over || !userId) return;

    // Only handle drag over if we're not clicking on an edit button
    if ((event.originalEvent as any)?.target?.closest('.edit-button')) {
      return;
    }

    const activeTask = tasks.find(t => t.id === active.id);
    const overColumn = columns.find(c => c.id === over.id);

    if (activeTask && overColumn && activeTask.status !== overColumn.status) {
      try {
        const updatedTask = await taskService.moveTask(activeTask.id, overColumn.status);
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === activeTask.id ? updatedTask : task
          )
        );
      } catch (error) {
        console.error('Failed to move task:', error);
      }
    }
  };

  const handleDragEnd = () => {
    setActiveTask(null);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleTaskEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditPopupOpen(true);
  };

  const handleEditClose = () => {
    setEditingTask(null);
    setIsEditPopupOpen(false);
  };
  const handleAddTaskClick = (columnId: string) => {
    setAddTaskColumnId(columnId);
    setIsAddPopupOpen(true);
  };

  const handleAddTaskSubmit = async (taskData: { title: string; description?: string; priority: 'low' | 'normal' | 'high'; due_date?: string; labels?: string[]; assignees?: string[] }) => {
    if (!userId || !addTaskColumnId) return;

    try {
      const newTask = await taskService.createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        due_date: taskData.due_date,
        labels: taskData.labels || [],
        assignees: taskData.assignees || [],
        status: addTaskColumnId as any,
      }, userId);
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      handleAddTaskClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleAddTaskClose = () => {
    setIsAddPopupOpen(false);
    setAddTaskColumnId('');
  };

  const handleTaskDetails = (task: Task) => {
    setDetailsTask(task);
    setIsDetailsPopupOpen(true);
  };

  const handleDetailsClose = () => {
    setDetailsTask(null);
    setIsDetailsPopupOpen(false);
  };

  if (sessionLoading || isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Filter tasks based on search query, priority, labels, and assignees
  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Priority filter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Label filter
    const matchesLabel = labelFilter === 'all' || task.labels.includes(labelFilter);
    
    // Assignee filter
    const matchesAssignee = assigneeFilter === 'all' || task.assignees.includes(assigneeFilter);
    
    return matchesSearch && matchesPriority && matchesLabel && matchesAssignee;
  });

  // Calculate board statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'done').length,
    overdue: tasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      return dueDate < today;
    }).length,
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl !text-gray-800 font-bold mb-3 tracking-tight">Task Board</h1>
              <p className="text-lg text-gray-700 font-medium">Manage your tasks effectively</p>
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => setIsLabelsPopupOpen(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Labels
              </button>
              <button
                onClick={() => setIsTeamPopupOpen(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Team
              </button>
            </div>
          </div>

          {/* Board Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search tasks by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 placeholder-gray-400"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Priority:</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as 'all' | 'low' | 'normal' | 'high')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Label Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Label:</label>
              <select
                value={labelFilter}
                onChange={(e) => setLabelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm min-w-[120px]"
              >
                <option value="all">All Labels</option>
                {labels.map((label) => (
                  <option key={label.id} value={label.name}>
                    {label.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Assignee:</label>
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800 text-sm min-w-[120px]"
              >
                <option value="all">All Assignees</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        {/* Active Filters Indicator */}
        {(priorityFilter !== 'all' || labelFilter !== 'all' || assigneeFilter !== 'all') && (
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs text-gray-500">Active filters:</span>
            {priorityFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border-blue-200">
                Priority: {priorityFilter}
              </span>
            )}
            {labelFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border-purple-200">
                Label: {labelFilter}
              </span>
            )}
            {assigneeFilter !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border-green-200">
                Assignee: {assigneeFilter}
              </span>
            )}
          </div>
        )}
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={filteredTasks}
                availableLabels={labels}
                availableTeamMembers={teamMembers}
                onAddTaskClick={handleAddTaskClick}
                onEditTask={handleTaskEdit}
                onViewDetails={handleTaskDetails}
                editingTask={editingTask}
                isEditPopupOpen={isEditPopupOpen}
                onEditClose={handleEditClose}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="rotate-2 opacity-90 shadow-2xl">
                <TaskCard task={activeTask} isDragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        
        {editingTask && (
          <TaskEditPopup
            task={editingTask}
            isOpen={isEditPopupOpen}
            onClose={handleEditClose}
            onUpdate={handleTaskUpdate}
            onDelete={handleTaskDelete}
            availableLabels={labels}
            availableTeamMembers={teamMembers}
          />
        )}
        
        <TaskAddPopup
          isOpen={isAddPopupOpen}
          onClose={handleAddTaskClose}
          onSubmit={handleAddTaskSubmit}
          columnId={addTaskColumnId}
          availableLabels={labels}
          availableTeamMembers={teamMembers}
        />
        
        <LabelsPopup
          isOpen={isLabelsPopupOpen}
          onClose={() => setIsLabelsPopupOpen(false)}
          labels={labels}
          onLabelsChange={setLabels}
          userId={userId || ''}
        />
        
        <TeamPopup
          isOpen={isTeamPopupOpen}
          onClose={() => setIsTeamPopupOpen(false)}
          teamMembers={teamMembers}
          onTeamMembersChange={setTeamMembers}
          userId={userId || ''}
        />

        <TaskDetailsPopup
          task={detailsTask!}
          isOpen={isDetailsPopupOpen}
          onClose={handleDetailsClose}
          availableLabels={labels}
          availableTeamMembers={teamMembers}
        />
      </div>
    </div>
  );
};
