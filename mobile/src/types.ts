export type SearchResult = {
  profile_id: string;
  display_name: string;
  birth_date: string;
  region: string | null;
  primary_photo_url: string | null;
  distance: number;
};

export function ageFromBirthDate(birthDate: string): number {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}
