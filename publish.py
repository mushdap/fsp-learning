"""Build, test and copy explicit public assets from adjacent source repositories.

Run with the guide's Python environment: python publish.py
This prepares a local snapshot; review its diff and commit/push separately.
"""
from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
GUIDE = ROOT.parent / 'fsp-guide'
EXAM = ROOT.parent / 'fsp-exam'

def run(args, cwd):
    subprocess.run(args, cwd=cwd, check=True)

def revision(repo):
    return subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=repo, text=True).strip()

def main():
    run([sys.executable, '-X', 'utf8', '-m', 'mkdocs', 'build', '--strict'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_guide.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_assessments.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_learning.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/test_case_stages.py'], GUIDE)
    run(['node', 'tools/test_story_mode.cjs'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/import_bank.py'], EXAM)
    run(['node', '--test'], EXAM)
    sources = [(p, ROOT / 'guide' / p.relative_to(GUIDE / 'site'))
               for p in (GUIDE / 'site').rglob('*') if p.is_file()]
    for name in ('index.html', 'app.js', 'engine.js', 'language.js', 'style.css', 'bank.json', 'de.json', 'profile-workspace.js', 'profiles.json', 'glossary-ui.js', 'glossary.json'):
        sources.append((EXAM / name, ROOT / 'exam' / name))
    sources.extend((p, ROOT / 'exam/assets' / p.relative_to(EXAM / 'assets'))
                   for p in (EXAM / 'assets').rglob('*') if p.is_file())
    allowed = {'.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.xml', '.gz', '.txt', '.map', '.md'}
    for source, _ in sources:
        if source.suffix.lower() not in allowed:
            raise ValueError(f'Unexpected public asset: {source.name}')
    hashes = {}
    for source, target in sources:
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        hashes[target.relative_to(ROOT).as_posix()] = hashlib.sha256(target.read_bytes()).hexdigest()
    manifest = {'guide_revision': revision(GUIDE), 'exam_revision': revision(EXAM), 'sha256': hashes}
    (ROOT / 'release-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(hashes)} assets. Review git diff before publishing. Existing extra files are not deleted automatically.')

if __name__ == '__main__':
    main()
