import fs from 'fs';

let activityLogs = fs.readFileSync('src/components/ActivityLogsView.tsx', 'utf8');
activityLogs = activityLogs.replace(/const simulateNewTrace = \(\) => \{[\s\S]*?\};\n/g, '');
// Remove button
activityLogs = activityLogs.replace(/<button[^>]*onClick=\{simulateNewTrace\}[^>]*>[\s\S]*?<\/button>/g, '');
fs.writeFileSync('src/components/ActivityLogsView.tsx', activityLogs);

let auditLogs = fs.readFileSync('src/components/AuditLogView.tsx', 'utf8');
auditLogs = auditLogs.replace(/const addSimulatedAudit = \(\) => \{[\s\S]*?\};\n/g, '');
auditLogs = auditLogs.replace(/<button[^>]*onClick=\{addSimulatedAudit\}[^>]*>[\s\S]*?<\/button>/g, '');
fs.writeFileSync('src/components/AuditLogView.tsx', auditLogs);

