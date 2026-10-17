import sharp from "sharp";
import { optimizeImageBuffer } from "../src/lib/images/serverImageOptimizer";

interface BenchmarkSample {
  name: string;
  description: string;
  create: () => Promise<Buffer>;
}

async function runBenchmarks() {
  console.log("==========================================================================================");
  console.log("   KATUWANG - IMAGE COMPRESSION & OPTIMIZATION BENCHMARK REPORT                         ");
  console.log("==========================================================================================\n");

  const samples: BenchmarkSample[] = [
    {
      name: "High-Res Photo (JPEG)",
      description: "2048x1536 photographic portrait with rich gradients",
      create: async () => {
        return await sharp({
          create: {
            width: 2048,
            height: 1536,
            channels: 3,
            background: { r: 180, g: 140, b: 110 },
          },
        })
          .composite([
            {
              input: await sharp({
                create: {
                  width: 1000,
                  height: 1000,
                  channels: 3,
                  background: { r: 80, g: 120, b: 190 },
                },
              })
                .jpeg({ quality: 90 })
                .toBuffer(),
              top: 250,
              left: 500,
            },
          ])
          .jpeg({ quality: 92 })
          .toBuffer();
      },
    },
    {
      name: "High-Res Graphic / Screenshot (PNG)",
      description: "1920x1080 sharp UI screenshot / diagram",
      create: async () => {
        return await sharp({
          create: {
            width: 1920,
            height: 1080,
            channels: 3,
            background: { r: 245, g: 247, b: 250 },
          },
        })
          .composite([
            {
              input: await sharp({
                create: {
                  width: 800,
                  height: 400,
                  channels: 3,
                  background: { r: 37, g: 99, b: 235 },
                },
              })
                .png()
                .toBuffer(),
              top: 200,
              left: 400,
            },
          ])
          .png()
          .toBuffer();
      },
    },
    {
      name: "Transparent Logo / Avatar (PNG)",
      description: "1024x1024 badge with alpha channel transparency",
      create: async () => {
        return await sharp({
          create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        })
          .composite([
            {
              input: await sharp({
                create: {
                  width: 500,
                  height: 500,
                  channels: 4,
                  background: { r: 16, g: 185, b: 129, alpha: 0.9 },
                },
              })
                .png()
                .toBuffer(),
              top: 262,
              left: 262,
            },
          ])
          .png()
          .toBuffer();
      },
    },
    {
      name: "Pre-Optimized WebP",
      description: "400x400 existing WebP avatar already sized appropriately",
      create: async () => {
        return await sharp({
          create: {
            width: 400,
            height: 400,
            channels: 3,
            background: { r: 99, g: 102, b: 241 },
          },
        })
          .webp({ quality: 80 })
          .toBuffer();
      },
    },
    {
      name: "Real Stored Avatar (PNG)",
      description: "938x369 user avatar from UploadThing cloud storage",
      create: async () => {
        const res = await fetch(
          "https://xzc37go9kz.ufs.sh/f/xdzk3zjZyCo7k387lLtd524GkN8LaAWFxnvBCljhyTZObSzq"
        );
        return Buffer.from(await res.arrayBuffer());
      },
    },
  ];

  const results = [];

  for (const s of samples) {
    const rawBuf = await s.create();
    const meta = await sharp(rawBuf).metadata();
    const start = performance.now();
    const opt = await optimizeImageBuffer(rawBuf);
    const duration = performance.now() - start;

    results.push({
      name: s.name,
      description: s.description,
      beforeDim: `${meta.width}x${meta.height}`,
      afterDim: `${opt.width}x${opt.height}`,
      beforeBytes: rawBuf.length,
      afterBytes: opt.optimizedSize,
      savedBytes: rawBuf.length - opt.optimizedSize,
      reductionPercent: opt.reductionPercent,
      format: opt.format,
      durationMs: duration.toFixed(1),
    });
  }

  console.log(
    "| Sample Name | Original Dim | Optimized Dim | Before (KB) | After (KB) | Reduction (%) | Time (ms) | Format |"
  );
  console.log(
    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |"
  );
  for (const r of results) {
    console.log(
      `| **${r.name}** | ${r.beforeDim} | ${r.afterDim} | ${(r.beforeBytes / 1024).toFixed(
        1
      )} KB | ${(r.afterBytes / 1024).toFixed(1)} KB | **${r.reductionPercent}%** | ${
        r.durationMs
      } ms | ${r.format} |`
    );
  }

  const totalBefore = results.reduce((acc, r) => acc + r.beforeBytes, 0);
  const totalAfter = results.reduce((acc, r) => acc + r.afterBytes, 0);
  const totalSaved = totalBefore - totalAfter;
  const overallRed = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(2);

  console.log("\n------------------------------------------------------------------------------------------");
  console.log(`Total Uncompressed Data: ${(totalBefore / 1024).toFixed(2)} KB`);
  console.log(`Total Optimized Data:    ${(totalAfter / 1024).toFixed(2)} KB`);
  console.log(`Total Bandwidth/Storage: ${(totalSaved / 1024).toFixed(2)} KB saved (${overallRed}% overall reduction)`);
  console.log("------------------------------------------------------------------------------------------\n");
}

runBenchmarks().catch(console.error);
