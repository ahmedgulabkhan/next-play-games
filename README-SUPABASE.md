# Supabase Task Board Setup

This document explains how to set up the Kanban task board with Supabase backend.

## Database Schema

Run the following SQL in your Supabase SQL editor (found in `supabase-schema.sql`):

```sql
-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')) DEFAULT 'todo',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal',
  due_date DATE,
  assignee_id UUID,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own tasks
CREATE POLICY "Users can manage their own tasks" ON tasks
  FOR ALL USING (user_id = auth.uid());

-- Allow anonymous users (guest sessions) to manage tasks
CREATE POLICY "Guest users can manage their tasks" ON tasks
  FOR ALL USING (user_id IS NOT NULL);

-- Function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Environment Variables

Create a `.env` file in the root of your project:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_anon_key
```

## Features

### Core Functionality
- ✅ **Create Tasks**: Click the + button in any column to create a new task
- ✅ **Read Tasks**: Tasks are automatically loaded from Supabase and updated in real-time
- ✅ **Update Tasks**: Click the three dots on any task to edit title, description, priority, and due date
- ✅ **Delete Tasks**: Use the delete button in the task edit modal
- ✅ **Drag & Drop**: Drag tasks between columns to update their status

### Data Model
- **id**: UUID primary key (auto-generated)
- **title**: Text (required)
- **description**: Text (optional)
- **status**: Enum (todo, in_progress, in_review, done)
- **priority**: Enum (low, normal, high)
- **due_date**: Date (optional)
- **assignee_id**: UUID (optional, for future team member assignment)
- **user_id**: UUID (tied to guest session)
- **created_at**: Timestamp (auto-set)
- **updated_at**: Timestamp (auto-updated)

## Guest Accounts (Required)

Your app now supports **proper guest accounts** using Supabase Auth:

### ✅ **Implementation Complete**
- **Supabase Auth Anonymous Sign-in**: No email/password required
- **Automatic Guest Session Creation**: On first app launch
- **Proper User Isolation**: Each user only sees their own tasks
- **Row Level Security (RLS)**: Database-level data protection

### 🔐 **How It Works**

1. **Automatic Sign-in**: 
   ```typescript
   const { data, error } = await supabase.auth.signInAnonymously();
   ```

2. **Unique User IDs**: Each guest gets a unique UUID from Supabase

3. **RLS Policies**: 
   ```sql
   CREATE POLICY "Users can manage their own tasks" ON tasks
     FOR ALL USING (auth.uid() = user_id);
   ```

### 🎯 **Expected Behavior**
- ✅ **User A** creates tasks → Only User A sees User A's tasks
- ✅ **User B** creates tasks → Only User B sees User B's tasks
- ✅ **Real-time Isolation**: Updates sync per user only
- ✅ **Cross-browser Sync**: Same user sees tasks across devices

### 👤 **User Identification**
Guest users are identified in the UI:
```
Guest User: 12345678-90ab-cdef...
```

### 🔄 **Session Management**
- Automatic session persistence
- Auth state change listeners
- Fallback to localStorage if needed
- Proper session cleanup on sign out

## Architecture

### Frontend Components
- `KanbanBoard`: Main board component with drag-and-drop context
- `KanbanColumn`: Individual column with drop zone
- `TaskCard`: Visual task representation
- `SortableTaskCard`: Draggable wrapper for tasks
- `TaskModal`: Edit/Create task modal

### Services
- `taskService`: All Supabase CRUD operations
- `useGuestSession`: Guest session management hook

### Real-time Features
- Automatic task updates using Supabase subscriptions
- Optimistic UI updates for better UX
- Error handling with user feedback

## Usage

1. **Start Development**:
   ```bash
   npm run dev
   ```

2. **Create Tasks**: Click + in any column
3. **Edit Tasks**: Click the three dots on any task
4. **Move Tasks**: Drag and drop between columns
5. **Delete Tasks**: Use the delete button in the edit modal

## Future Enhancements

- Team member management
- Task assignments
- File attachments
- Comments system
- Advanced filtering and search
- Task templates
- Bulk operations
