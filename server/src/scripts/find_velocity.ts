import db from '../config/database.js';

async function findVelocity() {
  try {
    const [rows]: any = await db.execute('SELECT id FROM profiles WHERE email = "javedkhanvelocity@gmail.com"');
    console.table(rows);
    
    if (rows.length > 0) {
      const userIds = [...new Set(rows.map((r: any) => r.user_id))];
      for (const id of userIds) {
        const [profile]: any = await db.execute('SELECT id, email, name FROM profiles WHERE id = ?', [id]);
        const [roles]: any = await db.execute('SELECT role FROM user_roles WHERE user_id = ?', [id]);
        console.log(`Profile for ${id}:`, profile[0]);
        console.log(`Roles for ${id}:`, roles.map((r: any) => r.role));
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

findVelocity();
