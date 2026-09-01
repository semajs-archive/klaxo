/**
 * Solo mode.
 *
 * This is one person's study app, so there is nothing to log in to. Every
 * request belongs to the same local user, provisioned on first run.
 *
 * Identity is removed from the *experience*, not from the data model. Courses
 * are still owned by a `userId`, and the API still authorises against it, so
 * nothing about ownership had to be unpicked — and if this ever needs to serve
 * more than one person, the door is still open.
 */
import { createUser, getUserById } from '@/db/repo';

/** Stable and readable: the row this app always works as. */
export const SOLO_USER_ID = 'usr_solo';

let ensured = false;

export function getSoloUserId(): string {
  // The row only has to be created once per process; after that the check is
  // pure overhead on every request.
  if (!ensured) {
    if (!getUserById(SOLO_USER_ID)) {
      createUser({
        id: SOLO_USER_ID,
        email: 'solo@klaxo.local',
        displayName: 'You',
        role: 'teacher',
      });
    }
    ensured = true;
  }

  return SOLO_USER_ID;
}
