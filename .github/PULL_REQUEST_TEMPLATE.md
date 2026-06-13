<!--
  Thanks for contributing to Discovery Quest! 🦉
  This template applies to course content PRs (a world, station, lesson, or word list)
  and to engine PRs. Fill in what's relevant and check the boxes.
-->

## What this PR adds

<!-- One or two sentences: what it teaches, and for whom. -->
- **Type:** <!-- course content / new board or view (engine) / fix / docs -->
- **Subject & age range:** <!-- e.g. English phonics, ages 5–7 -->
- **Summary:**

## Validation

- [ ] `npm run course:check -- <my-course.yml> --app packages/<subject>` passes (green)
- [ ] On-screen text exactly matches the narration text (the `caption == narration[say]` rule)
- [ ] Uses only existing board/view kinds from the capability catalog (a new interaction is a
      separate engine PR)

## Child-safety checklist (required — this is a product for young children)

- [ ] Age-appropriate language and imagery
- [ ] No external links
- [ ] No data collection / no personal data
- [ ] Factually correct and pedagogically sound (e.g. phonics sounds are accurate)

## Originality & rights

- [ ] This is my own work, or I have the rights to contribute it
- [ ] It contains no third-party copyrighted material I don't have rights to

## Contributor terms (required)

- [ ] I have read and agree to the contributor terms in **[LICENSING.md](../LICENSING.md)**.
      I keep copyright to my contribution; my contribution ships publicly under its open license
      (**engine code: AGPL-3.0; course content: CC BY-SA 4.0**), and I grant Discovery Quest a
      perpetual, worldwide, irrevocable, royalty-free, sublicensable license to use it —
      **including commercially** in the hosted product.

<!--
  Sign off your commits to certify the above (Developer Certificate of Origin):
      git commit -s -m "..."
  This appends a line:  Signed-off-by: Your Name <you@example.com>
-->
- [ ] My commits are signed off (`git commit -s`)
