import { sanitizeAttachmentFilename } from './safeFilename.js';

describe('sanitizeAttachmentFilename', () => {
  it('strips path separators and reserved device names', () => {
    expect(sanitizeAttachmentFilename('../CON/log.txt')).toBe('_CON_log.txt');
    expect(sanitizeAttachmentFilename('CON.txt')).toBe('file_CON.txt');
  });

  it('falls back when the name is empty', () => {
    expect(sanitizeAttachmentFilename('   ')).toBe('attachment');
  });
});
