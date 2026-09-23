export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'AI Auth API',
    version: '2.0.0',
    description: `## Secure Auth API + Real AI Routes
Built with **Express · TypeScript · Supabase Auth · Groq / Gemini**

### How to test:
1. Under **Auth**, open **POST /auth/signup** → click **Try it out** → enter your email & password → click **Execute**.
2. Open **POST /auth/login** → click **Try it out** → enter your credentials → click **Execute**.
3. Copy the \`access_token\` from the response.
4. Click the 🔒 **Authorize** button at the top right, paste the token, and click **Authorize**.
5. Test any of the **AI** routes below!`,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access_token from POST /auth/login',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid credentials or request' },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Signup, Login, Refresh token, Logout' },
    { name: 'AI', description: 'AI features: Chat, Password Analysis, Code Review, Summarize, Bio, Translate, Tip' },
    { name: 'Protected', description: 'Protected user profile & dashboard' },
    { name: 'General', description: 'Server health and system status' },
  ],
  paths: {
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user account',
        description: 'Creates a new user in Supabase Auth. Use a valid email domain (e.g. @gmail.com).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'testuser@gmail.com' },
                  password: { type: 'string', example: 'P@ssword123!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Account created successfully' },
          '400': { description: 'Missing fields or validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with email & password',
        description: 'Authenticates against Supabase and returns an access_token (JWT) and a refresh_token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'testuser@gmail.com' },
                  password: { type: 'string', example: 'P@ssword123!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful, returns tokens' },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh an expired access token',
        description: 'Exchange a long-lived refresh_token for a fresh access_token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refresh_token'],
                properties: {
                  refresh_token: { type: 'string', example: 'your_refresh_token_here' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Token refreshed successfully' },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out current session',
        security: [{ bearerAuth: [] }],
        responses: {
          '204': { description: 'Successfully logged out' },
          '401': { description: 'Missing or invalid token' },
        },
      },
    },
    '/ai/analyze-password': {
      post: {
        tags: ['AI'],
        summary: 'Analyze password strength with AI (PUBLIC - No login required)',
        description: 'Audits password entropy, patterns, and complexity, returning score, strength, feedback, and verdict.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['password'],
                properties: {
                  password: { type: 'string', example: 'P@ssw0rdSecure2026!' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Analysis report returned' },
          '400': { description: 'Password required' },
        },
      },
    },
    '/ai/chat': {
      post: {
        tags: ['AI'],
        summary: 'Chat with AI (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Explain how JWT authentication works in 2 sentences.' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'AI reply generated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/ai/code-review': {
      post: {
        tags: ['AI'],
        summary: 'AI code review & suggestions (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: {
                  code: { type: 'string', example: 'function add(a, b) { return a + b; }' },
                  language: { type: 'string', example: 'javascript' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Code review suggestions and quality score' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/ai/summarize': {
      post: {
        tags: ['AI'],
        summary: 'Summarize text with AI (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: {
                    type: 'string',
                    example: 'Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser. Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Concise summary' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/ai/generate-bio': {
      post: {
        tags: ['AI'],
        summary: 'Generate a professional bio (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Sam' },
                  role: { type: 'string', example: 'Backend TypeScript Developer' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Generated professional bio' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/ai/translate': {
      post: {
        tags: ['AI'],
        summary: 'Translate text to any language (Protected)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['text', 'targetLanguage'],
                properties: {
                  text: { type: 'string', example: 'Hello, welcome to our application!' },
                  targetLanguage: { type: 'string', example: 'French' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Translated text' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/ai/tip': {
      get: {
        tags: ['AI'],
        summary: 'Get a random security or engineering tip (Protected)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Curated AI engineering tip' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/protected/profile': {
      get: {
        tags: ['Protected'],
        summary: 'Get logged-in user profile (Protected)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User profile details from Supabase' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/protected/dashboard': {
      get: {
        tags: ['Protected'],
        summary: 'Get personalized dashboard statistics (Protected)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'User dashboard overview' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['General'],
        summary: 'Check server health',
        responses: {
          '200': { description: 'Server is healthy' },
        },
      },
    },
    '/': {
      get: {
        tags: ['General'],
        summary: 'Root API directory and route map',
        responses: {
          '200': { description: 'API info' },
        },
      },
    },
  },
};
