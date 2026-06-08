export class UserResponseDto {
  id!: string;
  name!: string;
  alias!: string | null;
  profileImageUrl!: string | null;
  email!: string;
  isAdmin!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
