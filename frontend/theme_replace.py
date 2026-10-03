import os
import re

replacements = [
    (r'\bbg-white\b', 'bg-cmd-card'),
    (r'\bbg-slate-50\b', 'bg-cmd-secondary'),
    (r'\bbg-slate-100\b', 'bg-cmd-secondary/50'),
    (r'\bbg-slate-900\b', 'bg-cmd-bg'),
    (r'\btext-slate-900\b', 'text-cmd-text'),
    (r'\btext-slate-800\b', 'text-cmd-text'),
    (r'\btext-slate-700\b', 'text-cmd-text-secondary'),
    (r'\btext-slate-600\b', 'text-cmd-text-secondary'),
    (r'\btext-slate-500\b', 'text-cmd-text-muted'),
    (r'\btext-slate-400\b', 'text-cmd-text-muted'),
    (r'\bborder-slate-200\b', 'border-cmd-border'),
    (r'\bborder-slate-300\b', 'border-cmd-border'),
    (r'\bborder-slate-100\b', 'border-cmd-border/50'),
    
    (r'\bbg-blue-50\b', 'bg-cmd-info/10'),
    (r'\btext-blue-600\b', 'text-cmd-info'),
    (r'\btext-blue-700\b', 'text-cmd-info'),
    (r'\bborder-blue-200\b', 'border-cmd-info/30'),
    (r'\bborder-blue-300\b', 'border-cmd-info/50'),
    
    (r'\bbg-rose-50\b', 'bg-cmd-critical/10'),
    (r'\bbg-red-50\b', 'bg-cmd-critical/10'),
    (r'\btext-rose-600\b', 'text-cmd-critical'),
    (r'\btext-rose-700\b', 'text-cmd-critical'),
    (r'\btext-red-500\b', 'text-cmd-critical'),
    (r'\btext-red-600\b', 'text-cmd-critical'),
    (r'\btext-red-700\b', 'text-cmd-critical'),
    (r'\bborder-rose-200\b', 'border-cmd-critical/30'),
    (r'\bborder-red-200\b', 'border-cmd-critical/30'),
    
    (r'\bbg-emerald-50\b', 'bg-cmd-success/10'),
    (r'\bbg-green-50\b', 'bg-cmd-success/10'),
    (r'\btext-emerald-600\b', 'text-cmd-success'),
    (r'\btext-emerald-700\b', 'text-cmd-success'),
    (r'\btext-green-600\b', 'text-cmd-success'),
    (r'\bborder-emerald-200\b', 'border-cmd-success/30'),
    (r'\bborder-green-200\b', 'border-cmd-success/30'),
    
    (r'\bbg-amber-50\b', 'bg-cmd-warning/10'),
    (r'\bbg-yellow-50\b', 'bg-cmd-warning/10'),
    (r'\btext-amber-600\b', 'text-cmd-warning'),
    (r'\btext-amber-700\b', 'text-cmd-warning'),
    (r'\btext-yellow-600\b', 'text-cmd-warning'),
    (r'\bborder-amber-200\b', 'border-cmd-warning/30'),
    (r'\bborder-yellow-200\b', 'border-cmd-warning/30'),

    (r'\bbg-gray-50\b', 'bg-cmd-secondary'),
    (r'\bbg-gray-100\b', 'bg-cmd-secondary/50'),
    (r'\btext-gray-900\b', 'text-cmd-text'),
    (r'\btext-gray-700\b', 'text-cmd-text-secondary'),
    (r'\btext-gray-500\b', 'text-cmd-text-muted'),
    (r'\bborder-gray-200\b', 'border-cmd-border'),
    (r'\bborder-gray-300\b', 'border-cmd-border')
]

skip_files = ['layout.tsx', 'page.tsx', 'Header.tsx', 'Sidebar.tsx', 'StatsCards.tsx', 'LandingMap.tsx', 'globals.css']

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for pattern, repl in replacements:
        new_content = re.sub(pattern, repl, new_content)
        
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            if file in skip_files and ('layout' in file or 'page' in file or 'Header' in file or 'Sidebar' in file or 'StatsCards' in file or 'LandingMap' in file):
                # We do want to update other page.tsx except src/app/page.tsx and src/app/(dashboard)/dashboard/page.tsx
                # Let's skip explicitly paths
                pass
            
            # Explicit path skips
            filepath = os.path.join(root, file).replace('\\', '/')
            if 'app/page.tsx' in filepath or 'dashboard/page.tsx' in filepath or 'layout.tsx' in filepath or 'Header.tsx' in filepath or 'Sidebar.tsx' in filepath or 'StatsCards.tsx' in filepath or 'LandingMap.tsx' in filepath:
                continue
                
            process_file(filepath)
