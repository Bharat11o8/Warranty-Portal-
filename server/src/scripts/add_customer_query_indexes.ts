import db from '../config/database.js';

type IndexDefinition = {
    table: 'user_roles' | 'warranty_registrations';
    name: string;
    columns: string;
};

const indexes: IndexDefinition[] = [
    {
        table: 'user_roles',
        name: 'idx_user_roles_role_user',
        columns: '`role`, `user_id`'
    },
    {
        table: 'warranty_registrations',
        name: 'idx_wr_customer_group',
        columns: '`customer_name`, `customer_email`, `customer_phone`'
    },
    {
        table: 'warranty_registrations',
        name: 'idx_wr_phone_status',
        columns: '`customer_phone`, `status`'
    }
];

async function indexExists(table: string, name: string): Promise<boolean> {
    const [rows]: any = await db.query(
        `SELECT 1
         FROM information_schema.statistics
         WHERE table_schema = DATABASE()
           AND table_name = ?
           AND index_name = ?
         LIMIT 1`,
        [table, name]
    );

    return rows.length > 0;
}

async function addCustomerQueryIndexes() {
    for (const index of indexes) {
        if (await indexExists(index.table, index.name)) {
            console.log(`Index ${index.name} already exists.`);
            continue;
        }

        console.log(`Creating ${index.name} on ${index.table}...`);
        await db.query(
            `ALTER TABLE \`${index.table}\`
             ADD INDEX \`${index.name}\` (${index.columns}),
             ALGORITHM=INPLACE,
             LOCK=NONE`
        );
        console.log(`Created ${index.name}.`);
    }
}

addCustomerQueryIndexes()
    .then(() => {
        console.log('Customer query indexes are ready.');
    })
    .catch((error) => {
        console.error('Failed to create customer query indexes:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.end();
    });
