# Run log — apply-copilot-backlog

| iter | feature | gates | review | commit | notes |
|------|---------|-------|--------|--------|-------|
| 1 | cv-upload | typecheck/lint/test(78)/build all green | react+code reviewers: APPROVE, 0 findings | 4628e17 | unpdf+mammoth, /api/cv/extract, CvUpload drag/drop on both views |
| 2 | cv-quality-check | typecheck/lint/test(89)/build all green | react+code reviewers: APPROVE, 0 CRITICAL/HIGH | 0a13622 | /api/cv-review streaming object, /cv page, shared ScoreRing extracted |
| 3 | statistics | typecheck/lint/test(95)/build all green | react+code: APPROVE, 0 CRITICAL/HIGH (a11y MEDIUM fixed) | 285183a | computeApplicationStats + /stats page, reuses applications API |
| 4 | ai-text-postprocess | typecheck/lint/test(102)/build green | code: HIGH(ReDoS) + MEDIUM(preamble FP) FIXED; react: clean | 7b88dfa | cleanAiText pure de-slop via onFinish |
| 5 | design-polish | typecheck/lint/test(105)/build green | react+code: APPROVE, 0 findings | 8d4d037 | StreamingIndicator, .lift, .reveal entrances; reduced-motion guarded |
| 6 | self-host | compose validates; typecheck/lint/test(105)/build green | self-reviewed (config/docs; reviewers interrupted) — DB bound to localhost | 28121f0 | docker-compose app+postgres, MIT LICENSE, README sections |
