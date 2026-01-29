import { Book } from './Book';

export interface InfosUserPublic {
  userName: string;
  city: string;
  bio?: string;
}

export interface UserPublic {
  uuid: string;
  infosUser?: InfosUserPublic;
}

export interface UserPublicProfileData {
  user: UserPublic;
  books: Book[];
}
