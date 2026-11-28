import ExifReader from "exifreader";
import { heicTo } from "heic-to";
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

function emptyExif(): ExifInfo {  return {
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
 * exifreader 的 description 不保证是 string（如 ISOSpeedRatings 会返回 number），
 * 统一归一化，避免非 string 字段流入下游（ExifInfo 声明全为 string）。
 */
function exifDesc(tag: unknown): string {
  const value = (tag as { description?: unknown } | undefined)?.description;
  return value === undefined || value === null ? "" : String(value);
}

/**
 * 解析图片 EXIF 信息（与 v3 的 exif 字段结构保持一致，便于备份互通）。
 */
export async function readImageExif(file: ArrayBuffer) {
  const tags = await ExifReader.load(file);
  const exif = emptyExif();
  exif.make = exifDesc(tags?.Make);
  exif.model = exifDesc(tags?.Model);
  exif.bits = exifDesc(tags?.["Bits Per Sample"]);
  exif.dateTime = exifDesc(tags?.DateTimeOriginal) || exifDesc(tags?.DateTime);
  exif.exposure_time = exifDesc(tags?.ExposureTime);
  exif.f_number = exifDesc(tags?.FNumber);
  exif.exposure_program = exifDesc(tags?.ExposureProgram);
  exif.iso_speed_rating = exifDesc(tags?.ISOSpeedRatings);
  exif.focal_length = exifDesc(tags?.FocalLength);
  exif.lens_specification = exifDesc(tags?.LensSpecification);
  exif.lens_model = exifDesc(tags?.LensModel);
  exif.exposure_mode = exifDesc(tags?.ExposureMode);
  exif.cfa_pattern = exifDesc(tags?.CFAPattern);
  exif.color_space = exifDesc(tags?.ColorSpace);
  exif.white_balance = exifDesc(tags?.WhiteBalance);

  const gpsLat = exifDesc(tags?.GPSLatitude);
  const gpsLon = exifDesc(tags?.GPSLongitude);
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

/**
 * 同步判断是否 HEIC/HEIF 文件。部分浏览器对 HEIC 的 MIME 为空，扩展名兜底。
 */
export function isHeicFile(file: File) {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

/**
 * HEIC 转 JPG（iPhone 直出等浏览器无法解码的格式）。转换后的文件作为上传对象，
 * 使前台 <img> 可正常显示；转换本身失败时抛错，由调用方降级原样上传。
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  const blob = await heicTo({ blob: file, type: "image/jpeg", quality: 0.9 });
  const stem = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${stem}.jpg`, { type: "image/jpeg" });
}
