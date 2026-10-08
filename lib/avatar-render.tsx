import "server-only";
import { ImageResponse } from "next/og";
import { avatarSvg, type AvatarStyle } from "@/lib/avatar";
import { saveImageBytes } from "@/lib/uploads";

/**
 * Draws a generated avatar again on the server from its style and seed, turns it into a 256px PNG with
 * `next/og`, and stores it like any other upload. A PNG works everywhere a photo does, including
 * `next/image`, which refuses SVG.
 */
export async function storeGeneratedAvatar(style: AvatarStyle, seed: string): Promise<string> {
  const src = `data:image/svg+xml;base64,${Buffer.from(avatarSvg(style, seed)).toString("base64")}`;
  const image = new ImageResponse(
    // Satori draws an <img>; next/image does not apply here.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={256} height={256} alt="" />,
    { width: 256, height: 256 },
  );
  const bytes = Buffer.from(await image.arrayBuffer());
  return saveImageBytes(bytes, "png");
}
