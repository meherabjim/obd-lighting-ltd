/** Print a bcrypt hash for a password:  node scripts/hash-password.js "mypassword" */
import bcrypt from 'bcryptjs';
const pw = process.argv[2];
if (!pw) { console.error('Usage: node scripts/hash-password.js "your password"'); process.exit(1); }
console.log(await bcrypt.hash(pw, 10));
