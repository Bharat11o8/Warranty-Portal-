const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
// Default to April 15th to catch work before the 21st launch
const START_DATE = process.argv[2] || '2026-04-15';
const OUTPUT_FILE = `daily_report_${new Date().toISOString().split('T')[0]}.csv`;

function getGitLogs(since) {
    try {
        // %as = date (YYYY-MM-DD), %at = timestamp, %ai = ISO 8601 date+time
        const command = `git log --since="${since}" --pretty=format:"%ai|%s" --no-merges`;
        const output = execSync(command).toString().trim();
        if (!output) return [];
        return output.split('\n').map(line => {
            const [fullDate, subject] = line.split('|');
            const [date, time] = fullDate.split(' ');
            return { date, time, subject };
        });
    } catch (error) {
        console.error('Error fetching git logs:', error.message);
        return [];
    }
}

function parseLogs(logs) {
    return logs.map(log => {
        let type = 'Update';
        let description = log.subject;

        // Try to extract type from prefix (e.g., "Fix: something" or "feat: something")
        const prefixMatch = log.subject.match(/^([^:]+):\s*(.*)$/);
        if (prefixMatch) {
            type = prefixMatch[1].trim();
            description = prefixMatch[2].trim();
        } else {
            // Check for keywords if no colon is present
            const lowerDesc = log.subject.toLowerCase();
            if (lowerDesc.includes('fix') || lowerDesc.includes('bug') || lowerDesc.includes('resolve')) {
                type = 'Fix';
            } else if (lowerDesc.includes('feat') || lowerDesc.includes('add')) {
                type = 'Feature';
            } else if (lowerDesc.includes('ui') || lowerDesc.includes('style') || lowerDesc.includes('css')) {
                type = 'UI/UX';
            } else if (lowerDesc.includes('merge')) {
                type = 'Merge/Sync';
            }
        }

        return {
            date: log.date,
            time: log.time,
            type: type.charAt(0).toUpperCase() + type.slice(1),
            description: description
        };
    });
}

function generateCSV(data) {
    const header = 'Date,Time,Type,Description/Resolution\n';
    const rows = data.map(item => {
        // Escape quotes for CSV
        const escapedDesc = `"${item.description.replace(/"/g, '""')}"`;
        const escapedType = `"${item.type.replace(/"/g, '""')}"`;
        const escapedTime = `"${item.time.replace(/"/g, '""')}"`;
        return `${item.date},${escapedTime},${escapedType},${escapedDesc}`;
    }).join('\n');

    return header + rows;
}

function main() {
    console.log(`Generating detailed report since ${START_DATE}...`);
    const logs = getGitLogs(START_DATE);
    
    if (logs.length === 0) {
        console.log('No commits found since the specified date.');
        return;
    }

    const parsedData = parseLogs(logs);
    const csvContent = generateCSV(parsedData);

    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log(`\nSuccessfully generated: ${OUTPUT_FILE}`);
    console.log(`Total entries: ${parsedData.length}`);
    
    // Also print to console for verification
    console.log('\n--- Report Summary ---');
    console.table(parsedData.map(d => ({ Date: d.date, Time: d.time, Type: d.type, Desc: d.description })));
}

main();
