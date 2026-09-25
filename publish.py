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

def require_clean(repo):
    changes = subprocess.check_output(['git', 'status', '--porcelain', '--untracked-files=normal'], cwd=repo, text=True)
    if changes.strip():
        raise SystemExit(f'{repo.name} has uncommitted changes. Commit reviewed source and generated data first.\n{changes}')

def main():
    previous_manifest = json.loads((ROOT/'release-manifest.json').read_text(encoding='utf-8')) if (ROOT/'release-manifest.json').exists() else {}
    for repo in (GUIDE, EXAM):
        require_clean(repo)
    source_revisions = {repo.name: revision(repo) for repo in (GUIDE, EXAM)}
    run([sys.executable, '-X', 'utf8', '-m', 'mkdocs', 'build', '--strict'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_guide.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_assessments.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_learning.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/check_release_requirements.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/test_case_stages.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/test_patient_fact_wave.py'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/test_all_patient_facts.py'], GUIDE)
    run(['node', 'tools/test_story_mode.cjs'], GUIDE)
    run([sys.executable, '-X', 'utf8', 'tools/import_bank.py'], EXAM)
    run(['node', '--test'], EXAM)
    for name in ('app.js','engine.js','profile-workspace.js','glossary-ui.js','skills-engine.js','skills-workspace.js','practice-workspace.js'):
        run(['node','--check',name],EXAM)
    # Build/import must reproduce committed data, not silently change provenance.
    for repo in (GUIDE, EXAM):
        require_clean(repo)
        if revision(repo) != source_revisions[repo.name]:
            raise SystemExit(f'{repo.name} changed revision during the build. Retry from a stable checkout.')
    sources = [(p, ROOT / 'guide' / p.relative_to(GUIDE / 'site'))
               for p in (GUIDE / 'site').rglob('*') if p.is_file()]
    for name in ('index.html', 'app.js', 'engine.js', 'language.js', 'style.css', 'bank.json', 'de.json', 'profile-workspace.js', 'profiles.json', 'glossary-ui.js', 'glossary.json','skills-engine.js','skills-workspace.js','practice-workspace.js','source-sync.json'):
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
        data = source.read_bytes()
        if source.suffix.lower() in {'.html','.css','.js','.json','.svg','.xml','.txt','.map','.md'}:
            data = data.replace(b'\r\n', b'\n')
        target.write_bytes(data)
        hashes[target.relative_to(ROOT).as_posix()] = hashlib.sha256(target.read_bytes()).hexdigest()
    # Remove only obsolete files previously owned by the release manifest.
    # Resolve and verify each exact path; never recursively remove a directory.
    for name in set(previous_manifest.get('sha256',{}))-set(hashes):
        target=(ROOT/name).resolve()
        if not target.is_relative_to(ROOT.resolve()) or target.relative_to(ROOT.resolve()).parts[0] not in {'guide','exam'}:
            raise ValueError(f'Unsafe obsolete asset path: {name}')
        if target.is_file():
            target.unlink()
    manifest = {'guide_revision': revision(GUIDE), 'exam_revision': revision(EXAM), 'sha256': hashes}
    (ROOT / 'release-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    print(f'Prepared {len(hashes)} assets. Obsolete manifest-owned files removed; unrelated files preserved. Review git diff before publishing.')

if __name__ == '__main__':
    main()
