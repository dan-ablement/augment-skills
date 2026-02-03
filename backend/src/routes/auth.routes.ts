import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { appConfig } from '../config/app.config';
import { oauthConfig, isOAuthConfigured } from '../config/oauth.config';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger.config';
import { badRequest, unauthorized } from '../middleware/error.middleware';

const router = Router();

// Configure Passport Google Strategy (only if OAuth is configured)
if (isOAuthConfigured()) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: oauthConfig.google.clientID,
        clientSecret: oauthConfig.google.clientSecret,
        callbackURL: oauthConfig.google.callbackURL,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          // Check if user is in whitelist
          if (!authService.isUserAllowed(email)) {
            logger.warn(`OAuth login rejected for unauthorized user: ${email}`);
            return done(null, false);
          }

          // User is allowed
          const user = {
            id: profile.id,
            email: email,
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            role: 'admin', // All whitelisted users are admins
            authMethod: 'google' as const,
          };

          logger.info(`OAuth login successful for: ${email}`);
          return done(null, user);
        } catch (error) {
          logger.error('OAuth error:', error);
          return done(error);
        }
      }
    )
  );

  // Serialize user to session
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

/**
 * GET /api/v1/auth/google
 * Initiate Google OAuth flow
 */
router.get('/google', (req: Request, res: Response, next: NextFunction): void => {
  if (!isOAuthConfigured()) {
    res.status(503).json({
      error: 'Google OAuth is not configured',
      message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET',
    });
    return;
  }

  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

/**
 * GET /api/v1/auth/google/callback
 * Handle Google OAuth callback
 */
router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    if (!isOAuthConfigured()) {
      return res.redirect('/login?error=oauth_not_configured');
    }

    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      if (err) {
        logger.error('OAuth callback error:', err);
        return res.redirect('/login?error=oauth_error');
      }

      if (!user) {
        logger.warn('OAuth callback: user not authorized');
        return res.redirect('/login?error=not_authorized');
      }

      // Set session
      req.session.isAuthenticated = true;
      req.session.user = user;

      req.session.save((saveErr) => {
        if (saveErr) {
          logger.error('Session save error:', saveErr);
          return res.redirect('/login?error=session_error');
        }

        logger.info(`User logged in via OAuth: ${user.email}`);
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
);

/**
 * POST /api/v1/auth/login
 * Login with username and password (admin fallback)
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return next(badRequest('Username and password are required'));
    }

    // Check if we should use hashed password (production) or plain text (development)
    const useHashedPassword = !!process.env.ADMIN_PASSWORD_HASH;
    const expectedPassword = useHashedPassword
      ? process.env.ADMIN_PASSWORD_HASH!
      : appConfig.auth.adminPassword;

    const isValid = await authService.validateAdminCredentials(
      username,
      password,
      appConfig.auth.adminUsername,
      expectedPassword,
      useHashedPassword
    );

    if (!isValid) {
      return next(unauthorized('Invalid credentials'));
    }

    // Set session
    req.session.isAuthenticated = true;
    req.session.user = {
      username,
      role: 'admin',
      authMethod: 'admin',
    };

    // Explicitly save the session to ensure cookie is sent
    req.session.save((saveErr) => {
      if (saveErr) {
        logger.error('Session save error:', saveErr);
        return next(saveErr);
      }

      logger.info(`Admin user logged in: ${username}`);

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          username,
          role: 'admin',
          authMethod: 'admin',
        },
      });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout current user
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.session.user;
    const identifier = user?.email || user?.username || 'unknown';

    req.session.destroy((err) => {
      if (err) {
        logger.error('Error destroying session:', err);
        return next(err);
      }

      res.clearCookie('connect.sid');
      logger.info(`User logged out: ${identifier}`);
      res.json({ success: true, message: 'Logout successful' });
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', (req: Request, res: Response) => {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    res.json({
      isAuthenticated: true,
      user: req.session.user,
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null,
    });
  }
});

/**
 * GET /api/v1/auth/oauth-status
 * Check if OAuth is configured
 */
router.get('/oauth-status', (req: Request, res: Response) => {
  res.json({
    configured: isOAuthConfigured(),
  });
});

export default router;

