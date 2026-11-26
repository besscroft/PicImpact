import ExifReader from "exifreader";
import { rgbaToThumbHash } from "thumbhash";

export type ExifInfo = {
  make: string;
  model: string;
  bits: string;
  dateTime: string;
  exposure_time: string;
  f_number: string;
  exposure_program: string;
  iso_speed_rating: string;
  focal_length: string;
  lens_specification: string;
  lens_model: string;
  exposure_mode: string;
  cfa_pattern: string;
  color_space: string;
  white_balance: string;
};

function emptyExif(): ExifInfo {
  return {
    make: "",
    model: "",
    bits: "",
    dateTime: "",
    exposure_time: "",
    f_number: "",
    exposure_program: "",
    iso_speed_rating: "",
    focal_length: "",
    lens_specification: "",
    lens_model: "",
    exposure_mode: "",
    cfa_pattern: "",
    color_space: "",
    white_balance: "",
  };
}

/**
 * 解析图片 EXIF 信息（与 v3 的 exif 字段结构保持一致，便于备份互通）。
 */
export async function readImageExif(file: ArrayBuffer) {
  const tags = await ExifReader.load(file);
  const exif = emptyExif();
  exif.make = tags?.Make?.description ?? "";
  exif.model = tags?.Model?.description ?? "";
  exif.bits = tags?.["Bits Per Sample"]?.description ?? "";
  exif.dateTime =
    tags?.DateTimeOriginal?.description !== ""
      ? (tags?.DateTimeOriginal?.description ?? "")
      : (tags?.DateTime?.description ?? "");
  exif.exposure_time = tags?.ExposureTime?.description ?? "";
  exif.f_number = tags?.FNumber?.description ?? "";
  exif.exposure_program = tags?.ExposureProgram?.description ?? "";
  exif.iso_speed_rating = tags?.ISOSpeedRatings?.description ?? "";
  exif.focal_length = tags?.FocalLength?.description ?? "";
  exif.lens_specification = tags?.LensSpecification?.description ?? "";
  exif.lens_model = tags?.LensModel?.description ?? "";
  exif.exposure_mode = tags?.ExposureMode?.description ?? "";
  exif.cfa_pattern =
    (tags as Record<string, { description?: string }> | undefined)?.CFAPattern?.description ?? "";
  exif.color_space = tags?.ColorSpace?.description ?? "";
  exif.white_balance = tags?.WhiteBalance?.description ?? "";

  const gpsLat = tags?.GPSLatitude?.description ?? "";
  const gpsLon = tags?.GPSLongitude?.description ?? "";
  return { exif, gpsLat, gpsLon };
}

/**
 * 通过 Image 加载获取宽高。
 */
export function readImageSize(file: Blob) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error("无法解析图片尺寸"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("无法读取文件"));
    reader.readAsDataURL(file);
  });
}

async function loadToCanvas(file: Blob, maxSize: number) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 不可用");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return { canvas, context, width, height };
}

/**
 * 生成缩略图 hash（thumbhash，与 v3 的 encodeBrowserThumbHash 行为一致）。
 */
export async function encodeThumbHash(file: Blob) {
  const { context, width, height } = await loadToCanvas(file, 100);
  const { data } = context.getImageData(0, 0, width, height);
  const hash = rgbaToThumbHash(width, height, new Uint8ClampedArray(data));
  let binary = "";
  for (const byte of hash) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * 压缩生成预览图（canvas 实现，webp 输出，对应 v3 的 compressPreviewImage）。
 */
export async function compressPreviewImage(
  file: Blob,
  options: { quality?: number; maxWidth?: number } = {},
) {
  const quality = options.quality ?? 0.2;
  const bitmap = await createImageBitmap(file);
  const maxWidth = options.maxWidth && options.maxWidth > 0 ? options.maxWidth : bitmap.width;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Canvas 不可用");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), "image/webp", quality),
  );
  if (!blob) throw new Error("预览图压缩失败");
  return blob;
}
