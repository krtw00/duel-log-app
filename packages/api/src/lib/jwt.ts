import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const secret = new TextEncoder().encode(JWT_SECRET);
const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '30d';

export type JwtPayload = {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
};

export async function signAccessToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(secret);
}

export async function signRefreshToken(userId: string, email: string): Promise<string> {
  return new SignJWT({ sub: userId, email, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_TTL)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}
