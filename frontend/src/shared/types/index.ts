export interface Organization {
  id: string;
  name: string;
  myRole: string; // OWNER, ADMIN, MEMBER, VIEWER
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface TeamMember {
  membershipId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Invitation {
  id: string; // Es el membershipId
  role: string;
  status: string;
  organization: {
    id: string;
    name: string;
  };
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  assignee?: {
    id: string;
    name: string;
  };
  position: number;
}