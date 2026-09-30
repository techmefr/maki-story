import { d as defineEventHandler, g as getDb } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async () => {
  return getDb()`
        select id, member_name, screen, mood, text, created_at from feedback order by created_at desc limit 500
    `;
});

export { index_get as default };
//# sourceMappingURL=index2.get.mjs.map
