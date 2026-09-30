import { d as defineEventHandler, r as readBody, s as safeEqual, c as createError, a as startSession } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'os';
import 'fs';
import 'net';
import 'tls';
import 'crypto';
import 'stream';
import 'perf_hooks';

const FAILED_LOGIN_DELAY_MS = 600;
const login_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const body = await readBody(event);
  const expectedEmail = (_a = process.env.TEST_ACCESS_EMAIL) != null ? _a : "";
  const expectedPassword = (_b = process.env.TEST_ACCESS_PASSWORD) != null ? _b : "";
  const isKnown = expectedEmail !== "" && expectedPassword !== "" && safeEqual(((_c = body.email) != null ? _c : "").trim().toLowerCase(), expectedEmail.toLowerCase()) && safeEqual((_d = body.password) != null ? _d : "", expectedPassword);
  if (!isKnown) {
    await new Promise((resolve) => setTimeout(resolve, FAILED_LOGIN_DELAY_MS));
    throw createError({ statusCode: 401, statusMessage: "Wrong email or password" });
  }
  startSession(event);
  return { ok: true };
});

export { login_post as default };
//# sourceMappingURL=login.post.mjs.map
