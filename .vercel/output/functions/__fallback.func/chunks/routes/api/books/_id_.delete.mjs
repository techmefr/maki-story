import { d as defineEventHandler, g as getDb } from '../../../nitro/nitro.mjs';
import { l as loadBook, d as deleteFiles } from '../../../_/books.mjs';
import { r as requireParam } from '../../../_/validate.mjs';
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
  const book = await loadBook(id);
  await getDb()`delete from books where id = ${id}`;
  await deleteFiles([...book.pages.map((page) => page.fileId), ...book.lines.map((line) => line.audioFileId)]);
  return { ok: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
