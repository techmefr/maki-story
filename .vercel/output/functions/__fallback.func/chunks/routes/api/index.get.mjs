import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { a as listBookSummaries } from '../../_/books.mjs';
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
import '../../_/validate.mjs';

const index_get = defineEventHandler(() => listBookSummaries());

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
