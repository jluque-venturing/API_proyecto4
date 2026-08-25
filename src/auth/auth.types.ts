export interface JwtPayload {
  sub: string;
  email: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthUserWithRefresh extends AuthUser {
  refreshToken: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}
