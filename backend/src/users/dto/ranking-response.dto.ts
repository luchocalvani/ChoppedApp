export class RankingEntryDto {
  id!: string;
  alias!: string | null;
  name!: string;
  profileImageUrl!: string | null;
  level!: number;
  xp!: number;
  rank!: number;
}

export class RankingResponseDto {
  items!: RankingEntryDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  myRank!: number | null;
}
