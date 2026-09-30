import { d as defineEventHandler, h as hasSession } from '../../../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'postgres';

const me_get = defineEventHandler((event) => {
  return { isSignedIn: hasSession(event) };
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
