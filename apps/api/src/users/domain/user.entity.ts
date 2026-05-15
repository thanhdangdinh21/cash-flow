export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl: string | null;
  language: string;
  theme: string;
  notificationsOn: boolean;
  createdAt: Date;
  updatedAt: Date;
}
