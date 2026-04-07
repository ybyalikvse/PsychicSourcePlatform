import sharp from "sharp";

interface RenderSlideOptions {
  title: string;
  bodyText: string;
  backgroundImageUrl?: string;
  platform: "instagram" | "tiktok";
  templateConfig?: {
    bg_gradient?: string[];
    text_color?: string;
    accent_color?: string;
    font?: string;
    font_size?: number;
    text_alignment?: string;
    text_mode?: string; // 'title_and_body', 'title_only', 'body_only', 'none'
    watermark?: string;
    watermarkImage?: string;
    watermarkPosition?: string;
    watermarkSize?: number;
    watermarkOpacity?: string;
    igFontScale?: string;
  };
}

// Platform dimensions
const DIMENSIONS = {
  instagram: { width: 1080, height: 1350 },
  tiktok: { width: 1080, height: 1920 },
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + " " + word : word;
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  return lines;
}

function createGradientSvg(width: number, height: number, colors: string[]): string {
  const color1 = colors[0] || "#1a1a2e";
  const color2 = colors[1] || "#16213e";
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#grad)"/>
  </svg>`;
}

function createTextOverlaySvg(
  width: number,
  height: number,
  title: string,
  bodyText: string,
  config: RenderSlideOptions["templateConfig"]
): string {
  const textColor = config?.text_color || "#ffffff";
  const accentColor = config?.accent_color || "#f59e0b";
  const textMode = config?.text_mode || "title_and_body";
  const fontScale = parseFloat(config?.igFontScale || "1.0");
  const baseTitleSize = Math.round((config?.font_size || 64) * fontScale);
  const baseBodySize = Math.round(baseTitleSize * 0.55);
  const font = config?.font || "Arial, Helvetica, sans-serif";

  const maxCharsTitle = Math.floor(width / (baseTitleSize * 0.5));
  const maxCharsBody = Math.floor(width / (baseBodySize * 0.45));

  const elements: string[] = [];

  // Semi-transparent overlay for text readability
  elements.push(`<rect width="${width}" height="${height}" fill="rgba(0,0,0,0.4)"/>`);

  let yOffset = height * 0.35;

  // Title
  if (textMode !== "body_only" && textMode !== "none" && title) {
    const titleLines = wrapText(title, maxCharsTitle);
    for (const line of titleLines) {
      elements.push(`<text x="${width / 2}" y="${yOffset}" text-anchor="middle"
        font-family="${font}" font-size="${baseTitleSize}" font-weight="bold" fill="${textColor}"
        >${escapeXml(line)}</text>`);
      yOffset += baseTitleSize * 1.3;
    }

    // Accent divider line
    if (textMode === "title_and_body" && bodyText) {
      yOffset += 10;
      elements.push(`<line x1="${width * 0.3}" y1="${yOffset}" x2="${width * 0.7}" y2="${yOffset}"
        stroke="${accentColor}" stroke-width="3"/>`);
      yOffset += 30;
    }
  }

  // Body text
  if (textMode !== "title_only" && textMode !== "none" && bodyText) {
    const bodyLines = wrapText(bodyText, maxCharsBody);
    for (const line of bodyLines) {
      elements.push(`<text x="${width / 2}" y="${yOffset}" text-anchor="middle"
        font-family="${font}" font-size="${baseBodySize}" fill="${textColor}" opacity="0.9"
        >${escapeXml(line)}</text>`);
      yOffset += baseBodySize * 1.4;
    }
  }

  // Watermark text
  if (config?.watermark) {
    const wmSize = config.watermarkSize || 24;
    const wmOpacity = parseFloat(config.watermarkOpacity || "0.7");
    let wmX = width - 20;
    let wmY = height - 20;
    let anchor = "end";

    if (config.watermarkPosition === "bottom-left") { wmX = 20; anchor = "start"; }
    else if (config.watermarkPosition === "top-right") { wmY = wmSize + 20; }
    else if (config.watermarkPosition === "top-left") { wmX = 20; wmY = wmSize + 20; anchor = "start"; }

    elements.push(`<text x="${wmX}" y="${wmY}" text-anchor="${anchor}"
      font-family="${font}" font-size="${wmSize}" fill="${textColor}" opacity="${wmOpacity}"
      >${escapeXml(config.watermark)}</text>`);
  }

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${elements.join("\n    ")}
  </svg>`;
}

export async function renderSlide(options: RenderSlideOptions): Promise<Buffer> {
  const { width, height } = DIMENSIONS[options.platform] || DIMENSIONS.instagram;

  let baseImage: sharp.Sharp;

  if (options.backgroundImageUrl) {
    try {
      // Fetch background image
      let imageBuffer: Buffer;
      if (options.backgroundImageUrl.startsWith("data:")) {
        const base64Data = options.backgroundImageUrl.split(",")[1];
        imageBuffer = Buffer.from(base64Data, "base64");
      } else {
        const response = await fetch(options.backgroundImageUrl);
        if (!response.ok) throw new Error("Failed to fetch background image");
        imageBuffer = Buffer.from(await response.arrayBuffer());
      }

      baseImage = sharp(imageBuffer).resize(width, height, { fit: "cover", position: "center" });
    } catch (err) {
      console.error("Error loading background image, using gradient:", err);
      const gradientSvg = createGradientSvg(width, height, options.templateConfig?.bg_gradient || ["#1a1a2e", "#16213e"]);
      baseImage = sharp(Buffer.from(gradientSvg));
    }
  } else {
    // Use gradient background
    const gradientSvg = createGradientSvg(width, height, options.templateConfig?.bg_gradient || ["#1a1a2e", "#16213e"]);
    baseImage = sharp(Buffer.from(gradientSvg));
  }

  // Create text overlay SVG
  const textOverlay = createTextOverlaySvg(width, height, options.title, options.bodyText, options.templateConfig);

  // Composite text over background
  const composites: sharp.OverlayOptions[] = [
    { input: Buffer.from(textOverlay), top: 0, left: 0 },
  ];

  // Add watermark image if configured
  if (options.templateConfig?.watermarkImage) {
    try {
      const wmResponse = await fetch(options.templateConfig.watermarkImage);
      if (wmResponse.ok) {
        const wmBuffer = Buffer.from(await wmResponse.arrayBuffer());
        const wmSize = options.templateConfig.watermarkSize || 40;
        const resizedWm = await sharp(wmBuffer)
          .resize(wmSize, wmSize, { fit: "contain" })
          .png()
          .toBuffer();

        let wmTop = height - wmSize - 20;
        let wmLeft = width - wmSize - 20;

        const pos = options.templateConfig.watermarkPosition || "bottom-right";
        if (pos === "bottom-left") wmLeft = 20;
        else if (pos === "top-right") wmTop = 20;
        else if (pos === "top-left") { wmTop = 20; wmLeft = 20; }

        composites.push({ input: resizedWm, top: wmTop, left: wmLeft });
      }
    } catch (err) {
      console.error("Error loading watermark image:", err);
    }
  }

  const result = await baseImage
    .composite(composites)
    .png({ quality: 90 })
    .toBuffer();

  return result;
}
