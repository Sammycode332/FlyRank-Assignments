import { User } from '@supabase/supabase-js';

/* -------------------------------------------------------
   Extend Express's Request interface so that the auth
   middleware can attach the verified Supabase user and the
   raw Bearer token to every incoming request object.
   ------------------------------------------------------- */
declare global {
  namespace Express {
    interface Request {
      /** The verified Supabase user – set by authMiddleware */
      user?: User;
      /** The raw JWT that was extracted from the Authorization header */
      token?: string;
    }
  }
}

export {};
