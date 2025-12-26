import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash('Poncholove20!!', 10);
console.log('---HASH_START---');
console.log(hash);
console.log('---HASH_END---');
