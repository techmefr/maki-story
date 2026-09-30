import { d as defineEventHandler, r as readBody, g as getDb } from '../../../nitro/nitro.mjs';
import { l as loadBook } from '../../../_/books.mjs';
import { r as requireParam, b as badRequest } from '../../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const STATUSES = ["draft", "to_record", "ready"];
const _id__patch = defineEventHandler(async (event) => {
  const id = requireParam(event, "id");
  const body = await readBody(event);
  if (body.status !== void 0 && !STATUSES.includes(body.status)) {
    return badRequest("Invalid status");
  }
  await loadBook(id);
  await getDb().begin(async (tx) => {
    var _a, _b;
    if (body.title !== void 0 && body.title.trim() !== "") {
      await tx`update books set title = ${body.title.trim()} where id = ${id}`;
    }
    if (body.imageDesc !== void 0) {
      await tx`update books set image_desc = ${body.imageDesc} where id = ${id}`;
    }
    if (body.status !== void 0) {
      await tx`update books set status = ${body.status} where id = ${id}`;
    }
    for (const [memberId, tone] of Object.entries((_a = body.tones) != null ? _a : {})) {
      await tx`
                insert into book_voices (book_id, member_id, tone) values (${id}, ${memberId}, ${tone})
                on conflict (book_id, member_id) do update set tone = excluded.tone
            `;
    }
    for (const patch of (_b = body.lines) != null ? _b : []) {
      if (patch.memberId !== void 0) {
        await tx`
                    update lines set member_id = ${patch.memberId},
                        audio_file_id = case when member_id is distinct from ${patch.memberId} then null else audio_file_id end,
                        audio_ms = case when member_id is distinct from ${patch.memberId} then 0 else audio_ms end
                    where id = ${patch.id} and book_id = ${id}
                `;
      }
      if (patch.note !== void 0) {
        await tx`update lines set note = ${patch.note} where id = ${patch.id} and book_id = ${id}`;
      }
    }
  });
  return loadBook(id);
});

export { _id__patch as default };
//# sourceMappingURL=_id_.patch.mjs.map
