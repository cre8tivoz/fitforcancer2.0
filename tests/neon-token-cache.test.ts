import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '@neondatabase/auth';

describe('Neon token request after session lookup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fetches a JWT instead of reusing the cached session response', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith('/get-session')) return Response.json({ session: { token: 'opaque-session' }, user: { email: 'owner@example.test' } });
      if (path.endsWith('/token')) return Response.json({ token: 'signed-jwt' });
      throw new Error(`Unexpected request: ${path}`);
    });
    vi.stubGlobal('fetch', fetchMock);
    const client = createAuthClient('https://app.example.test/api/auth');
    await client.getSession({ query: {} });
    const cached = await client.token({ query: {} });
    expect(cached.data?.token).toBeUndefined();
    const result = await client.token({ query: {}, fetchOptions: { headers: { 'X-Force-Fetch': 'true' } } });
    expect(result.data?.token).toBe('signed-jwt');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
