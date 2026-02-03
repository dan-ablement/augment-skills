import bcrypt from 'bcrypt';

// Whitelist of allowed OAuth users
const ALLOWED_OAUTH_USERS = [
  'mollie@augmentcode.com',
  'diacono@augmentcode.com',
  'mattarnold@augmentcode.com',
];

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Check if an email is in the OAuth whitelist
   */
  isUserAllowed(email: string): boolean {
    return ALLOWED_OAUTH_USERS.includes(email.toLowerCase().trim());
  }

  /**
   * Get the list of allowed OAuth users
   */
  getAllowedUsers(): string[] {
    return [...ALLOWED_OAUTH_USERS];
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Validate a password against a hash
   */
  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Validate admin credentials
   * For MVP: compares against environment variable
   * In production: should use hashed password from ADMIN_PASSWORD_HASH env var
   */
  async validateAdminCredentials(
    username: string,
    password: string,
    expectedUsername: string,
    expectedPasswordOrHash: string,
    isHashed: boolean = false
  ): Promise<boolean> {
    if (username !== expectedUsername) {
      return false;
    }

    if (isHashed) {
      return this.validatePassword(password, expectedPasswordOrHash);
    }

    // Plain text comparison (development only)
    return password === expectedPasswordOrHash;
  }
}

// Export singleton instance
export const authService = new AuthService();

