/**
 * Bulk-map franchises to distributors from a CSV.
 *
 * CSV columns (header row required, case-insensitive, order doesn't matter):
 *   franchise_code    - vendor_details.store_code   (e.g. FA2Z68)   [required]
 *   distributor_phone - distributors.phone_number   (e.g. 9414247000)
 *   distributor_name  - distributors.name           (optional; used if no phone,
 *                       and as a cross-check when phone is present)
 *
 * A franchise may be mapped to several distributors — just add one row per pair.
 *
 * Usage:
 *   tsx src/scripts/bulk_map_franchises.ts <file.csv>            # dry run
 *   tsx src/scripts/bulk_map_franchises.ts <file.csv> --apply    # write
 *
 * The dry run reports every unmatched / ambiguous / duplicate row BEFORE writing,
 * and --apply refuses to run if any row is invalid, so a typo can't silently
 * produce a wrong mapping. Writes are idempotent and wrapped in a transaction.
 */
import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';
import fs from 'fs';
import dotenv from 'dotenv'; import path from 'path'; import { fileURLToPath } from 'url';
const __d = path.dirname(fileURLToPath(import.meta.url)); dotenv.config({ path: path.resolve(__d, '../../.env') });

const APPLY = process.argv.includes('--apply');
const csvPath = process.argv.slice(2).find(a => !a.startsWith('--'));

const normPhone = (v: string) => {
    let s = String(v ?? '').replace(/\D/g, '');
    if (s.length === 12 && s.startsWith('91')) s = s.slice(2);
    else if (s.length === 11 && s.startsWith('0')) s = s.slice(1);
    return s;
};
const normText = (v: string) => String(v ?? '').trim().toLowerCase();

// Minimal CSV line parser that respects double-quoted fields.
function parseCsvLine(line: string): string[] {
    const out: string[] = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQ) {
            if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (ch === '"') inQ = false;
            else cur += ch;
        } else if (ch === '"') inQ = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
    }
    out.push(cur);
    return out.map(s => s.trim());
}

async function main() {
    if (!csvPath) {
        console.error('Usage: tsx src/scripts/bulk_map_franchises.ts <file.csv> [--apply]');
        process.exit(1);
    }
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV not found: ${csvPath}`);
        process.exit(1);
    }

    const c = await mysql.createConnection({ host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, port: Number(process.env.DB_PORT) || 3306 });
    console.log(APPLY ? '\n*** APPLY MODE — writing ***\n' : '\n--- DRY RUN (no writes; add --apply to write) ---\n');

    // ── Load lookup tables ────────────────────────────────────────────────
    const [franchiseRows]: any = await c.query(
        `SELECT user_id, store_name, store_code FROM vendor_details
         WHERE is_franchise = 1 AND store_code IS NOT NULL AND store_code <> ''`
    );
    const byCode = new Map<string, any>();
    for (const f of franchiseRows) byCode.set(normText(f.store_code), f);

    const [distRows]: any = await c.query(`SELECT id, name, phone_number FROM distributors`);
    const byPhone = new Map<string, any>();
    const byName = new Map<string, any[]>();
    for (const d of distRows) {
        const p = normPhone(d.phone_number);
        if (p) byPhone.set(p, d);
        const n = normText(d.name);
        byName.set(n, [...(byName.get(n) || []), d]);
    }

    const [existingRows]: any = await c.query(`SELECT franchise_user_id, distributor_id FROM franchise_distributors`);
    const existing = new Set(existingRows.map((r: any) => `${r.franchise_user_id}::${r.distributor_id}`));

    // ── Parse CSV ─────────────────────────────────────────────────────────
    const raw = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) { console.error('CSV needs a header row and at least one data row.'); await c.end(); process.exit(1); }

    const headers = parseCsvLine(lines[0]).map(h => normText(h).replace(/\s+/g, '_'));
    const idxCode = headers.findIndex(h => ['franchise_code', 'store_code', 'code'].includes(h));
    const idxPhone = headers.findIndex(h => ['distributor_phone', 'phone', 'phone_number', 'mobile'].includes(h));
    const idxName = headers.findIndex(h => ['distributor_name', 'distributor'].includes(h));

    if (idxCode === -1 || (idxPhone === -1 && idxName === -1)) {
        console.error(`CSV must have a "franchise_code" column and at least one of "distributor_phone" / "distributor_name".`);
        console.error(`Found headers: ${headers.join(', ')}`);
        await c.end(); process.exit(1);
    }

    type Row = { line: number; code: string; phone: string; name: string; franchise?: any; distributor?: any; problem?: string; alreadyMapped?: boolean };
    const rows: Row[] = [];
    const seenPairs = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i]);
        const code = idxCode === -1 ? '' : cells[idxCode] || '';
        const phone = idxPhone === -1 ? '' : cells[idxPhone] || '';
        const name = idxName === -1 ? '' : cells[idxName] || '';
        const r: Row = { line: i + 1, code, phone, name };

        if (!code) { r.problem = 'missing franchise_code'; rows.push(r); continue; }
        const franchise = byCode.get(normText(code));
        if (!franchise) { r.problem = `no franchise with store_code "${code}"`; rows.push(r); continue; }
        r.franchise = franchise;

        // Resolve distributor: phone first (DB-unique), else name.
        let distributor: any = null;
        if (phone) {
            distributor = byPhone.get(normPhone(phone)) || null;
            if (!distributor) { r.problem = `no distributor with phone "${phone}"`; rows.push(r); continue; }
            // Cross-check the name if the sheet provides one.
            if (name && normText(distributor.name) !== normText(name)) {
                r.problem = `phone ${phone} is "${distributor.name}" but sheet says "${name}"`;
                rows.push(r); continue;
            }
        } else {
            const matches = byName.get(normText(name)) || [];
            if (matches.length === 0) { r.problem = `no distributor named "${name}"`; rows.push(r); continue; }
            if (matches.length > 1) { r.problem = `distributor name "${name}" is ambiguous (${matches.length} matches) — use distributor_phone`; rows.push(r); continue; }
            distributor = matches[0];
        }
        r.distributor = distributor;

        const key = `${franchise.user_id}::${distributor.id}`;
        if (seenPairs.has(key)) { r.problem = 'duplicate row in CSV'; rows.push(r); continue; }
        seenPairs.add(key);
        if (existing.has(key)) r.alreadyMapped = true;

        rows.push(r);
    }

    // ── Report ────────────────────────────────────────────────────────────
    const problems = rows.filter(r => r.problem);
    const already = rows.filter(r => !r.problem && r.alreadyMapped);
    const toInsert = rows.filter(r => !r.problem && !r.alreadyMapped);

    console.log(`CSV data rows: ${rows.length}`);
    console.log(`  ✓ to map     : ${toInsert.length}`);
    console.log(`  = already set: ${already.length}`);
    console.log(`  ✗ problems   : ${problems.length}`);

    if (problems.length) {
        console.log('\n=== PROBLEM ROWS (fix these; nothing will be written) ===');
        for (const p of problems) console.log(`  line ${p.line}: ${p.problem}   [${p.code} -> ${p.phone || p.name}]`);
    }

    if (toInsert.length) {
        console.log('\n=== WOULD MAP ===');
        for (const r of toInsert) console.log(`  ${r.franchise.store_code.padEnd(12)} ${String(r.franchise.store_name).slice(0, 38).padEnd(40)} -> ${r.distributor.name}`);
    }

    if (!APPLY) {
        console.log(`\n--- DRY RUN complete. Nothing written. ---`);
        await c.end();
        return;
    }

    if (problems.length) {
        console.error(`\n❌ Refusing to apply: ${problems.length} row(s) have problems. Fix the CSV and re-run.`);
        await c.end();
        process.exit(1);
    }

    await c.beginTransaction();
    try {
        for (const r of toInsert) {
            await c.execute(
                `INSERT INTO franchise_distributors (id, franchise_user_id, distributor_id)
                 VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id = id`,
                [randomUUID(), r.franchise.user_id, r.distributor.id]
            );
        }
        await c.commit();
        console.log(`\n✅ APPLIED: ${toInsert.length} mapping(s) created (${already.length} already existed).`);
    } catch (e: any) {
        await c.rollback();
        console.error('❌ Rolled back:', e.message);
        throw e;
    }
    await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
