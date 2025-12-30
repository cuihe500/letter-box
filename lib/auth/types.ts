// 用户角色类型
export type UserRole = 'admin' | 'viewer';

// Session数据结构
export interface SessionData {
  userId: number;
  role: UserRole;
  sessionToken: string;
}
