-- 第一次初始化数据库时，执行这个 sql 文件内的 sql
INSERT INTO "public"."Configs" VALUES (1, 'accesskey_id', '', '阿里 OSS / AWS S3 AccessKey_ID', '2023-12-25 16:45:54.284484', NULL);
INSERT INTO "public"."Configs" VALUES (2, 'accesskey_secret', '', '阿里 OSS / AWS S3 AccessKey_Secret', '2023-12-25 16:46:02.552455', NULL);
INSERT INTO "public"."Configs" VALUES (3, 'region', '', '阿里 OSS / AWS S3 Region 地域，如：oss-cn-hongkong', '2023-12-25 16:46:14.881791', NULL);
INSERT INTO "public"."Configs" VALUES (4, 'endpoint', '', '阿里 OSS / AWS S3 Endpoint 地域节点，如：oss-cn-hongkong.aliyuncs.com', '2023-12-25 16:46:26.247859', NULL);
INSERT INTO "public"."Configs" VALUES (5, 'bucket', '', '阿里 OSS / AWS S3 Bucket 存储桶名称，如：picimpact', '2023-12-25 16:46:38.700241', NULL);
INSERT INTO "public"."Configs" VALUES (6, 'storage_folder', 'picimpact', '存储文件夹(S3)，严格格式，如：picimpact 或 picimpact/images ，填 / 或者不填表示根路径', '2023-12-25 16:46:50.732653', NULL);
INSERT INTO "public"."Configs" VALUES (7, 'alist_token', '', 'alist 令牌 ', '2023-12-25 16:45:08.661365', NULL);
INSERT INTO "public"."Configs" VALUES (8, 'alist_url', '', 'AList 地址，如：https://alist.besscroft.com', '2023-12-25 16:44:55.289006', NULL);
INSERT INTO "public"."Configs" VALUES (9, 'secret_key', 'pic-impact', 'SECRET_KEY', '2023-12-25 16:44:55.289006', NULL);

INSERT INTO "public"."User" VALUES (1, 'admin', 'admin@qq.com', '51630b15b0cec2da9926af7015db33b7809f9d24959a0d48665b83e9d19216cd5601d08a622a8b2c48709d5bbb62eef6ae76addce5d18703b28965eef62d491b', null, 'https://bbs-static.miyoushe.com/communityweb/upload/97734c89374997c7c87d5af5f7442171.png');
