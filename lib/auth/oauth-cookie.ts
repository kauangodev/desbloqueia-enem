import "server-only";
import { createHmac } from "node:crypto";
import { requiredSessionSecret } from "../security";

/** Assinatura HMAC do cookie de estado do login com Google (state, nonce, PKCE). */
export const signPayload = (payload: string) => createHmac("sha256", requiredSessionSecret()).update(payload).digest("base64url");
