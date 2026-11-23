export interface LoginResponse {
  token: string
  email: string
}

export interface IAuthGateway {
  login(email: string, password: string): Promise<LoginResponse>
}
