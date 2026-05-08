-- Fix blog image blocks that stored the private S3 endpoint URL instead of the
-- public CDN URL. The image-upload.tsx component was calling onChange(result.url)
-- where result.url pointed to the private R2 S3-compatible endpoint, which requires
-- AWS Signature v4 auth and returns "InvalidArgument: Authorization" in the browser.
--
-- Replaces: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
-- With:     https://pub-ac0fdf282208481fa692b64c2fba1e93.r2.dev/<key>

UPDATE blog_blocks
SET content = jsonb_set(
  content,
  '{url}',
  to_jsonb(
    'https://pub-ac0fdf282208481fa692b64c2fba1e93.r2.dev/' ||
    regexp_replace(
      content->>'url',
      '^https://[^/]+\.r2\.cloudflarestorage\.com/[^/]+/',
      ''
    )
  )
)
WHERE block_type = 'image'
  AND content->>'url' LIKE '%r2.cloudflarestorage.com%';
