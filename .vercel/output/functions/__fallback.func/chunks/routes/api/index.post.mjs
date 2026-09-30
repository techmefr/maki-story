import { d as defineEventHandler, r as readBody, g as getDb, o as one } from '../../nitro/nitro.mjs';
import { i as isNonEmptyString, b as badRequest } from '../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const MAX_PAGES = 40;
const MAX_LINES = 400;
const index_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const body = await readBody(event);
  const lines = (_a = body.lines) != null ? _a : [];
  const pageFileIds = (_b = body.pageFileIds) != null ? _b : [];
  const kind = body.kind === "solo" ? "solo" : "multi";
  if (!isNonEmptyString(body.title)) {
    return badRequest("A title is required");
  }
  if (lines.length === 0 || lines.length > MAX_LINES || pageFileIds.length > MAX_PAGES) {
    return badRequest("Invalid lines or pages");
  }
  if (lines.some((line) => !isNonEmptyString(line.text))) {
    return badRequest("Every line needs text");
  }
  if (kind === "solo" && !isNonEmptyString(body.soloMemberId)) {
    return badRequest("A solo book needs a reader");
  }
  const soloMemberId = kind === "solo" ? (_c = body.soloMemberId) != null ? _c : null : null;
  const db = getDb();
  return db.begin(async (tx) => {
    var _a2;
    const book = one(await tx`
            insert into books (title, kind, solo_member_id, status, image_desc)
            values (${body.title.trim()}, ${kind}, ${soloMemberId}, 'to_record', ${(_a2 = body.imageDesc) != null ? _a2 : ""})
            returning id
        `);
    for (const [position, fileId] of pageFileIds.entries()) {
      await tx`insert into book_pages (book_id, position, file_id) values (${book.id}, ${position}, ${fileId})`;
    }
    for (const [position, line] of lines.entries()) {
      await tx`
                insert into lines (book_id, position, page_index, character, text, member_id)
                values (${book.id}, ${position}, ${line.pageIndex}, ${line.character.trim()}, ${line.text.trim()}, ${soloMemberId})
            `;
    }
    return book;
  });
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
