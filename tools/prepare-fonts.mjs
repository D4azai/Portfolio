import { mkdir, writeFile } from "node:fs/promises";

await mkdir("assets/fonts", { recursive: true });
const userAgent =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
for (const [name, family] of [
  ["manrope", "Manrope:wght@400..800"],
  ["dm-mono", "DM+Mono:wght@400"],
]) {
  const response = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}&display=swap`,
    { headers: { "User-Agent": userAgent } },
  );
  if (!response.ok) throw new Error(`Font CSS failed: ${response.status}`);
  const css = await response.text();
  const block = css.split("/* latin */").at(-1);
  const url = block.match(/url\((https[^)]+\.woff2)\)/)?.[1];
  if (!url) throw new Error(`No Latin WOFF2 for ${name}`);
  const font = await fetch(url);
  if (!font.ok) throw new Error(`Font download failed: ${font.status}`);
  const data = new Uint8Array(await font.arrayBuffer());
  await writeFile(`assets/fonts/${name}-latin.woff2`, data);
  console.log(name, data.length, "bytes");
  const license = await fetch(
    `https://raw.githubusercontent.com/google/fonts/main/ofl/${name.replace("-", "")}/OFL.txt`,
  );
  if (!license.ok) throw new Error(`Font license failed: ${license.status}`);
  await writeFile(`assets/fonts/${name}-OFL.txt`, await license.text());
}
