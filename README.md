# FSP learning artifacts

Public, built snapshots of the FSP Guide and FSP Exam. No sign-in required.

- [Open the guide](https://mushdap.github.io/fsp-learning/guide/)
- [Open the practice exam](https://mushdap.github.io/fsp-learning/exam/)
- [PDF coverage audit](https://mushdap.github.io/fsp-learning/guide/reference/coverage/)

These are fictional educational scenarios. The exam is a practice knowledge check, not an official or secure assessment. Detailed clinical and terminology coverage gaps remain documented in the guide. German supporting translations require professional review.

Only the built websites are distributed here. The supplied PDF and original photographs are not included. Illustrations are generated fictional teaching artwork.

To prepare a synchronized release from adjacent `fsp-guide` and `fsp-exam` checkouts, run `python publish.py` using the guide's Python environment, then review and commit the diff. The script builds, tests and copies an explicit set of public assets. `release-manifest.json` records source revisions and asset hashes. It does not publish automatically or delete obsolete files silently.

Snapshot: guide 7d4e3dc; exam acf171e. GitHub Pages serves this repository's main branch.
