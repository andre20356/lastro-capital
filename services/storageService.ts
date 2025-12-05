import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/config/firebase";
import { Platform } from "react-native";

export async function uploadPaymentProof(
  localUri: string,
  paymentId: string
): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const filename = `payment_proofs/${paymentId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);

    let blob: Blob;

    if (Platform.OS === "web") {
      const response = await fetch(localUri);
      blob = await response.blob();
    } else {
      const response = await fetch(localUri);
      blob = await response.blob();
    }

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    console.log("Payment proof uploaded successfully:", downloadUrl);
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    throw error;
  }
}

export async function uploadImage(
  localUri: string,
  folder: string,
  filename: string
): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const fullPath = `${folder}/${filename}_${Date.now()}.jpg`;
    const storageRef = ref(storage, fullPath);

    const response = await fetch(localUri);
    const blob = await response.blob();

    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}
