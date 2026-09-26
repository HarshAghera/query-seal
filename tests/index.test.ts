import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from '../src/index.js';

describe('url-crypto', () => {
  const secret = 'my-super-secret-key';

  it('should encrypt and decrypt data', () => {
    const original = {
      userId: 123,
      orderId: 456,
      role: 'customer',
    };

    const encrypted = encrypt(original, secret);
    const decrypted = decrypt(encrypted, secret);

    expect(decrypted).toEqual(original);
  });

  it('should generate different tokens for the same data', () => {
    const data = {
      userId: 123,
    };

    const token1 = encrypt(data, secret);
    const token2 = encrypt(data, secret);

    expect(token1).not.toBe(token2);
  });

  it('should fail with the wrong secret', () => {
    const data = {
      userId: 123,
    };

    const encrypted = encrypt(data, secret);

    expect(() => {
      decrypt(encrypted, 'wrong-secret');
    }).toThrow();
  });

  it('should detect tampered data', () => {
    const data = {
      userId: 123,
    };

    const encrypted = encrypt(data, secret);

    // Change one character
    const lastChar = encrypted.at(-1);
    const replacement = lastChar === 'A' ? 'B' : 'A';

    const tampered = encrypted.slice(0, -1) + replacement;

    expect(() => {
      decrypt(tampered, secret);
    }).toThrow();
  });

  it('should handle nested objects and arrays', () => {
    const original = {
      user: {
        id: 123,
        name: 'Harsh',
      },
      roles: ['user', 'customer'],
      settings: {
        darkMode: true,
      },
    };

    const encrypted = encrypt(original, secret);
    const decrypted = decrypt(encrypted, secret);

    expect(decrypted).toEqual(original);
  });
});
