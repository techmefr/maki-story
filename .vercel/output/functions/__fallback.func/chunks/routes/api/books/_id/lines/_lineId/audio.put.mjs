import { d as defineEventHandler, r as readBody, g as getDb } from '../../../../../../nitro/nitro.mjs';
import { d as deleteFiles } from '../../../../../../_/books.mjs';
import { r as requireParam, i as isNonEmptyString, b as badRequest, n as notFound } from '../../../../../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const audio_put = defineEventHandler(async (event) => {
  var _a;
  const bookId = requireParam(event, "id");
  const lineId = requireParam(event, "lineId");
  const body = await readBody(event);
  if (!isNonEmptyString(body.fileId)) {
    return badRequest("A file is required");
  }
  const db = getDb();
  const [previous] = await db`
        select audio_file_id from lines where id = ${lineId} and book_id = ${bookId}
    `;
  if (!previous) {
    return notFound("Line not found");
  }
  await db`update lines set audio_file_id = ${body.fileId}, audio_ms = ${Math.round((_a = body.ms) != null ? _a : 0)} where id = ${lineId}`;
  await deleteFiles([previous.audioFileId]);
  return { ok: true };
});

export { audio_put as default };
//# sourceMappingURL=audio.put.mjs.map
