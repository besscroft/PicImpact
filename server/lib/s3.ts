import { S3Client } from '@aws-sdk/client-s3'
import { fetchS3Info } from '~/server/lib/query'

const findConfig = await fetchS3Info();

const accesskeyId = findConfig.find((item: any) => item.config_key === 'accesskey_id')?.config_value || '';
const accesskeySecret = findConfig.find((item: any) => item.config_key === 'accesskey_secret')?.config_value || '';
const region = findConfig.find((item: any) => item.config_key === 'region')?.config_value || '';
const endpoint = findConfig.find((item: any) => item.config_key === 'endpoint')?.config_value || '';

const s3Client = new S3Client({
  region: region,
  endpoint: `https://${endpoint}`,
  credentials: {
    accessKeyId: accesskeyId,
    secretAccessKey: accesskeySecret,
  },
});

export const s3 = s3Client