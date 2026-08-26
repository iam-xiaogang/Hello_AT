// Base64 编解码（微信小程序运行环境没有 btoa/atob，这里自行实现，支持 UTF-8）。
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8ToBytes(str) {
  const bytes = [];
  for (const ch of unescape(encodeURIComponent(str))) bytes.push(ch.charCodeAt(0));
  return bytes;
}

function bytesToUtf8(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return decodeURIComponent(escape(bin));
}

function encode(str) {
  const bytes = utf8ToBytes(str);
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = bytes[i + 1];
    const b3 = bytes[i + 2];
    out += CHARS[b1 >> 2];
    out += CHARS[((b1 & 3) << 4) | (b2 === undefined ? 0 : b2 >> 4)];
    out += b2 === undefined ? "=" : CHARS[((b2 & 15) << 2) | (b3 === undefined ? 0 : b3 >> 6)];
    out += b3 === undefined ? "=" : CHARS[b3 & 63];
  }
  return out;
}

function decode(str) {
  const map = {};
  for (let i = 0; i < CHARS.length; i++) map[CHARS[i]] = i;
  const bytes = [];
  const clean = str.replace(/[^A-Za-z0-9+/=]/g, "");
  for (let i = 0; i < clean.length; i += 4) {
    const c1 = map[clean[i]];
    const c2 = map[clean[i + 1]];
    const c3 = map[clean[i + 2]];
    const c4 = map[clean[i + 3]];
    if (c1 === undefined || c2 === undefined) throw new Error("invalid base64");
    bytes.push((c1 << 2) | (c2 >> 4));
    if (c3 !== undefined) bytes.push(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 !== undefined) bytes.push(((c3 & 3) << 6) | c4);
  }
  return bytesToUtf8(bytes);
}

module.exports = { encode, decode };
