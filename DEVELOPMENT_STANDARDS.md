# Development Standards for Augment Skills

This document outlines the development standards and best practices for the Augment Skills project.

---

## 🔐 Secrets Management

### Rule: ALL secrets must be stored in `.env` files

**Never hardcode secrets in code.** All sensitive information must be externalized.

### What qualifies as a secret:
- Database passwords
- API keys (Google Sheets API, etc.)
- Session secrets
- Admin passwords
- OAuth client secrets
- Service account credentials
- Encryption keys
- Any authentication tokens

### Implementation:

**✅ CORRECT:**
```javascript
// config/database.js
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
};
```

**❌ INCORRECT:**
```javascript
// NEVER do this
const dbConfig = {
  host: 'localhost',
  password: 'mypassword123',  // WRONG!
};
```

### Required files:
- **`.env`** - Local secrets (NEVER commit to Git)
- **`.env.example`** - Template with placeholder values (commit to Git)
- **`.gitignore`** - Must include `.env` and `*.key.json`

---

## ⚙️ Configuration Management

### Rule: ALL tunable parameters must be in configuration files

**Never hardcode configuration values inline.** If it might change between environments or deployments, it belongs in a config file.

### What qualifies as configuration:
- Port numbers
- Timeout values
- Rate limits
- Pagination sizes
- Color thresholds (e.g., red: 0-74%, yellow: 75-84%)
- File upload limits
- Cache TTL values
- Feature flags
- Email templates
- UI text/labels that might change

### Implementation:

**✅ CORRECT:**
```javascript
// config/app.config.js
module.exports = {
  server: {
    port: process.env.PORT || 3000,
    timeout: 30000,
  },
  heatmap: {
    colors: {
      proficient: { min: 85, max: 100, color: 'green' },
      approaching: { min: 75, max: 84, color: 'yellow' },
      notProficient: { min: 0, max: 74, color: 'red' },
    },
  },
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
  },
  pagination: {
    defaultPageSize: 50,
    maxPageSize: 100,
  },
};

// In your code
const config = require('./config/app.config');
if (score >= config.heatmap.colors.proficient.min) {
  return 'green';
}
```

**❌ INCORRECT:**
```javascript
// NEVER do this
if (score >= 85) {  // WRONG! Magic number
  return 'green';
}
```

### Configuration file structure:
```
config/
  ├── app.config.js       # Application settings
  ├── database.config.js  # Database connection
  ├── google.config.js    # Google API settings
  └── index.js            # Export all configs
```

---

## 📚 Documentation Requirements

### Rule: Document EVERYTHING

All code must be accompanied by comprehensive documentation.

### Required documentation:

#### 1. **Feature Documentation**
Every feature must have:
- **Purpose**: What problem does it solve?
- **User stories**: Who uses it and why?
- **API/Interface**: How to use it
- **Examples**: Code samples
- **Edge cases**: Known limitations

**Location**: `docs/features/FEATURE_NAME.md`

#### 2. **Architecture Documentation**
- System architecture diagrams
- Database schema with relationships
- API endpoints and data flow
- Integration points
- Deployment architecture

**Location**: `docs/architecture/`

#### 3. **How-To Guides**
Step-by-step guides for common tasks:
- Setting up local development
- Deploying to GCP
- Adding a new data import source
- Troubleshooting common issues
- Running tests

**Location**: `docs/how-to/`

#### 4. **Code Documentation**
- **JSDoc/docstrings** for all functions
- **Inline comments** for complex logic
- **README** in each major directory

**Example:**
```javascript
/**
 * Calculates the proficiency color based on score
 * @param {number} score - The skill score (0-100)
 * @returns {string} Color code: 'green', 'yellow', 'red', or 'gray'
 * @throws {Error} If score is outside 0-100 range
 */
function getProficiencyColor(score) {
  if (score < 0 || score > 100) {
    throw new Error('Score must be between 0 and 100');
  }
  // Implementation...
}
```

#### 5. **API Documentation**
- All endpoints documented
- Request/response examples
- Error codes and messages
- Authentication requirements

**Location**: `docs/api/`

---

## 🧪 Testing Requirements

### Rule: Write unit tests for ALL code and test BEFORE committing

### Testing workflow:

1. **Write tests FIRST** (TDD approach preferred)
2. **Run tests locally** before committing
3. **All tests must pass** before commit
4. **Keep tests** for PR review and CI/CD

### Test coverage requirements:
- **Minimum 80% code coverage**
- **100% coverage** for critical paths (auth, data import, calculations)
- Test happy paths AND edge cases
- Test error handling

### Test structure:
```
tests/
  ├── unit/              # Unit tests
  │   ├── services/
  │   ├── utils/
  │   └── models/
  ├── integration/       # Integration tests
  │   ├── api/
  │   └── database/
  └── fixtures/          # Test data
      └── sample-data.csv
```

### Example unit test:
```javascript
// tests/unit/utils/proficiency.test.js
const { getProficiencyColor } = require('../../../src/utils/proficiency');

describe('getProficiencyColor', () => {
  test('returns green for proficient scores (85-100)', () => {
    expect(getProficiencyColor(85)).toBe('green');
    expect(getProficiencyColor(92)).toBe('green');
    expect(getProficiencyColor(100)).toBe('green');
  });

  test('returns yellow for approaching scores (75-84)', () => {
    expect(getProficiencyColor(75)).toBe('yellow');
    expect(getProficiencyColor(80)).toBe('yellow');
    expect(getProficiencyColor(84)).toBe('yellow');
  });

  test('returns red for not proficient scores (0-74)', () => {
    expect(getProficiencyColor(0)).toBe('red');
    expect(getProficiencyColor(50)).toBe('red');
    expect(getProficiencyColor(74)).toBe('red');
  });

  test('throws error for invalid scores', () => {
    expect(() => getProficiencyColor(-1)).toThrow();
    expect(() => getProficiencyColor(101)).toThrow();
  });
});
```

### Pre-commit checklist:
```bash
# 1. Run linter
npm run lint

# 2. Run all tests
npm test

# 3. Check coverage
npm run test:coverage

# 4. Verify all tests pass
# Only commit if all tests are green ✅
```

### Test commands (add to package.json):
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration"
  }
}
```

---

## 📋 Summary Checklist

Before committing ANY code, verify:

- [ ] **No secrets in code** - All in `.env`
- [ ] **No magic numbers** - All in config files
- [ ] **Feature documented** - In `docs/features/`
- [ ] **Code documented** - JSDoc/docstrings added
- [ ] **Tests written** - Unit tests for all functions
- [ ] **Tests pass** - `npm test` shows all green
- [ ] **Coverage acceptable** - Minimum 80%
- [ ] **How-to updated** - If adding new capability
- [ ] **Architecture updated** - If changing structure

---

## 🚫 Common Violations to Avoid

### ❌ Hardcoded secrets
```javascript
const apiKey = 'AIzaSyD...';  // NEVER!
```

### ❌ Magic numbers
```javascript
if (score >= 85) { ... }  // NEVER!
```

### ❌ Undocumented functions
```javascript
function calc(x, y) { ... }  // NEVER!
```

### ❌ Untested code
```javascript
// No tests written - NEVER commit!
```

### ❌ Inline configuration
```javascript
app.listen(3000);  // NEVER! Use config
```

---

**These standards are mandatory for all code in this project.**

