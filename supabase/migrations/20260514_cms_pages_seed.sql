-- Seed initial CMS page stubs for legal pages.
-- Uses ON CONFLICT DO NOTHING so existing admin-edited content is NEVER overwritten.
-- Content starts empty — admins fill it via the CMS dashboard.

INSERT INTO cms_pages (slug, title, content, seo_title, seo_description, is_published)
VALUES
  (
    'privacy-policy',
    'Privacy Policy',
    NULL,
    'Privacy Policy | MoldNDie',
    'Learn how MoldNDie collects, uses, and protects your personal data.',
    false
  ),
  (
    'terms-of-use',
    'Terms of Use',
    NULL,
    'Terms of Use | MoldNDie',
    'Read the terms and conditions governing your use of the MoldNDie platform.',
    false
  ),
  (
    'refund-policy',
    'Refund Policy',
    NULL,
    'Refund Policy | MoldNDie',
    'Learn about MoldNDie''s refund and cancellation policy for digital content purchases.',
    false
  )
ON CONFLICT (slug) DO NOTHING;
