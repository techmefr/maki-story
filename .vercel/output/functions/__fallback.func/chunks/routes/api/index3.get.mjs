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
        select id, name, role, color, photo_file_id from members order by created_at
    `;
});

export { index_get as default };
//# sourceMappingURL=index3.get.mjs.map
