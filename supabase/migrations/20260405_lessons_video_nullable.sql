-- Ensure video_url is nullable on lessons table.
-- Lessons can now have any combination of media: video_url, video_path, pdf_path, file_path.
ALTER TABLE lessons ALTER COLUMN video_url DROP NOT NULL;
