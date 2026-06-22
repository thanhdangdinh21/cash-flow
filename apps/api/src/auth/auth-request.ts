// Shape of the request object after JwtAuthGuard ran (see JwtStrategy.validate)
export interface AuthRequest {
  user: { userId: string };
}
