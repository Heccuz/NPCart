export interface AdminUserDto {
  id: string
  email: string
  passwordHash: string
}

export interface IAdminUserRepository {
  findByEmail(email: string): Promise<AdminUserDto | null>
  upsert(email: string, passwordHash: string): Promise<AdminUserDto>
}
