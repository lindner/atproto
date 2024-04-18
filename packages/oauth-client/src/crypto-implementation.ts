import { Key } from '@atproto-labs/jwk'

export type DigestAlgorithm = {
  name: 'sha256' | 'sha384' | 'sha512'
}

export type { Key }

export interface CryptoImplementation {
  createKey(algs: string[]): Promise<Key>
  getRandomValues: (length: number) => Uint8Array | PromiseLike<Uint8Array>
  digest: (
    bytes: Uint8Array,
    algorithm: DigestAlgorithm,
  ) => Uint8Array | PromiseLike<Uint8Array>
}
