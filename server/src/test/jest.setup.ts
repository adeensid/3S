import { jest } from '@jest/globals';

jest.mock('sanitize-html', () => ({
  __esModule: true,
  default: (value: string) => value,
}));
