import { d as defineEventHandler, g as getDb, o as one } from '../../../nitro/nitro.mjs';
import { r as requireParam, b as badRequest } from '../../../_/validate.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  const id = requireParam(event, "id");
  const db = getDb();
  const { count } = one(await db`
        select count(*)::int as count from members where role = 'parent' and id <> ${id}
    `);
  if (count === 0) {
    return badRequest("At least one parent is required");
  }
  await db`delete from members where id = ${id}`;
  await db`update lines set member_id = null, audio_file_id = null, audio_ms = 0 where member_id = ${id}`;
  await db`delete from messages where from_member_id = ${id} or to_member_id = ${id}`;
  return { ok: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
