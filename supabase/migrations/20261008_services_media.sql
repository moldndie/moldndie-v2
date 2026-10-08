-- Multiple images/videos for services and portfolio examples. Old columns kept.
alter table services
  add column if not exists images     text[] not null default '{}',
  add column if not exists videos     text[] not null default '{}',
  add column if not exists video_urls text[] not null default '{}';

update services set images = array[image]
  where image is not null and image <> '' and images = '{}';

alter table portfolio_items
  add column if not exists video_paths text[] not null default '{}',
  add column if not exists video_urls  text[] not null default '{}';

update portfolio_items set video_paths = array[video_path]
  where video_path is not null and video_path <> '' and video_paths = '{}';
update portfolio_items set video_urls = array[video_url]
  where video_url is not null and video_url <> '' and video_urls = '{}';
