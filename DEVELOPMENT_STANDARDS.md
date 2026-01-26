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

---

## 🐍 Python Virtual Environment Management

### Rule: Keep virtual environments OUTSIDE the repository

**Never create virtual environments inside the project directory.** This keeps the repository clean and prevents accidentally committing large dependency files.

### Implementation:

**✅ CORRECT - Centralized virtual environments:**

```bash
# Create a central directory for all virtual environments
mkdir -p ~/.virtualenvs

# Create virtual environment for this project
python -m venv ~/.virtualenvs/augment-skills

# Activate virtual environment
source ~/.virtualenvs/augment-skills/bin/activate  # macOS/Linux
# or
~/.virtualenvs/augment-skills/Scripts/activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

**❌ INCORRECT - Virtual environment in repo:**
```bash
# NEVER do this
python -m venv venv  # Creates venv/ in project directory
python -m venv .venv  # Creates .venv/ in project directory
```

### Recommended tools:

#### Option 1: Manual central directory
```bash
# Add to ~/.bashrc or ~/.zshrc
export WORKON_HOME=~/.virtualenvs

# Create alias for easy activation
alias activate-augment="source ~/.virtualenvs/augment-skills/bin/activate"
```

#### Option 2: virtualenvwrapper (Recommended)
```bash
# Install virtualenvwrapper
pip install virtualenvwrapper

# Add to ~/.bashrc or ~/.zshrc
export WORKON_HOME=~/.virtualenvs
source /usr/local/bin/virtualenvwrapper.sh

# Create virtual environment
mkvirtualenv augment-skills

# Activate (from anywhere)
workon augment-skills

# Deactivate
deactivate
```

#### Option 3: pyenv + pyenv-virtualenv
```bash
# Install pyenv and pyenv-virtualenv
brew install pyenv pyenv-virtualenv

# Create virtual environment
pyenv virtualenv 3.9.0 augment-skills

# Activate
pyenv activate augment-skills
```

### .gitignore must include:
```
# Virtual environments (just in case)
venv/
.venv/
env/
.env/
ENV/
env.bak/
venv.bak/
```

### Documentation requirement:
Every Python project must include setup instructions in README.md:

```markdown
## Python Setup

### Create virtual environment (outside repo)
```bash
python -m venv ~/.virtualenvs/augment-skills
source ~/.virtualenvs/augment-skills/bin/activate
```

### Install dependencies
```bash
pip install -r requirements.txt
```
```

---

## 📊 Logging Standards

### Rule: Implement consistent, structured logging for debugging and monitoring

All applications must use a standardized logging structure with appropriate log levels, context, and formatting.

### Log Levels (use appropriately):

- **DEBUG**: Detailed diagnostic information (development only)
- **INFO**: General informational messages (normal operations)
- **WARNING**: Warning messages (something unexpected but handled)
- **ERROR**: Error messages (something failed but app continues)
- **CRITICAL**: Critical errors (app may crash)

### Implementation:

#### Node.js - Using Winston

**config/logger.config.js:**
```javascript
const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (human-readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Create logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'augment-skills' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    // Write errors to error.log
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
  ],
});

module.exports = logger;
```

**Usage in code:**
```javascript
const logger = require('./config/logger.config');

// Info logging
logger.info('User logged in', { userId: 123, email: 'user@example.com' });

// Error logging with context
logger.error('Failed to import CSV', {
  error: err.message,
  stack: err.stack,
  filename: 'employees.csv',
  userId: req.user.id,
});

// Warning
logger.warn('Large file upload detected', {
  fileSize: fileSize,
  maxSize: config.upload.maxFileSize,
});

// Debug (only in development)
logger.debug('Database query executed', {
  query: sql,
  duration: queryTime,
});
```

#### Python - Using structlog

**config/logger_config.py:**
```python
import logging
import structlog
from pathlib import Path
import os

# Create logs directory
Path('logs').mkdir(exist_ok=True)

# Configure standard logging
logging.basicConfig(
    format="%(message)s",
    level=os.getenv('LOG_LEVEL', 'INFO'),
    handlers=[
        logging.FileHandler('logs/combined.log'),
        logging.StreamHandler(),
    ]
)

# Configure structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer() if os.getenv('NODE_ENV') == 'production'
        else structlog.dev.ConsoleRenderer(),
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

def get_logger(name: str):
    """Get a configured logger instance"""
    return structlog.get_logger(name)
```

**Usage in code:**
```python
from config.logger_config import get_logger

logger = get_logger(__name__)

# Info logging
logger.info('user_logged_in', user_id=123, email='user@example.com')

# Error logging with context
try:
    import_csv(file)
except Exception as e:
    logger.error(
        'csv_import_failed',
        error=str(e),
        filename='employees.csv',
        user_id=user.id,
        exc_info=True
    )

# Warning
logger.warning(
    'large_file_upload',
    file_size=file_size,
    max_size=config.MAX_FILE_SIZE
)

# Debug
logger.debug(
    'database_query',
    query=sql,
    duration=query_time
)
```

### Logging best practices:

#### 1. **Always include context**
```javascript
// ✅ GOOD - Includes context
logger.error('CSV import failed', {
  filename: 'employees.csv',
  rowNumber: 42,
  error: err.message,
  userId: req.user.id,
});

// ❌ BAD - No context
logger.error('Import failed');
```

#### 2. **Use structured logging (key-value pairs)**
```javascript
// ✅ GOOD - Structured
logger.info('Data imported', {
  source: 'google_sheets',
  rowCount: 150,
  duration: 2.3,
});

// ❌ BAD - Unstructured string
logger.info('Imported 150 rows from Google Sheets in 2.3s');
```

#### 3. **Log at appropriate levels**
```javascript
// ✅ GOOD
logger.debug('Cache hit', { key: 'user:123' });  // Development only
logger.info('User logged in', { userId: 123 });  // Normal operation
logger.warn('Rate limit approaching', { current: 95, limit: 100 });  // Unexpected
logger.error('Database connection failed', { error: err });  // Error
logger.critical('Out of memory', { available: 0 });  // Critical

// ❌ BAD - Everything as INFO
logger.info('Cache hit');
logger.info('Database connection failed');
```

#### 4. **Never log secrets**
```javascript
// ✅ GOOD - Secrets redacted
logger.info('API request', {
  url: '/api/sheets',
  apiKey: '***REDACTED***',
});

// ❌ BAD - Logging secrets
logger.info('API request', {
  apiKey: process.env.GOOGLE_API_KEY,  // NEVER!
});
```

#### 5. **Log request/response for APIs**
```javascript
// Middleware for request logging
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('http_request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    });
  });

  next();
});
```

### Log file structure:
```
logs/
  ├── combined.log      # All logs
  ├── error.log         # Errors only
  └── access.log        # HTTP access logs (optional)
```

### Environment configuration (.env):
```bash
# Logging
LOG_LEVEL=info          # debug, info, warn, error, critical
LOG_FORMAT=json         # json or console
LOG_MAX_SIZE=10485760   # 10MB
LOG_MAX_FILES=5         # Keep 5 rotated files
```

### .gitignore must include:
```
# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

### Monitoring integration (Production):

For GCP Cloud Run, logs automatically go to Cloud Logging:

```javascript
// Production logging goes to stdout/stderr
// Cloud Run automatically captures and sends to Cloud Logging
// No file transports needed in production

if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.json(),  // Structured JSON for Cloud Logging
  }));
}
```

### Required dependencies:

**Node.js:**
```bash
npm install winston winston-daily-rotate-file
```

**Python:**
```bash
pip install structlog python-json-logger
```

---

**These standards are mandatory for all code in this project.**

