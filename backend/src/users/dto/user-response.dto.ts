export class UserResponseDto {
  id!: string;
  name!: string;
  alias!: string | null;
  profileImageUrl!: string | null;
  email!: string;
  isAdmin!: boolean;
  points!: number;
  xp!: number;
  level!: number;
  createdAt!: Date;
  updatedAt!: Date;
}
