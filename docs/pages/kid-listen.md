# Child listening

## Behavior
- The child only hears approved takes: the playback plan, the book payload and the files endpoint expose approved audio only.
- When a relative records again, the previously approved take stays playable until the parent approves the new one (table approved_takes, view child_recordings).
- Scans are never exposed to the child: page fileId is null in the book payload and GET /api/files on a scan returns 403. Offline downloads therefore never store scans.

## Design audit checklist
- One main action, visible secondary buttons with icon
- Big childlike icons, micro-animations
- No overflow at any text size, keyboard and remote focus
- prefers-reduced-motion respected
- Fredoka and Nunito, hard shadow 3px 3px 0 #1F1B3A
