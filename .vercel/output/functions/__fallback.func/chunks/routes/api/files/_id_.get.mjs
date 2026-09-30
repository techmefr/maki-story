import { d as defineEventHandler, g as getDb, e as setResponseHeader } from '../../../nitro/nitro.mjs';
import { r as requireParam, n as notFound } from '../../../_/validate.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const id = requireParam(event, "id");
  const [file] = await getDb()`select mime, data from files where id = ${id}`;
  if (!file) {
    return notFound("File not found");
  }
  setResponseHeader(event, "content-type", file.mime);
  setResponseHeader(event, "cache-control", "private, max-age=31536000, immutable");
  return file.data;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
