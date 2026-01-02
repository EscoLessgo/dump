import Database from 'better-sqlite3';
import fetch from 'node-fetch';

const db = new Database('./data/database.sqlite');
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}/api/pastes`;

async function test() {
    console.log('--- Starting Password Repro Test ---');

    // 1. Manually insert a password-protected paste
    const id = 'test_pw_' + Date.now();
    const password = 'secretpassword123';

    console.log(`Creating paste ${id} with password '${password}'...`);
    // Ensure we delete any collision
    db.prepare('DELETE FROM pastes WHERE id = ?').run(id);

    db.prepare(`
        INSERT INTO pastes (id, title, content, language, isPublic, password)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, 'Password Test', 'This is secret.', 'plaintext', 1, password);

    // 2. Fetch WITHOUT password
    console.log('Fetching WITHOUT password...');
    try {
        const res = await fetch(`${BASE_URL}/${id}`);
        // If server is not running, this throws
        if (res.status === 401) {
            const data = await res.json();
            if (data.passwordRequired) {
                console.log('✅ Correctly rejected (401 Password Required)');
            } else {
                console.log('❌ Rejected but missing passwordRequired flag', data);
            }
        } else {
            console.log(`❌ FAILED: Should be 401, got ${res.status}`);
        }
    } catch (e) {
        console.log('Error fetching (Server might be down):', e.message);
        // Clean up and exit if server down
        db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
        return;
    }

    // 3. Fetch WITH WRONG password
    console.log('Fetching WITH WRONG password...');
    try {
        const res = await fetch(`${BASE_URL}/${id}?password=wrong`);
        if (res.status === 401) {
            console.log('✅ Correctly rejected (401)');
        } else {
            console.log(`❌ FAILED: Should be 401, got ${res.status}`);
        }
    } catch (e) { console.log('Error:', e.message); }

    // 4. Fetch WITH CORRECT password
    console.log(`Fetching WITH CORRECT password '${password}'...`);
    try {
        const res = await fetch(`${BASE_URL}/${id}?password=${password}`);

        if (res.status === 200) {
            const data = await res.json();
            if (data.content === 'This is secret.') {
                console.log('✅ SUCCESS: Accessed paste with password.');
            } else {
                console.log('❌ FAILED: Body mismatch.', data);
            }
        } else {
            console.log(`❌ FAILED: Could not access paste. Status: ${res.status}`);
            const txt = await res.text();
            console.log('Response:', txt);
        }
    } catch (e) { console.log('Error:', e.message); }

    // Cleanup
    db.prepare('DELETE FROM pastes WHERE id = ?').run(id);
    console.log('Test Complete.');
}

test();
