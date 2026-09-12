/**
 * Use autocomplete to get a list of available regions.
 * @type {import('@remotion/lambda').AwsRegion}
 */
export const REGION = "us-east-1";

// Keep the deployed Remotion site aligned with the backend render route and
// REMOTION_SITE_URL. A stale site here makes Lambda execute an older bundle.
export const SITE_NAME = "procedural-max-studio";
export const RAM = 3008;
export const DISK = 10240;
export const TIMEOUT = 240;
