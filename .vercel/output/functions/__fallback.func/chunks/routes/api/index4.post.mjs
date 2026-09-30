import { d as defineEventHandler, r as readBody, o as one, g as getDb } from '../../nitro/nitro.mjs';
import { i as isNonEmptyString, a as isMemberRole, c as isVoiceColor, b as badRequest } from '../../_/validate.mjs';
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

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  if (!isNonEmptyString(body.name) || !isMemberRole(body.role) || !isVoiceColor(body.color)) {
    return badRequest("Invalid member");
  }
  return one(await getDb()`
        insert into members (name, role, color)
        values (${body.name.trim()}, ${body.role}, ${body.color})
        returning id, name, role, color, photo_file_id
    `);
});

export { index_post as default };
//# sourceMappingURL=index4.post.mjs.map
