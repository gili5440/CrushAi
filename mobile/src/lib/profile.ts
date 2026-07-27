import { api } from "../api/client";

// PUT /profile/me requires the full required field set — fetch the current
// profile and merge so partial-field settings screens (ShowMe, Interests…)
// don't have to resend everything themselves.
export async function updateProfilePartial(patch: Record<string, unknown>) {
  const current = await api.getMyProfile();
  return api.updateMyProfile({
    displayName: current.display_name,
    birthDate: current.birth_date,
    gender: current.gender,
    interestedIn: current.interested_in,
    bio: current.bio ?? undefined,
    profession: current.profession ?? undefined,
    education: current.education ?? undefined,
    lookingFor: current.looking_for ?? undefined,
    region: current.region ?? undefined,
    heightCm: current.height_cm ?? undefined,
    religion: current.religion ?? undefined,
    smoking: current.smoking ?? undefined,
    lifestyleTags: current.lifestyle_tags ?? [],
    ...patch,
  });
}
