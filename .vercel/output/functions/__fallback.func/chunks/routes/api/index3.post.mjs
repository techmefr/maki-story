import { d as defineEventHandler, f as getHeader, i as readRawBody, o as one, g as getDb } from '../../nitro/nitro.mjs';
import { b as badRequest } from '../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ALLOWED_PREFIXES = ["image/", "audio/", "video/mp4", "video/webm"];
const index_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const mime = (_c = (_b = ((_a = getHeader(event, "content-type")) != null ? _a : "").split(";")[0]) == null ? void 0 : _b.trim()) != null ? _c : "";
  if (!ALLOWED_PREFIXES.some((prefix) => mime.startsWith(prefix))) {
    return badRequest("Unsupported file type");
  }
  const raw = await readRawBody(event, false);
  if (!raw || raw.length === 0) {
    return badRequest("Empty file");
  }
  if (raw.length > MAX_FILE_BYTES) {
    return badRequest("File is too large");
  }
  return one(await getDb()`
        insert into files (mime, data) values (${mime}, ${raw}) returning id
    `);
});

export { index_post as default };
//# sourceMappingURL=index3.post.mjs.map
