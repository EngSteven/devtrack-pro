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
}