import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import { getActiveServerSession } from "@/lib/serverSession";
import { prisma } from "@/lib/prisma";
import { optimizeImageBuffer } from "@/lib/images/serverImageOptimizer";
import { generateSafeAvatarFilename } from "@/lib/images/imageSafety";
import { IMAGE_CONFIG } from "@/lib/images/imageConfig";

const f = createUploadthing();
const utapi = new UTApi();

export const ourFileRouter = {
  profilePicture: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await getActiveServerSession();
      if (!session) throw new UploadThingError("Unauthorized.");

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { profilePictureLocked: true, imageKey: true },
      });

      if (user?.profilePictureLocked) {
        throw new UploadThingError("Profile picture editing has been locked by an administrator.");
      }

      return { userId: session.user.id, role: session.user.role, oldKey: user?.imageKey };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // The provider callback can arrive after moderation or a role change.
      const account = await prisma.user.findUnique({
        where: { id: metadata.userId },
        select: { status: true, role: true, profilePictureLocked: true },
      });
      if (!account || account.status !== "ACTIVE" || account.role !== metadata.role || account.profilePictureLocked) {
        await utapi.deleteFiles(file.key);
        throw new UploadThingError("Profile picture update is no longer authorized.");
      }
      // Every upload is re-encoded server-side, whatever its name: the client
      // controls the filename, and the raw file may carry EXIF/GPS metadata or not
      // be a PNG/JPEG/WebP at all. Peers see avatars, so the raw file is never kept.
      let finalKey: string;
      let finalUrl: string;
      try {
        const response = await fetch(file.ufsUrl ?? file.url);
        if (!response.ok) throw new Error(`Fetching the uploaded file failed (${response.status}).`);
        const rawBuffer = Buffer.from(await response.arrayBuffer());
        const optResult = await optimizeImageBuffer(rawBuffer, {
          maxDimension: IMAGE_CONFIG.MAX_AVATAR_DIMENSION,
          quality: IMAGE_CONFIG.WEBP_QUALITY,
        });
        const safeName = generateSafeAvatarFilename(optResult.format);
        const optimizedFile = new File([new Uint8Array(optResult.buffer)], safeName, {
          type: optResult.mimeType,
        });
        const uploadRes = await utapi.uploadFiles(optimizedFile);
        const data = Array.isArray(uploadRes) ? uploadRes[0]?.data : uploadRes?.data;
        if (!data?.key) throw new Error("Storing the sanitised image failed.");
        finalKey = data.key;
        finalUrl = data.ufsUrl ?? data.url;
      } catch (err) {
        console.error("Rejected profile picture upload:", err);
        await utapi.deleteFiles(file.key).catch(() => undefined);
        throw new UploadThingError("That image could not be processed. Upload a PNG, JPEG or WebP photo.");
      }
      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          image: finalUrl,
          imageKey: finalKey,
          profilePictureUpdatedAt: new Date(),
        },
      });

      await utapi.deleteFiles(file.key).catch((err) => {
        console.error("Failed to delete raw avatar upload from UploadThing:", err);
      });
      // Only now that the replacement is saved, clean up the previous image.
      if (metadata.oldKey) {
        await utapi.deleteFiles(metadata.oldKey).catch((err) => {
          console.error("Failed to delete previous avatar from UploadThing:", err);
        });
      }

      return { uploadedBy: metadata.userId, url: finalUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
