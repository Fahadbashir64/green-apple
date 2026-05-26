-- Remove legacy brochure/static paths from menu items (use uploads or app placeholder).
UPDATE menu_items
SET image_url = NULL
WHERE image_url LIKE '/assets/images/%';
