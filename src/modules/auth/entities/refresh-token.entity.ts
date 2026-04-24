export class RefreshTokenEntity {
    id:        number;
    userId:    number;
    token:     string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }
