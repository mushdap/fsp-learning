"""Verify every declared release asset against its SHA-256 provenance."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent
manifest=json.loads((root/'release-manifest.json').read_text(encoding='utf-8'))
for name,expected in manifest['sha256'].items():
    path=(root/name).resolve()
    assert path.is_relative_to(root),name
    assert path.is_file(),('Missing asset',name)
    assert hashlib.sha256(path.read_bytes()).hexdigest()==expected,('Changed asset',name)
print(f"PASS: {len(manifest['sha256'])} public assets match the release manifest.")
