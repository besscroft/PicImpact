import { S3Client } from '@aws-sdk/client-s3'

let s3Client: S3Client | null = null;

export function getClient(findConfig: any[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 S3 配置信息，请配置相应信息。');
  }
  if (s3Client) return s3Client

  const accesskeyId = findConfig.find((item: any) => item.config_key === 'accesskey_id')?.config_value || '';
  const accesskeySecret = findConfig.find((item: any) => item.config_key === 'accesskey_secret')?.config_value || '';
  const region = findConfig.find((item: any) => item.config_key === 'region')?.config_value || '';
  const endpoint = findConfig.find((item: any) => item.config_key === 'endpoint')?.config_value || '';
  const forcePathStyle = findConfig.find((item: any) => item.config_key === 'force_path_style')?.config_value;

  if (forcePathStyle && forcePathStyle === 'true') {
    s3Client = new S3Client({
      region: region,
      endpoint: endpoint.includes('https://') ? endpoint : `https://${endpoint}`,
      credentials: {
        accessKeyId: accesskeyId,
        secretAccessKey: accesskeySecret,
      },
      forcePathStyle: true,
    });
  } else {
    s3Client = new S3Client({
      region: region,
      endpoint: endpoint.includes('https://') ? endpoint : `https://${endpoint}`,
      credentials: {
        accessKeyId: accesskeyId,
        secretAccessKey: accesskeySecret,
      },
    });
  }

  return s3Client;
}