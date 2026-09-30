import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { l as loadBook } from '../../../_/books.mjs';
import { r as requireParam } from '../../../_/validate.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const _id__get = defineEventHandler((event) => loadBook(requireParam(event, "id")));

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
