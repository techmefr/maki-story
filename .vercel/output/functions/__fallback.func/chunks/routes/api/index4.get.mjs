import { d as defineEventHandler, g as getDb } from '../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const index_get = defineEventHandler(async () => {
  return getDb()`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
        from messages order by created_at desc
    `;
});

export { index_get as default };
//# sourceMappingURL=index4.get.mjs.map
