import { d as defineEventHandler, r as readBody, g as getDb, o as one } from '../../nitro/nitro.mjs';
import { i as isNonEmptyString, b as badRequest, M as MAX_MESSAGES_PER_CONVERSATION } from '../../_/validate.mjs';
import { d as deleteFiles } from '../../_/books.mjs';
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
  var _a;
  const body = await readBody(event);
  if (!isNonEmptyString(body.fromMemberId) || !isNonEmptyString(body.toMemberId) || !isNonEmptyString(body.fileId) || !isNonEmptyString(body.mime) || body.fromMemberId === body.toMemberId) {
    return badRequest("Invalid message");
  }
  const db = getDb();
  const message = one(await db`
        insert into messages (from_member_id, to_member_id, file_id, mime, duration_ms)
        values (${body.fromMemberId}, ${body.toMemberId}, ${body.fileId}, ${body.mime}, ${Math.round((_a = body.durationMs) != null ? _a : 0)})
        returning id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
    `);
  const stale = await db`
        select id, file_id from messages
        where (from_member_id = ${body.fromMemberId} and to_member_id = ${body.toMemberId})
           or (from_member_id = ${body.toMemberId} and to_member_id = ${body.fromMemberId})
        order by created_at desc offset ${MAX_MESSAGES_PER_CONVERSATION}
    `;
  if (stale.length > 0) {
    await db`delete from messages where id in ${db(stale.map((item) => item.id))}`;
    await deleteFiles(stale.map((item) => item.fileId));
  }
  return message;
});

export { index_post as default };
//# sourceMappingURL=index5.post.mjs.map
