import { AccessTokenStore } from './access-token.store';

describe('AccessTokenStore', () => {
  it('starts with no token', () => {
    const store = new AccessTokenStore();
    expect(store.value()).toBeNull();
  });

  it('reflects a set token', () => {
    const store = new AccessTokenStore();
    store.set('abc123');
    expect(store.value()).toBe('abc123');
  });

  it('reflects a token being cleared', () => {
    const store = new AccessTokenStore();
    store.set('abc123');
    store.set(null);
    expect(store.value()).toBeNull();
  });
});
