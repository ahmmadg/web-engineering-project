import { requireRole } from './sessions.js';

var requiredRole = new URL(import.meta.url).searchParams.get('role');
if (!requiredRole) {
    throw new Error('A required role must be specified for this page.');
}

requireRole([requiredRole]);
