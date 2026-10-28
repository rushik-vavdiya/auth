import { hashPassword, verifyPassword } from './password.service.js';

const password = 'Example-Strong-Password-123!';
const hash = await hashPassword(password);

if (hash === password) throw new Error('Password was not hashed');
if (!(await verifyPassword(hash, password))) throw new Error('Correct password failed');
if (await verifyPassword(hash, 'Wrong-Password')) throw new Error('Incorrect password passed');

console.log('Password service tests passed');
