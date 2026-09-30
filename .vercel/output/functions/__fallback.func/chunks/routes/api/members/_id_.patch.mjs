import { d as defineEventHandler, r as readBody, g as getDb, o as one } from '../../../nitro/nitro.mjs';
import { r as requireParam, i as isNonEmptyString, b as badRequest, a as isMemberRole, c as isVoiceColor, n as notFound } from '../../../_/validate.mjs';
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

const _id__patch = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const id = requireParam(event, "id");
  const body = await readBody(event);
  if (body.name !== void 0 && !isNonEmptyString(body.name)) {
    return badRequest("Invalid name");
  }
  if (body.role !== void 0 && !isMemberRole(body.role)) {
    return badRequest("Invalid role");
  }
  if (body.color !== void 0 && !isVoiceColor(body.color)) {
    return badRequest("Invalid color");
  }
  const db = getDb();
  const [current] = await db`
        select id, name, role, color, photo_file_id from members where id = ${id}
    `;
  if (!current) {
    return notFound("Member not found");
  }
  const next = {
    name: (_b = (_a = body.name) == null ? void 0 : _a.trim()) != null ? _b : current.name,
    role: (_c = body.role) != null ? _c : current.role,
    color: (_d = body.color) != null ? _d : current.color,
    photoFileId: body.photoFileId === void 0 ? current.photoFileId : body.photoFileId
  };
  return one(await db`
        update members
        set name = ${next.name}, role = ${next.role}, color = ${next.color}, photo_file_id = ${next.photoFileId}
        where id = ${id}
        returning id, name, role, color, photo_file_id
    `);
});

export { _id__patch as default };
//# sourceMappingURL=_id_.patch.mjs.map
