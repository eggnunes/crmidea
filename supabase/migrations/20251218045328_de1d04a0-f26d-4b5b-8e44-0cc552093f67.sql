-- Adicionar todos os novos tipos de produto ao enum
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'ebook_unitario';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'imersao_idea';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'fraternidade_safe_black';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'clube_mqp';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'fraternidade_safe_pro';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'safe_skills';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'safe_experience';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'mentoria_marcello_safe';