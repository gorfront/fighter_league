export interface Fighter {
  id: string;
  user_id?: number;
  name: string;
  email?: string;
  country: string;
  division: string;
  weight: number;
  gender: "male" | "female";
  record: string;
  wins: number;
  losses: number;
  draws: number;
  image: string;
  ranking?: number;
  bio?: string;
  achievements?: string[];
  sponsors?: Sponsor[];
  walletAddress: string;
  status?: "pending" | "verified" | "not_found";
}

export interface Sponsor {
  id: string;
  name: string;
  tier: "fighter" | "division" | "national" | "regional" | "global";
  logo?: string;
}

export interface Division {
  id: string;
  name: string;
  gender: "male" | "female";
  min_weight: number;
  max_weight: number;
}
