import { calculateLicenseStatus, addMonthlyLicense, addYearlyLicense, setPermanent } from '../src/lib/license/licenseUtils.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error('ASSERTION FAILED: ' + message)
  }
  console.log('✔ ' + message)
}

console.log('=== TESTING LICENSE UTILS ===')

// Test calculateLicenseStatus - PERMANENT
const perm = calculateLicenseStatus('2026-07-15', null)
assert(perm.status === 'PERMANENT', 'Permanent status is PERMANENT')
assert(perm.daysRemaining === 99999, 'Permanent daysRemaining is 99999')
assert(perm.isExpired === false, 'Permanent is not expired')

// Test calculateLicenseStatus - ACTIVE (> 7 days)
const active = calculateLicenseStatus('2026-07-15', '2026-07-28')
assert(active.status === 'ACTIVE', 'July 15 with July 28 expiry is ACTIVE')
assert(active.daysRemaining === 13, 'daysRemaining is 13')
assert(active.isExpired === false, 'isExpired is false')

// Test calculateLicenseStatus - WARNING (<= 7 days)
const warn = calculateLicenseStatus('2026-07-25', '2026-07-28')
assert(warn.status === 'WARNING', 'July 25 with July 28 expiry is WARNING')
assert(warn.daysRemaining === 3, 'daysRemaining is 3')
assert(warn.isWarning === true, 'isWarning is true')

// Test calculateLicenseStatus - GRACE (1-3 days past)
const grace = calculateLicenseStatus('2026-07-30', '2026-07-28')
assert(grace.status === 'GRACE', 'July 30 with July 28 expiry is GRACE')
assert(grace.daysRemaining === -2, 'daysRemaining is -2')
assert(grace.isGrace === true, 'isGrace is true')
assert(grace.isExpired === true, 'isExpired is true')

// Test calculateLicenseStatus - LOCKED (> 3 days past)
const locked = calculateLicenseStatus('2026-08-05', '2026-07-28')
assert(locked.status === 'LOCKED', 'August 5 with July 28 expiry is LOCKED')
assert(locked.daysRemaining === -8, 'daysRemaining is -8')
assert(locked.isLocked === true, 'isLocked is true')
assert(locked.isExpired === true, 'isExpired is true')

// Test addMonthlyLicense - Still Active (Base is old expires_at)
const newMonthlyActive = addMonthlyLicense('2026-07-28', '2026-07-15')
assert(newMonthlyActive.getFullYear() === 2026, 'Year is 2026')
assert(newMonthlyActive.getMonth() === 7, 'Month is August (index 7)')
assert(newMonthlyActive.getDate() === 28, 'Date is 28')

// Test addMonthlyLicense - Already Expired (Base is today)
const newMonthlyExpired = addMonthlyLicense('2026-07-28', '2026-07-30')
assert(newMonthlyExpired.getFullYear() === 2026, 'Year is 2026')
assert(newMonthlyExpired.getMonth() === 7, 'Month is August (index 7)')
assert(newMonthlyExpired.getDate() === 28, 'Date is 28')

// Test addYearlyLicense - Still Active
const newYearlyActive = addYearlyLicense('2026-07-28', '2026-07-15')
assert(newYearlyActive.getFullYear() === 2027, 'Year is 2027')
assert(newYearlyActive.getMonth() === 6, 'Month is July (index 6)')
assert(newYearlyActive.getDate() === 28, 'Date is 28')

// Test setPermanent
assert(setPermanent() === null, 'setPermanent returns null')

console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===')
