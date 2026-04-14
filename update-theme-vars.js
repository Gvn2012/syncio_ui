const fs = require('fs');
const file = '/Users/cps/IdeaProjects/syncio-ui/src/features/user/pages/PeoplePage.css';
let content = fs.readFileSync(file, 'utf8');

const replacements = {
  'var(--bg-card-alt)': 'var(--bg-main)',
  'var(--border-light)': 'var(--border-color)',
  'var(--text-primary)': 'var(--text-main)',
  'var(--text-secondary)': 'var(--text-muted)',
  'var(--text-tertiary)': 'var(--text-muted)',
  'var(--primary-alpha)': 'var(--primary-alpha-20)',
  'var(--primary-light)': 'var(--primary-hover)',
  '#dc2626': 'var(--error)',
  '#fee2e2': 'rgba(239, 68, 68, 0.1)',
  '#fecaca': 'var(--error)',
  '#166534': 'var(--success)',
  '#dcfce7': 'rgba(34, 197, 94, 0.1)',
  '#10b981': 'var(--success)',
  '#f0f0f0': 'var(--bg-main)',
  '#f8f8f8': 'var(--bg-card)',
  'rgba(0, 0, 0, 0.05)': 'var(--shadow-sm)' // approx shadow
};

for (const [key, value] of Object.entries(replacements)) {
  content = content.split(key).join(value);
}

fs.writeFileSync(file, content);
console.log('Variables updated successfully.');
