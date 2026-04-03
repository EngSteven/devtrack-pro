export enum Role {
  OWNER = 'OWNER',   // Creador de la organización (Control total, facturación)
  ADMIN = 'ADMIN',   // Puede gestionar proyectos y usuarios
  MEMBER = 'MEMBER', // Puede crear y mover tareas
  VIEWER = 'VIEWER', // Solo lectura (Ideal para clientes externos)
}