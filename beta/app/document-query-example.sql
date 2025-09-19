-- Query to get transaction documents with all related info
SELECT 
    d.url as file_url,
    d.type as document_type,
    d.original_name,
    d.uploaded_at,
    -- Property info
    p.code as property_code,
    p.title as property_title,
    p.address as property_address,
    -- Transaction info
    t.id as transaction_id,
    t.status as transaction_status,
    -- Buyer info
    buyer.email as buyer_email,
    buyer.first_name as buyer_first_name,
    buyer.last_name as buyer_last_name,
    -- Seller info
    seller.email as seller_email,
    seller.first_name as seller_first_name,
    seller.last_name as seller_last_name,
    -- Uploader info
    uploader.email as uploaded_by
FROM documents d
JOIN transactions t ON d.transaction_id = t.id
JOIN properties p ON t.property_id = p.id
JOIN users buyer ON t.buyer_id = buyer.id
JOIN users seller ON t.seller_id = seller.id
LEFT JOIN users uploader ON d.user_id = uploader.id
WHERE d.transaction_id IS NOT NULL;
