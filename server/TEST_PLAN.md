# Backend Unit Test Plan

## Status: ✅ Implemented (23 tests passing)

Run tests: `npm test` in `server/` directory.

---

## Test Framework
- **Jest** + **ts-jest** for TypeScript support
- **Configuration**: `jest.config.cjs` with `moduleNameMapper` for ESM compatibility

---

## 1. Services (8 tests)

### `src/services/otp.service.ts` ✅
| Test | Status |
|------|--------|
| Generate OTP returns 6-digit string | ✅ |
| Create OTP saves to database | ✅ |
| Verify OTP returns true for valid code | ✅ |
| Verify OTP returns false for invalid code | ✅ |

### `src/services/email.service.ts` ✅
| Test | Status |
|------|--------|
| Send OTP email | ✅ |
| Send Vendor Verification Request | ✅ |
| Send Warranty Confirmation | ✅ |
| Include UID for seat-cover products | ✅ |

---

## 2. Controllers (10 tests)

### `src/controllers/auth.controller.ts` ✅
| Test | Status |
|------|--------|
| Returns 400 if email/role missing | ✅ |
| Returns 401 if user not found | ✅ |

### `src/controllers/warranty.controller.ts` ✅
| Test | Status |
|------|--------|
| Returns 400 if required fields missing | ✅ |
| Creates warranty successfully for seat-cover | ✅ |
| Returns paginated warranties for customer | ✅ |

### `src/controllers/admin.controller.ts` ✅
| Test | Status |
|------|--------|
| Returns dashboard statistics | ✅ |
| Returns 404 if vendor not found | ✅ |

### `src/controllers/vendor.controller.ts` ✅
| Test | Status |
|------|--------|
| Returns 401 if user not authenticated (getProfile) | ✅ |
| Returns 404 if vendor details not found | ✅ |
| Returns 401 if user not authenticated (getManpower) | ✅ |

---

## 3. Middleware (5 tests)

### `src/middleware/auth.ts` ✅
| Test | Status |
|------|--------|
| Returns 401 if no token provided | ✅ |
| Returns 403 if token is invalid | ✅ |
| Calls next() and attaches user if token valid | ✅ |
| Returns 403 if user lacks required role | ✅ |
| Calls next() if user has required role | ✅ |

---

## Summary

| Category | Tests | Status |
|----------|-------|--------|
| Services | 8 | ✅ |
| Controllers | 10 | ✅ |
| Middleware | 5 | ✅ |
| **Total** | **23** | **✅ All Passing** |
