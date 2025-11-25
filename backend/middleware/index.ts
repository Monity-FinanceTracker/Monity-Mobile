// This file will export all middleware
import * as auth from './auth';
import * as validation from './validation';
import * as encryption from './encryption';
import * as errorHandler from './errorHandler';
// import * as rateLimiter from './rateLimiter'; // Rate limiting removed to fix 502 errors

export default (supabase: any) => ({
    auth: auth,
    validation: validation,
    encryption: encryption,
    errorHandler: errorHandler,
    // rateLimiter: rateLimiter
});
