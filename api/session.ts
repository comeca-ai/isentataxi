import * as jose from "jose";
import { env } from "./lib/env";

export type SessionPayload = {
  /** Identificador único do usuário (para auth local, é o email) */
  unionId: string;
};

const JWT_ALG = "HS256";

function getSecret() {
  return new TextEncoder().encode(env.jwtSecret);
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(), {
      algorithms: [JWT_ALG],
    });
    if (!payload.unionId || typeof payload.unionId !== "string") {
      return null;
    }
    return { unionId: payload.unionId };
  } catch {
    return null;
  }
}
