export function validateImageMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) {
    return false;
  }

  const jpeg = buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (jpeg) {
    return true;
  }

  const png = buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  if (png) {
    return true;
  }

  const webpRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
  const webpType = buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  if (webpRiff && webpType) {
    return true;
  }

  return false;
}
