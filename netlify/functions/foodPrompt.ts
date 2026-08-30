export const foodDetectionPrompt = `
Identifique SOMENTE alimentos visíveis na imagem.

Retorne APENAS JSON seguindo o schema fornecido.

Regras:
- name: nome simples do alimento (ex: "Banana", "Tomate", "Iogurte"). Não inclua "pote", "pacote", "embalagem".
- category: use apenas: vegetables, fruits, dairy, proteins, drinks, pantry, condiments, bakery
- unit:
  - use "un" para frutas/itens individuais (banana, maçã, ovo)
  - use "pct" quando for claramente um pacote fechado
  - use "L/ml" quando for claramente volume
- quantity:
  - se der para contar com confiança, use o número
  - se NÃO der para contar com confiança, use 1 (não chute)
`;

