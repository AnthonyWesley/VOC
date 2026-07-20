export type CreateUserInput = {
  email: string;
  password?: string;
};

export type ListUsersInput = {
  limit: number;
  cursor?: string;
  search?: string;
  isActive?: boolean;
};

export interface UserOutput {
  userId: string;
  memberId: string | null;
  email: string | null;
  photoUrl?: string | null;
  isActive: boolean;
  roles: Array<{ id: string; name: string; level: number }>;
  ministries: Array<{ id: string; name: string; joinedAt: Date }>;

  fullName: string | null;
  phone: string | null;
  birthDate: Date | null;
  baptismDate: Date | null;
  createdAt: Date;
}

export type PaginatedUsersOutput = {
  data: UserOutput[];
  nextCursor: string | null;
};
