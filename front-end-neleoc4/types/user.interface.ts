export interface IUser {
  id: string;
  createdAt: string;
  updatedAt: string;
  login: string;
  roles: string[];
  name: string;
  description: string;
  photoUrl: string;
  isDelete: boolean;
  email: string | null; // Make sure email is either a string or null, but not undefined.
  emailVerified: boolean | null;
}

export enum Roles {
  ADMIN = 'ADMIN',
  SETTINGS_MANAGER = 'SETTINGS_MANAGER',
  VIALS_MANAGER = 'VIALS_MANAGER'
}
export interface MyUser {
  id: number;

  createdAt: string;

  telegramId: number;
  telegramUsername: string;

  paymentGenerationCount: number;
  freeGenerationCount: number;
  language: string;
}

export interface UserMoreInfo {
  id: number;

  createdAt: string;
  updatedAt: string;
  lastActiveAt: string;

  discountId: number;

  freeGenerationCount: number;
  paymentGenerationCount: number;

  generations: any[];

  language: string;

  telegramFullName: string;
  telegramId: number;
  telegramUsername: string;

  payments: any[];
  usersSettings: any[];
  selectedVials: any[];
  usersUsePromocodes: any[];
}

export interface GetMyUsers {
  users: MyUser[];

  totalUsers: number;
  pageCount: number;
}
