import { d as defineEventHandler, r as readBody, g as getDb } from '../../nitro/nitro.mjs';
import { b as badRequest } from '../../_/validate.mjs';
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

const MOODS = ["love", "ok", "bad"];
const index_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const body = await readBody(event);
  const mood = body.mood && MOODS.includes(body.mood) ? body.mood : null;
  const text = ((_a = body.text) != null ? _a : "").trim();
  if (!mood && text === "") {
    return badRequest("Feedback is empty");
  }
  await getDb()`
        insert into feedback (member_name, screen, mood, text)
        values (${(_b = body.memberName) != null ? _b : ""}, ${(_c = body.screen) != null ? _c : ""}, ${mood}, ${text})
    `;
  return { ok: true };
});

export { index_post as default };
//# sourceMappingURL=index2.post.mjs.map
