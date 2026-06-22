import { SignJWT, jwtVerify } from "jose";

const authSecret = process.env.AUTH_SECRET;

if (!authSecret || authSecret === "troque-esta-chave-em-producao") {
  throw new Error("AUTH_SECRET precisa ser configurado com uma chave aleatória.");
}

const secret = new TextEncoder().encode(authSecret);

export type SessionPayload = {
  sub: string;
  role: "MORADOR" | "ADMINISTRADOR" | "SINDICO";
  name: string;
  email: string;
};

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySession(token: string) {
  const result = await jwtVerify<SessionPayload>(token, secret);
  return result.payload;
}
