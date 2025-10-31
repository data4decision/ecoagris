// add-admin.ts (run once)
import { adminFirestore } from './src/app/lib/firebaseAdmin';
import bcrypt from 'bcryptjs';

async function addAdmin() {
  const email = 'john@ecoagris.org';
  const password = 'secret123'; // plain text
  const name = 'John Doe';

  const hashed = await bcrypt.hash(password, 10);

  await adminFirestore.collection('admins').add({
    email,
    password: hashed,
    name,
    role: 'admin',
    createdAt: new Date(),
  });

  console.log('Admin added:', email);
}

addAdmin();