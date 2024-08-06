/* 
 * This function parses string env vars safely with types
 * and defaults.
 */
export function parseEnv<T>(key: string, defaultValue: T): T {
    const value = process.env[key];
    if (value === undefined) {
        return defaultValue;
    }

    // Switch based on T template type
    switch (typeof defaultValue) {
        case 'number':
            return parseInt(value) as unknown as T;
        case 'boolean':
            return (value === 'true') as unknown as T;
        default:
            return value as unknown as T;
    }
}