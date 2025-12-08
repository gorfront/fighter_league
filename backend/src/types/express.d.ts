interface UserPayload {
  id: number;
  walletAddress: string;
  country: string | null;
  is_military: boolean;
  wallet_address?: string;
}

declare global {
  namespace Express {
    export interface Request {
      user?: UserPayload;
    }
  }
}
