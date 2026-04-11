/**
 * Next.js getServerSideProps / getStaticProps require JSON-serializable props.
 * `undefined` is invalid; this coerces `undefined` to `null` recursively.
 */
export function serializeJsonSafe<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v === undefined ? null : v))
  ) as T;
}
