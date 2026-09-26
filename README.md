# query-seal

Encrypt and decrypt JSON data into URL-safe tokens using **AES-256-GCM**.

Useful when you want to pass data through a URL without exposing the actual values in plain text.

## Installation

```bash
npm install query-seal
```

## Using Encrypted Data in a URL

Suppose you want to send these values through a URL:

```ts
const data = {
  userId: 12345,
  orderId: 98765,
};
```

Without encryption, you might have:

```text
https://example.com/order?userId=12345&orderId=98765
```

The values are visible directly in the URL.

### 1. Encrypt the data

```ts
import { encrypt } from 'query-seal';

const secret = process.env.URL_CRYPTO_SECRET!;

const data = {
  userId: 12345,
  orderId: 98765,
};

const token = encrypt(data, secret);

console.log(token);
```

The result will look something like:

```text
hB7Y4v6q5XjLx9...
```

The token is different every time because a random IV is generated for every encryption.

### 2. Create the URL

You can put the encrypted token into a query parameter:

```ts
const url = `https://example.com/order?data=${encodeURIComponent(token)}`;

console.log(url);
```

Result:

```text
https://example.com/order?data=hB7Y4v6q5XjLx9...
```

The user can see the `data` parameter, but the original values are not directly visible.

The complete flow is:

```text
Original data
     ↓
{ userId: 12345, orderId: 98765 }
     ↓
encrypt()
     ↓
Encrypted token
     ↓
https://example.com/order?data=ENCRYPTED_TOKEN
```

---

## 3. Read the encrypted value from the URL

On the receiving side, get the `data` query parameter.

For example, in a Node.js server:

```ts
const url = new URL('https://example.com/order?data=hB7Y4v6q5XjLx9...');

const token = url.searchParams.get('data');

if (!token) {
  throw new Error('Missing data parameter');
}
```

### 4. Decrypt the URL value

```ts
import { decrypt } from 'query-seal';

const secret = process.env.URL_CRYPTO_SECRET!;

const data = decrypt<{
  userId: number;
  orderId: number;
}>(token, secret);

console.log(data);
```

Result:

```ts
{
  userId: 12345,
  orderId: 98765
}
```

So the complete process is:

```text
                 SENDER
                    │
                    ▼
        ┌─────────────────────┐
        │ { userId, orderId } │
        └──────────┬──────────┘
                   │
                   │ encrypt()
                   ▼
          ┌─────────────────┐
          │  Encrypted token │
          └────────┬────────┘
                   │
                   ▼
https://example.com/order?data=ENCRYPTED_TOKEN
                   │
                   │
                   ▼
                 SERVER
                   │
                   │ decrypt()
                   ▼
        ┌─────────────────────┐
        │ { userId, orderId } │
        └─────────────────────┘
```

## Nested Data

You can also encrypt nested objects and arrays:

```ts
const data = {
  user: {
    id: 12345,
    name: 'Harsh',
  },
  order: {
    id: 98765,
    items: ['laptop', 'mouse'],
  },
};

const token = encrypt(data, secret);

const url = `https://example.com/order?data=${encodeURIComponent(token)}`;
```

Later:

```ts
const decrypted = decrypt(token, secret);

console.log(decrypted);
```

Result:

```ts
{
  user: {
    id: 12345,
    name: 'Harsh'
  },
  order: {
    id: 98765,
    items: ['laptop', 'mouse']
  }
}
```

## TypeScript

You can provide a type when decrypting:

```ts
type OrderData = {
  userId: number;
  orderId: number;
};

const token = encrypt<OrderData>(
  {
    userId: 12345,
    orderId: 98765,
  },
  secret,
);

const data = decrypt<OrderData>(token, secret);

console.log(data.orderId);
// 98765
```

## How It Works

```text
Your data
    ↓
JSON serialization
    ↓
AES-256-GCM encryption
    ↓
Base64URL encoding
    ↓
URL query parameter
    ↓
Encrypted URL
```

Decryption reverses the process:

```text
URL query parameter
    ↓
Base64URL decoding
    ↓
AES-256-GCM decryption
    ↓
JSON parsing
    ↓
Original data
```

## Security

`query-seal` uses **AES-256-GCM** for authenticated encryption.

A new random initialization vector (IV) is generated for every encryption operation.

Keep your encryption secret private:

```ts
const secret = process.env.URL_CRYPTO_SECRET!;
```

**Do not put your encryption secret in frontend/browser code.**

The encrypted token should also **not** be considered an authorization mechanism. Your application should still verify that the user is allowed to access the requested resource.

## License

MIT
