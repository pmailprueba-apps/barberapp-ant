import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

const LOGO_PATH = "logos";

export async function uploadLogo(barberiaId: string, file: File): Promise<string> {
  const storageRef = ref(storage, `${LOGO_PATH}/${barberiaId}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteLogo(barberiaId: string): Promise<void> {
  const storageRef = ref(storage, `${LOGO_PATH}/${barberiaId}`);
  await deleteObject(storageRef);
}

export async function getLogoUrl(barberiaId: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, `${LOGO_PATH}/${barberiaId}`);
    return await getDownloadURL(storageRef);
  } catch {
    return null;
  }
}
