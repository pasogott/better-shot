import { convertFileSrc } from "@tauri-apps/api/core";
import { Store } from "@tauri-apps/plugin-store";
import { createHighQualityCanvas } from "./canvas-utils";
import { resolveBackgroundPath, getDefaultBackgroundPath } from "./asset-registry";
import { appendForensicMetadata } from "./forensic-metadata";

type BackgroundType = "transparent" | "white" | "black" | "gray" | "custom" | "image" | "gradient";

interface AutoProcessOptions {
  timestampUtc?: string;
}

export async function processScreenshotWithDefaultBackground(
  imagePath: string,
  options: AutoProcessOptions = {}
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let backgroundType: BackgroundType = "image";
    let customColor = "#667eea";
    let defaultBgImage: string = getDefaultBackgroundPath();
    let bgImage: HTMLImageElement | null = null;
    let forensicEnabled = false;
    let forensicTeam = "";
    let forensicUser = "";
    
    try {
      const store = await Store.load("settings.json");
      const storedBgType = await store.get<BackgroundType>("defaultBackgroundType");
      const storedCustomColor = await store.get<string>("defaultCustomColor");
      const storedDefaultBg = await store.get<string>("defaultBackgroundImage");
      const storedForensicEnabled = await store.get<boolean>("forensicMetadataEnabled");
      const storedForensicTeam = await store.get<string>("forensicTeam");
      const storedForensicUser = await store.get<string>("forensicUser");
      
      if (storedBgType) {
        backgroundType = storedBgType;
      }
      if (storedCustomColor) {
        customColor = storedCustomColor;
      }
      if (storedDefaultBg && (backgroundType === "image" || backgroundType === "gradient")) {
        defaultBgImage = resolveBackgroundPath(storedDefaultBg);
      }
      if (storedForensicEnabled !== null && storedForensicEnabled !== undefined) {
        forensicEnabled = storedForensicEnabled;
      }
      if (storedForensicTeam) {
        forensicTeam = storedForensicTeam;
      }
      if (storedForensicUser) {
        forensicUser = storedForensicUser;
      }
    } catch (err) {
      console.error("Failed to load default background from settings:", err);
    }

    const buildUserLabel = (team: string, user: string) => {
      const safeTeam = team.trim() || "unknown";
      const safeUser = user.trim() || "unknown";
      return `${safeTeam}/${safeUser}`;
    };

    const applyForensicMetadata = (canvas: HTMLCanvasElement) => {
      if (!forensicEnabled) {
        return canvas;
      }
      const timestampUtc = options.timestampUtc ?? new Date().toISOString();
      return appendForensicMetadata(canvas, {
        timestampUtc,
        userLabel: buildUserLabel(forensicTeam, forensicUser),
      });
    };

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = async () => {
      try {
        if (backgroundType === "image" || backgroundType === "gradient") {
          bgImage = new Image();
          bgImage.crossOrigin = "anonymous";
          
          bgImage.onload = () => {
            try {
              const isGradient = backgroundType === "gradient";
              const canvas = createHighQualityCanvas({
                image: img,
                backgroundType,
                customColor,
                selectedImage: isGradient ? null : defaultBgImage,
                bgImage: isGradient ? null : bgImage,
                blurAmount: 0,
                noiseAmount: 20,
                borderRadius: 18,
                padding: 100,
                gradientImage: isGradient ? bgImage : null,
                shadow: {
                  blur: 33,
                  offsetX: 18,
                  offsetY: 23,
                  opacity: 39,
                },
              });

              const outputCanvas = applyForensicMetadata(canvas);

              outputCanvas.toBlob(
                (blob) => {
                  if (blob) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      resolve(reader.result as string);
                    };
                    reader.onerror = () => {
                      reject(new Error("Failed to read processed image"));
                    };
                    reader.readAsDataURL(blob);
                  } else {
                    reject(new Error("Failed to create blob from canvas"));
                  }
                },
                "image/png",
                1.0
              );
            } catch (err) {
              reject(err);
            }
          };
          
          bgImage.onerror = () => {
            reject(new Error("Failed to load background image"));
          };
          
          bgImage.src = defaultBgImage;
        } else {
          try {
            const isTransparent = backgroundType === "transparent";
            const canvas = createHighQualityCanvas({
              image: img,
              backgroundType,
              customColor,
              selectedImage: null,
              bgImage: null,
              gradientImage: null,
              blurAmount: 0,
              noiseAmount: 20,
              borderRadius: 18,
              padding: isTransparent ? 0 : 100,
              shadow: isTransparent ? {
                blur: 0,
                offsetX: 0,
                offsetY: 0,
                opacity: 0,
              } : {
                blur: 33,
                offsetX: 18,
                offsetY: 23,
                opacity: 39,
              },
            });

            const outputCanvas = applyForensicMetadata(canvas);

            outputCanvas.toBlob(
              (blob) => {
                if (blob) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resolve(reader.result as string);
                  };
                  reader.onerror = () => {
                    reject(new Error("Failed to read processed image"));
                  };
                  reader.readAsDataURL(blob);
                } else {
                  reject(new Error("Failed to create blob from canvas"));
                }
              },
              "image/png",
              1.0
            );
          } catch (err) {
            reject(err);
          }
        }
      } catch (err) {
        reject(err);
      }
    };
    
    img.onerror = () => {
      reject(new Error(`Failed to load image from: ${imagePath}`));
    };

    const assetUrl = convertFileSrc(imagePath);
    img.src = assetUrl;
  });
}
