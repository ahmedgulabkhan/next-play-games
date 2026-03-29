## Task Board Project Overview
### Project Overview
A modern, fully-featured Kanban-style task management application built with React,
TypeScript, and Supabase. The app provides real-time task management with drag-and-drop
functionality, guest authentication, and comprehensive task tracking capabilities.
### Key Design Decisions
- React + TypeScript: For type safety and better development experience
- Supabase: Backend-as-a-Service providing real-time database, authentication, and Row Level
Security
- @dnd-kit: Modern drag-and-drop library with excellent accessibility and performance
- Tailwind CSS: Utility-first CSS framework for rapid UI development
- Guest Authentication: Anonymous sign-in for instant access without registration barriers
### Live Demo
Frontend App: https://next-play-kanban.vercel.app/
### Repository
GitHub: https://github.com/ahmedgulabkhan/next-play-games
### Database Schema
#### Core Tables
- Tasks (tasks)
- Labels (labels)
- Team Members (team_members)
- Task Activity (task_activity)
- Task Comments (task_comments)
##### Tasks Table
```sql
CREATE TABLE tasks (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
title TEXT NOT NULL,
description TEXT,
status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'in_review', 'done')) DEFAULT
'todo',
priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')) DEFAULT 'normal',

labels TEXT[] DEFAULT '{}',
assignees TEXT[] DEFAULT '{}',
due_date DATE,
assignee_id UUID,
user_id UUID NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE
);
```
##### Labels Table
```sql
CREATE TABLE labels (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name TEXT NOT NULL,
color TEXT NOT NULL,
user_id UUID NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE,
UNIQUE(name, user_id)
);
```
##### Team Members Table
```sql
CREATE TABLE team_members (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name TEXT NOT NULL,
color TEXT NOT NULL,
user_id UUID NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE,
UNIQUE(name, user_id)
);
```
##### Task Activity Table
```sql
CREATE TABLE task_activity (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'status_changed', 'assigned',
'unassigned', 'priority_changed', 'due_date_changed', 'labels_changed', 'description_changed')),
description TEXT,

old_value TEXT,
new_value TEXT,
user_id UUID,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

##### Task Comments Table
```sql
CREATE TABLE task_comments (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
content TEXT NOT NULL,
user_id UUID,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE
);
```

## Security Features
- Row Level Security (RLS) enabled on all tables
- Guest User Support: Anonymous users can create and manage their own tasks
- User Isolation: Each user only sees their own data
- Automatic Timestamps: `created_at` and `updated_at` managed by triggers
## Setup Instructions
### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account and project
### Local Development Setup
1. Clone the repository
```
git clone https://github.com/ahmedgulabkhan/next-play-games.git
```
2. Install dependencies
```
npm install
```

3. Set up Supabase
- Create a new Supabase project
- Run the SQL schema from `supabase-schema.sql` of repository in your Supabase SQL
editor
- Enable Anonymous authentication in Supabase Auth settings
4. Configure environment variables
Create a `.env` file in the root:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-default-key
```
5. Start development server
```
npm run dev
```

6. Open your browser
Go to `http://localhost:5173`

### Production Build
```
npm run build
```

## Advanced Features

1. Drag & Drop Task Management
- Library: @dnd-kit for modern, accessible drag-and-drop
- Features: Smooth animations, keyboard navigation, touch support
- Implementation: Custom sensors and context providers for optimal performance
2. Guest Authentication System
- Technology: Supabase Anonymous Authentication
- Benefits: No registration required, instant access
- Security: Each guest gets isolated data space with RLS
3. Activity Tracking

- Comprehensive Logging: All task changes are tracked in `task_activity` table
- Change Types: Creation, updates, status changes, assignments, priority changes
- Audit Trail: Full history of who changed what and when
4. Advanced Task Features
- Labels System: Custom color-coded labels for categorization
- Team Members: Assign tasks to team members with visual indicators
- Priority Levels: Low, Normal, High with visual styling
- Due Dates: Calendar integration with date picker
- Rich Descriptions: Text formatting support for task details
5. Search and Filtering
- Real-time Search: Instant filtering of tasks by title and description
- Status-based Filtering: Quick access to tasks by status
- Label Filtering: Filter tasks by specific labels

## Tradeoffs and Future Improvements
### Current Tradeoffs
1. Simplified Team Management: Current team member system is user-scoped, not
organization-wide
2. No File Attachments: File upload functionality not implemented
3. Limited Notifications: No email or push notification system
4. Basic Reporting: No analytics or reporting dashboard

### Planned Improvements
1. Enhanced Collaboration
- Real-time cursor tracking
- @mentions and notifications
- Comment threading and replies
2. Advanced Features
- File attachments and document management
- Task templates and recurring tasks
- Time tracking and reporting
- Gantt chart view
3. Performance Optimizations
- Virtual scrolling for large task lists
- Offline support with service workers
- Image optimization and lazy loading
4. Mobile App
- Progressive Web App (PWA) capabilities
- Native mobile app development
- Touch-optimized interactions
5. Enterprise Features
- Organization-level user management
- Advanced permissions and roles
- SSO integration
- Audit logs and compliance features

## Technical Debt
- Component refactoring for better reusability
- Comprehensive test suite implementation
- Error boundary improvements
- Performance monitoring integration

## Technology Stack
### Frontend
- React 19: Modern React with concurrent features
- TypeScript: Type safety and better IDE support
- Tailwind CSS 4: Utility-first styling
- Vite: Fast build tool and dev server
- @dnd-kit: Drag and drop functionality
- @heroicons/react: Icon library

### Backend
- Supabase: Database, auth, and real-time services
- PostgreSQL: Robust relational database
- Row Level Security: Data access control

### Development Tools
- ESLint: Code linting and formatting

- TypeScript: Static type checking
- Vite: Fast development and building