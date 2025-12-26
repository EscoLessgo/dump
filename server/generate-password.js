import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('\n🔐 Admin Password Hash Generator');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

rl.question('Enter your desired admin password: ', async (password) => {
    if (!password) {
        console.log('❌ Password cannot be empty');
        rl.close();
        return;
    }

    try {
        const hash = await bcrypt.hash(password, 10);

        console.log('\n✅ Password hash generated successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Add this to your Railway Variables:');
        console.log(`Variable Name: ADMIN_PASSWORD_HASH`);
        console.log(`Value:         ${hash}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (error) {
        console.error('Error generating hash:', error);
    }

    rl.close();
});
