# FSP learning artifacts

Public, built snapshots of the FSP Guide and FSP Exam. No sign-in required.

- [Open the guide](https://mushdap.github.io/fsp-learning/guide/)
- [Open the practice exam](https://mushdap.github.io/fsp-learning/exam/)
- [PDF coverage audit](https://mushdap.github.io/fsp-learning/guide/reference/coverage/)

These are fictional educational scenarios. The exam is a practice knowledge check, not an official or secure assessment. The guide now includes 95 added bilingual foundation lessons and context cards for six previously ambiguous terms. Its 124 audited objectives have linked teaching evidence; practical clinical competence is not certified. German supporting text combines authored adaptations and documented offline translation.

Only the built websites are distributed here. The supplied PDF and original photographs are not included. Illustrations are generated fictional teaching artwork.

To prepare a synchronized release from adjacent `fsp-guide` and `fsp-exam` checkouts, run `python publish.py` using the guide's Python environment, then review and commit the diff. The script builds, tests and copies an explicit set of public assets. `release-manifest.json` records source revisions and asset hashes. It refuses dirty source trees before and after building. It removes only obsolete manifest-owned assets, preserves unrelated files, and does not publish automatically. `python verify_release.py` checks every declared asset hash.

Snapshot: guide 0574814; exam 1a40140. GitHub Pages serves this repository's main branch.
