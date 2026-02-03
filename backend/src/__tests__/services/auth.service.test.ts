import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('isUserAllowed', () => {
    it('should allow mollie@augmentcode.com', () => {
      expect(authService.isUserAllowed('mollie@augmentcode.com')).toBe(true);
    });

    it('should allow diacono@augmentcode.com', () => {
      expect(authService.isUserAllowed('diacono@augmentcode.com')).toBe(true);
    });

    it('should allow mattarnold@augmentcode.com', () => {
      expect(authService.isUserAllowed('mattarnold@augmentcode.com')).toBe(true);
    });

    it('should reject unauthorized email', () => {
      expect(authService.isUserAllowed('hacker@evil.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(authService.isUserAllowed('')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(authService.isUserAllowed('MOLLIE@AUGMENTCODE.COM')).toBe(true);
      expect(authService.isUserAllowed('Diacono@AugmentCode.com')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(authService.isUserAllowed('  mollie@augmentcode.com  ')).toBe(true);
    });
  });

  describe('getAllowedUsers', () => {
    it('should return all allowed users', () => {
      const users = authService.getAllowedUsers();
      expect(users).toHaveLength(3);
      expect(users).toContain('mollie@augmentcode.com');
      expect(users).toContain('diacono@augmentcode.com');
      expect(users).toContain('mattarnold@augmentcode.com');
    });

    it('should return a copy, not the original array', () => {
      const users1 = authService.getAllowedUsers();
      const users2 = authService.getAllowedUsers();
      expect(users1).not.toBe(users2);
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true); // bcrypt hash prefix
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await authService.hashPassword(password);
      const hash2 = await authService.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.validatePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.validatePassword('wrongPassword', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validateAdminCredentials', () => {
    it('should validate correct plain text credentials', async () => {
      const isValid = await authService.validateAdminCredentials(
        'admin',
        'password123',
        'admin',
        'password123',
        false
      );
      expect(isValid).toBe(true);
    });

    it('should reject wrong username', async () => {
      const isValid = await authService.validateAdminCredentials(
        'wronguser',
        'password123',
        'admin',
        'password123',
        false
      );
      expect(isValid).toBe(false);
    });

    it('should reject wrong password', async () => {
      const isValid = await authService.validateAdminCredentials(
        'admin',
        'wrongpassword',
        'admin',
        'password123',
        false
      );
      expect(isValid).toBe(false);
    });

    it('should validate correct hashed credentials', async () => {
      const password = 'securePassword123';
      const hash = await authService.hashPassword(password);
      
      const isValid = await authService.validateAdminCredentials(
        'admin',
        password,
        'admin',
        hash,
        true
      );
      expect(isValid).toBe(true);
    });

    it('should reject wrong password with hash', async () => {
      const hash = await authService.hashPassword('correctPassword');
      
      const isValid = await authService.validateAdminCredentials(
        'admin',
        'wrongPassword',
        'admin',
        hash,
        true
      );
      expect(isValid).toBe(false);
    });
  });
});

