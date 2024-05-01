import { S3Client } from '@aws-sdk/client-s3'

let s3R2Client: S3Client | null = null;

export function getR2Client(findConfig: any[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 R2 配置信息，请配置相应信息。');
  }
  if (s3R2Client) return s3R2Client

  const r2AccesskeyId = findConfig.find((item: any) => item.config_key === 'r2_accesskey_id')?.config_value || '';
  const r2AccesskeySecret = findConfig.find((item: any) => item.config_key === 'r2_accesskey_secret')?.config_value || '';
  const r2Endpoint = findConfig.find((item: any) => item.config_key === 'r2_endpoint')?.config_value || '';

  s3R2Client = new S3Client({
    region: "auto",
    endpoint: r2Endpoint.includes('https://') ? r2Endpoint : `https://${r2Endpoint}`,
    credentials: {
      accessKeyId: r2AccesskeyId,
      secretAccessKey: r2AccesskeySecret,
    },
  });

  return s3R2Client;
}