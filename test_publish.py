"""A release must reject tracked edits and untracked source files."""
import subprocess
import tempfile
import unittest
from pathlib import Path
from publish import require_clean

class ProvenanceTest(unittest.TestCase):
    def test_dirty_sources_are_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            repo = Path(folder)
            subprocess.run(['git','init','-q',str(repo)],check=True)
            require_clean(repo)
            (repo/'new.txt').write_text('uncommitted',encoding='utf-8')
            with self.assertRaises(SystemExit): require_clean(repo)
            subprocess.run(['git','add','new.txt'],cwd=repo,check=True)
            with self.assertRaises(SystemExit): require_clean(repo)

if __name__ == '__main__': unittest.main()
