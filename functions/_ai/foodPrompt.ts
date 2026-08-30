export const foodDetectionPrompt = `
Identifique SOMENTE alimentos visíveis na imagem.

Retorne APENAS JSON seguindo o schema fornecido.

Regras obrigatórias:
- retorne SOMENTE alimentos reais comestíveis. NUNCA retorne objetos, cores, embalagens, geladeira, prateleiras, mãos, mesa, fundo ou itens não comestíveis.
- não retorne categorias genéricas (como "alimentos", "frutas", "legumes", "verduras", "comida", "itens", "produtos").
- use nomes simples no singular (Banana, Maçã, Tomate, Iogurte, Ovo, Cenoura, Leite, Queijo). Não inclua termos como "pote", "pacote", "embalagem", "fresco".
- category: use apenas: vegetables, fruits, dairy, proteins, drinks, pantry, condiments, bakery
- unit:
  - use "un" para frutas/itens individuais (banana, maçã, ovo)
  - use "pct" quando for claramente um pacote fechado
  - use "L/ml" quando for claramente volume líquido
- quantity:
  - se der para contar com confiança, use o número inteiro
  - se NÃO der para contar com confiança, use 1 (não chute)
`;
