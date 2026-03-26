import { db } from './database';
import type { SessionProfile } from '../types/responses';

const PROFILE_ID = 'current';

export async function getProfile(): Promise<SessionProfile | undefined> {
  return db.profile.get(PROFILE_ID);
}

export async function saveProfile(profile: Omit<SessionProfile, 'id' | 'createdAt'> & { id?: string }): Promise<SessionProfile> {
  const existing = await getProfile();
  const next: SessionProfile = {
    id: PROFILE_ID,
    studentName: profile.studentName.trim(),
    groupName: profile.groupName.trim(),
    tripId: profile.tripId,
    tripTitle: profile.tripTitle,
    createdAt: existing?.createdAt ?? Date.now(),
  };
  await db.profile.put(next);
  return next;
}

export async function clearSessionData(): Promise<void> {
  await db.responses.clear();
  await db.photos.clear();
  await db.profile.clear();
}
