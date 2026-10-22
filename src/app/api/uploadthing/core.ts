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
      // Clean up previous image in cloud storage if replacing
      if (metadata.oldKey) {
        try {
          await utapi.deleteFiles(metadata.oldKey);
        } catch (err) {
          console.error("Failed to delete previous avatar from UploadThing:", err);
        }
      }

      let finalKey = file.key;
      let finalUrl = file.ufsUrl ?? file.url;

      // Defense-in-depth: if raw unoptimized image bypassed client compression, optimize it server-side
      const isAlreadyOptimized = file.name.startsWith("avatar-") && file.name.endsWith(".webp");
      if (!isAlreadyOptimized) {
        try {
          const response = await fetch(finalUrl);
          if (response.ok) {
            const rawBuffer = Buffer.from(await response.arrayBuffer());
            const optResult = await optimizeImageBuffer(rawBuffer, {
              maxDimension: IMAGE_CONFIG.MAX_AVATAR_DIMENSION,
              quality: IMAGE_CONFIG.WEBP_QUALITY,
            });

            if (optResult.optimizedSize < rawBuffer.length) {
              const safeName = generateSafeAvatarFilename(optResult.format);
              const optimizedFile = new File([new Uint8Array(optResult.buffer)], safeName, {
                type: optResult.mimeType,
              });
              const uploadRes = await utapi.uploadFiles(optimizedFile);
              const data = Array.isArray(uploadRes) ? uploadRes[0]?.data : uploadRes?.data;
              if (data?.key) {
                // Delete the uncompressed raw file from cloud storage
                await utapi.deleteFiles(file.key);
                finalKey = data.key;
                finalUrl = data.ufsUrl ?? data.url;
              }
            }
          }
        } catch (optErr) {
          console.error("Server-side fallback image optimization failed, keeping original:", optErr);
        }
      }

      await prisma.user.update({
        where: { id: metadata.userId },
        data: {
          image: finalUrl,
          imageKey: finalKey,
          profilePictureUpdatedAt: new Date(),
        },
      });

      return { uploadedBy: metadata.userId, url: finalUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
