export const foodDetectionPrompt = `
Identifique os alimentos visíveis nesta imagem.

Ignore completamente qualquer objeto que não seja alimento.

NÃO descreva a cena.
NÃO descreva a cozinha.
NÃO liste objetos.
NÃO liste cores.
NÃO liste características visuais.
NÃO explique sua resposta.

Identifique somente alimentos e produtos alimentícios.

Para alimentos individuais, escreva o nome e, quando conseguir,
a quantidade visível.

Exemplos:

4 bananas
2 limões
3 maçãs
1 abacate

Para produtos alimentícios embalados:

2 iogurtes
1 requeijão
1 pacote de biscoito

A embalagem deve ser usada para identificar o alimento, mas não deve
ser tratada como o alimento.

IMPORTANTE:

Mesa NÃO é alimento.
Bandeja NÃO é alimento.
Pote vazio NÃO é alimento.
Escorredor NÃO é alimento.
Celular NÃO é alimento.
Computador NÃO é alimento.
Geladeira NÃO é alimento.
Talheres NÃO são alimentos.

Não inclua esses objetos.

Se houver vários alimentos iguais, tente informar a quantidade
visível.

Se não conseguir contar com segurança, escreva apenas o nome.

Responda apenas com uma lista simples de alimentos.

Exemplo:

Bananas — 4
Limões — 2
Abacates — 3
Iogurte — 2

Não escreva "Objetos".
Não escreva "Alimentos".
Não escreva "Cores".
Não escreva "Cena".
`;
