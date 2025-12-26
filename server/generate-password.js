import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 Admin Password Hash Generator\n');
console.log('This will generate a bcrypt hash for your admin password.');
console.log('Add the hash to your .env file as ADMIN_PASSWORD_HASH\n');

rl.question('Enter your desired admin password: ', async (password) => {
    if (!password || password.length < 8) {
        console.error('\n❌ Password must be at least 8 characters long');
        rl.close();
        process.exit(1);
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        console.log('\n✅ Password hash generated successfully!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Add this to your .env file:\n');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('For Railway deployment:');
        console.log('1. Go to your Railway project');
        console.log('2. Click on "Variables"');
        console.log('3. Add: ADMIN_PASSWORD_HASH = (paste the hash above)');
        console.log('4. Also add: SESSION_SECRET = (any random string)\n');
    } catch (error) {
        console.error('\n❌ Error generating hash:', error.message);
    }

    rl.close();
});
