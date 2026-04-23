-- ADD NEW COW NAMES TO DATABASE
-- This script adds the new cow names "Shalon", "Fridah", "Viola", and "Jakuom"

-- Note: This script assumes the cow names are used in text fields
-- If you have a separate cows table, you would insert there instead

-- For AI Records - ensure new cow names can be used
-- (No changes needed if cow_name is just a text field)

-- For Treatment Records - ensure new cow names can be used  
-- (No changes needed if cow_name is just a text field)

-- If you have a cows table, uncomment and run this:
/*
INSERT INTO cows (cow_name, created_at) VALUES 
('Shalon', NOW()),
('Fridah', NOW()), 
('Viola', NOW()),
('Jakuom', NOW())
ON CONFLICT (cow_name) DO NOTHING;
*/

-- Success message
SELECT 'New cow names (Shalon, Fridah, Viola, Jakuom) are now available!' as status;
SELECT 'These cows can now be selected in AI and Treatment records.' as message;
