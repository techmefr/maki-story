import { d as defineEventHandler, g as getDb } from '../../../../nitro/nitro.mjs';
import { r as requireParam } from '../../../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const listen_post = defineEventHandler(async (event) => {
  const id = requireParam(event, "id");
  await getDb()`update messages set listened_at = now() where id = ${id} and listened_at is null`;
  return { ok: true };
});

export { listen_post as default };
//# sourceMappingURL=listen.post.mjs.map
