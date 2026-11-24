-- 为 data->>'model' 创建 B-tree 索引
CREATE INDEX "images_data_model_idx" ON "images" USING BTREE ((exif->>'model'));

-- 为 data->>'lens_model' 创建 B-tree 索引
CREATE INDEX "images_data_lens_model_idx" ON "images" USING BTREE ((exif->>'lens_model'));