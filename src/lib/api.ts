/**
 * Transform Snowflake UPPER_SNAKE_CASE keys to camelCase.
 * Works recursively on objects and arrays.
 */

function snakeToCamel(str: string): string {
  return str.toLowerCase().replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function transformKeys<T = Record<string, unknown>>(
  data: unknown
): T {
  if (Array.isArray(data)) {
    return data.map(item => transformKeys(item)) as T;
  }
  if (data !== null && typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      result[snakeToCamel(key)] = value;
    }
    return result as T;
  }
  return data as T;
}

/**
 * Fetch data from an API route with automatic key transformation.
 */
export async function fetchApi<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  return json as T;
}
