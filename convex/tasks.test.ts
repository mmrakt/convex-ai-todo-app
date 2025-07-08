import { describe, expect, it } from 'vitest';
import { api } from './_generated/api';
import schema from './schema';

describe('tasks', () => {
  it('should pass basic schema validation', () => {
    expect(schema).toBeDefined();
    expect(api.tasks).toBeDefined();
  });
});
