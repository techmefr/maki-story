import { d as defineEventHandler, g as getDb } from '../../../../../../nitro/nitro.mjs';
import { d as deleteFiles } from '../../../../../../_/books.mjs';
import { r as requireParam, n as notFound } from '../../../../../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const audio_delete = defineEventHandler(async (event) => {
  const bookId = requireParam(event, "id");
  const lineId = requireParam(event, "lineId");
  const db = getDb();
  const [previous] = await db`
        select audio_file_id from lines where id = ${lineId} and book_id = ${bookId}
    `;
  if (!previous) {
    return notFound("Line not found");
  }
  await db`update lines set audio_file_id = null, audio_ms = 0 where id = ${lineId}`;
  await deleteFiles([previous.audioFileId]);
  return { ok: true };
});

export { audio_delete as default };
//# sourceMappingURL=audio.delete.mjs.map
