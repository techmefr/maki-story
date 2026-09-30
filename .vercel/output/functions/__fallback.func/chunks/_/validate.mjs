import { j as getRouterParam, c as createError } from '../nitro/nitro.mjs';

const VOICE_COLORS = [
  { id: "coral", hex: "#FF7A6B", hexLight: "#FF968A" },
  { id: "sun", hex: "#FFC940", hexLight: "#FFD76E" },
  { id: "mint", hex: "#4CD4A8", hexLight: "#72DEBB" },
  { id: "sky", hex: "#6BB6FF", hexLight: "#8CC6FF" },
  { id: "grape", hex: "#B08CFF", hexLight: "#C3A6FF" },
  { id: "pink", hex: "#FF94C8", hexLight: "#FFAED5" }
];
const MAX_MESSAGES_PER_CONVERSATION = 5;

const MEMBER_ROLES = ["parent", "relative", "child"];
const badRequest = (message) => {
  throw createError({ statusCode: 400, statusMessage: message });
};
const notFound = (message) => {
  throw createError({ statusCode: 404, statusMessage: message });
};
const isVoiceColor = (value) => {
  return VOICE_COLORS.some((color) => color.id === value);
};
const isMemberRole = (value) => {
  return MEMBER_ROLES.includes(value);
};
const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim().length > 0;
};
const requireParam = (event, name) => {
  const value = getRouterParam(event, name);
  return value != null ? value : badRequest(`Missing ${name}`);
};

export { MAX_MESSAGES_PER_CONVERSATION as M, isMemberRole as a, badRequest as b, isVoiceColor as c, isNonEmptyString as i, notFound as n, requireParam as r };
//# sourceMappingURL=validate.mjs.map
