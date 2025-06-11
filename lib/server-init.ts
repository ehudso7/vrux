// Server-side initialization
// This file is imported by API routes to ensure monitoring is initialized

import './monitoring-integration';

// The monitoring integration auto-initializes on import
// This ensures all monitoring systems are ready before handling requests

export const serverInitialized = true;