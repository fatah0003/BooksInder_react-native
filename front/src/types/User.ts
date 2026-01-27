export interface InfosUser {
  id: number;
  userName: string;
  phoneNumber: string;
  city: string;
  birthDate: string;
  bio?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  uuid: string;
  email: string;
  roles: string[];
  createdAt: string;
  updatedAt?: string;
  userStatus: string;
  infosUser?: InfosUser;  // rempli après inscription
}

export interface AuthResponse {
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
}
