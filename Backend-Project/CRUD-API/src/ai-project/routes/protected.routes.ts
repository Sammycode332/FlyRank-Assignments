import { Router, Request, Response } from 'express';
import authMiddleware from '../middleware/auth.middleware';

const protectedRouter = Router();

// Apply authMiddleware to every route in this router.
// Any request without a valid Bearer token is rejected BEFORE
// the route handler executes.
protectedRouter.use(authMiddleware);


/* =========================================================
   GET /protected/profile
   =========================================================
   @swagger
   /protected/profile:
     get:
       summary: Get the authenticated user's profile
       tags:
         - Protected
       security:
         - bearerAuth: []
       responses:
         '200':
           description: Returns the verified user's profile information
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   id:
                     type: string
                   email:
                     type: string
                   created_at:
                     type: string
                   email_confirmed_at:
                     type: string
         '401':
           description: Missing or invalid token
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
   ========================================================= */
protectedRouter.get('/profile', (req: Request, res: Response) => {

  // req.user is guaranteed to be set by authMiddleware above
  const user = req.user!;

  res.status(200).json({
    id:                 user.id,
    email:              user.email,
    created_at:         user.created_at,
    email_confirmed_at: user.email_confirmed_at,
    role:               user.role,
    last_sign_in_at:    user.last_sign_in_at,
  });
});


/* =========================================================
   GET /protected/dashboard
   =========================================================
   @swagger
   /protected/dashboard:
     get:
       summary: Get the authenticated user's dashboard
       tags:
         - Protected
       security:
         - bearerAuth: []
       responses:
         '200':
           description: Returns a personalised dashboard payload for the user
           content:
             application/json:
               schema:
                 type: object
                 properties:
                   message:
                     type: string
                   user:
                     type: object
                     properties:
                       id:
                         type: string
                       email:
                         type: string
         '401':
           description: Missing or invalid token
           content:
             application/json:
               schema:
                 $ref: '#/components/schemas/ErrorResponse'
   ========================================================= */
protectedRouter.get('/dashboard', (req: Request, res: Response) => {

  const user = req.user!;

  res.status(200).json({
    message: `Welcome to your dashboard, ${user.email ?? 'user'}!`,
    user: {
      id:    user.id,
      email: user.email,
    },
    stats: {
      account_created: user.created_at,
      last_login:      user.last_sign_in_at,
    },
  });
});

export default protectedRouter;
