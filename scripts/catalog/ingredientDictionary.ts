import { normalizeText } from './utils';

// chave sempre normalizada (lowercase, sem acento)
const EN_TO_PT: Record<string, string> = {
  // Vegetais / temperos
  'onion': 'Cebola', 'onions': 'Cebola', 'red onion': 'Cebola roxa', 'spring onion': 'Cebolinha',
  'scallions': 'Cebolinha', 'garlic': 'Alho', 'garlic clove': 'Alho', 'tomato': 'Tomate',
  'tomatoes': 'Tomate', 'cherry tomatoes': 'Tomate cereja', 'tomato puree': 'Molho de tomate',
  'tomato paste': 'Extrato de tomate', 'potato': 'Batata', 'potatoes': 'Batata',
  'sweet potato': 'Batata doce', 'carrot': 'Cenoura', 'carrots': 'Cenoura',
  'bell pepper': 'Pimentão', 'red pepper': 'Pimentão vermelho', 'green pepper': 'Pimentão verde',
  'yellow pepper': 'Pimentão amarelo', 'chilli': 'Pimenta', 'chili': 'Pimenta',
  'red chilli': 'Pimenta vermelha', 'green chilli': 'Pimenta verde', 'jalapeno': 'Pimenta jalapeño',
  'cucumber': 'Pepino', 'lettuce': 'Alface', 'spinach': 'Espinafre', 'kale': 'Couve',
  'cabbage': 'Repolho', 'broccoli': 'Brócolis', 'cauliflower': 'Couve-flor',
  'zucchini': 'Abobrinha', 'courgette': 'Abobrinha', 'aubergine': 'Berinjela', 'eggplant': 'Berinjela',
  'pumpkin': 'Abóbora', 'squash': 'Abóbora', 'corn': 'Milho', 'sweetcorn': 'Milho',
  'peas': 'Ervilha', 'green beans': 'Vagem', 'mushrooms': 'Cogumelo', 'mushroom': 'Cogumelo',
  'celery': 'Salsão', 'leek': 'Alho-poró', 'ginger': 'Gengibre', 'okra': 'Quiabo',
  'cassava': 'Mandioca', 'manioc': 'Mandioca', 'yuca': 'Mandioca', 'plantain': 'Banana da terra',
  'hearts of palm': 'Palmito', 'palm hearts': 'Palmito', 'avocado': 'Abacate',
  'parsley': 'Salsinha', 'coriander': 'Coentro', 'cilantro': 'Coentro', 'basil': 'Manjericão',
  'oregano': 'Orégano', 'thyme': 'Tomilho', 'rosemary': 'Alecrim', 'bay leaf': 'Folha de louro',
  'bay leaves': 'Folha de louro', 'mint': 'Hortelã', 'dill': 'Endro', 'chives': 'Cebolinha',
  'cumin': 'Cominho', 'paprika': 'Páprica', 'turmeric': 'Cúrcuma', 'cinnamon': 'Canela',
  'nutmeg': 'Noz-moscada', 'cloves': 'Cravo', 'black pepper': 'Pimenta do reino', 'pepper': 'Pimenta do reino',
  'salt': 'Sal', 'sea salt': 'Sal', 'sugar': 'Açúcar', 'brown sugar': 'Açúcar mascavo',
  'caster sugar': 'Açúcar', 'icing sugar': 'Açúcar de confeiteiro', 'honey': 'Mel',
  'vanilla': 'Baunilha', 'vanilla extract': 'Essência de baunilha', 'cocoa': 'Cacau em pó',
  'cocoa powder': 'Cacau em pó', 'chocolate': 'Chocolate', 'dark chocolate': 'Chocolate meio amargo',
  'milk chocolate': 'Chocolate ao leite', 'chocolate chips': 'Gotas de chocolate',

  // Frutas
  'banana': 'Banana', 'bananas': 'Banana', 'apple': 'Maçã', 'apples': 'Maçã', 'orange': 'Laranja',
  'lemon': 'Limão siciliano', 'lemon juice': 'Suco de limão', 'lime': 'Limão', 'lime juice': 'Suco de limão',
  'lime zest': 'Raspas de limão', 'strawberries': 'Morango', 'strawberry': 'Morango',
  'pineapple': 'Abacaxi', 'mango': 'Manga', 'coconut': 'Coco', 'desiccated coconut': 'Coco ralado',
  'coconut milk': 'Leite de coco', 'coconut cream': 'Creme de coco', 'passion fruit': 'Maracujá',
  'papaya': 'Mamão', 'guava': 'Goiaba', 'raisins': 'Uva passa', 'grapes': 'Uva',
  'peach': 'Pêssego', 'pear': 'Pera', 'blueberries': 'Mirtilo', 'cherries': 'Cereja',

  // Proteínas
  'chicken': 'Frango', 'chicken breast': 'Peito de frango', 'chicken breasts': 'Peito de frango',
  'chicken thighs': 'Sobrecoxa de frango', 'chicken legs': 'Coxa de frango', 'chicken stock': 'Caldo de frango',
  'beef': 'Carne bovina', 'beef mince': 'Carne moída', 'minced beef': 'Carne moída', 'ground beef': 'Carne moída',
  'beef stock': 'Caldo de carne', 'steak': 'Bife', 'beef brisket': 'Peito bovino', 'sirloin': 'Contrafilé',
  'pork': 'Carne de porco', 'pork chops': 'Bisteca de porco', 'pork belly': 'Barriga de porco',
  'pork ribs': 'Costelinha de porco', 'bacon': 'Bacon', 'ham': 'Presunto', 'sausage': 'Linguiça',
  'sausages': 'Linguiça', 'chorizo': 'Linguiça calabresa', 'smoked sausage': 'Linguiça defumada',
  'lamb': 'Cordeiro', 'turkey': 'Peru', 'duck': 'Pato',
  'fish': 'Peixe', 'white fish': 'Peixe branco', 'cod': 'Bacalhau', 'salt cod': 'Bacalhau',
  'salmon': 'Salmão', 'tuna': 'Atum', 'tilapia': 'Tilápia', 'sardines': 'Sardinha',
  'prawns': 'Camarão', 'shrimp': 'Camarão', 'king prawns': 'Camarão', 'squid': 'Lula',
  'mussels': 'Mexilhão', 'clams': 'Marisco', 'crab': 'Caranguejo',
  'egg': 'Ovo', 'eggs': 'Ovo', 'egg yolks': 'Gema de ovo', 'egg whites': 'Clara de ovo',
  'tofu': 'Tofu', 'black beans': 'Feijão preto', 'kidney beans': 'Feijão vermelho', 'beans': 'Feijão',
  'lentils': 'Lentilha', 'chickpeas': 'Grão-de-bico', 'peanuts': 'Amendoim', 'cashew nuts': 'Castanha de caju',
  'cashews': 'Castanha de caju', 'almonds': 'Amêndoa', 'walnuts': 'Nozes', 'brazil nuts': 'Castanha-do-pará',

  // Laticínios
  'milk': 'Leite', 'whole milk': 'Leite integral', 'condensed milk': 'Leite condensado',
  'evaporated milk': 'Leite evaporado', 'butter': 'Manteiga', 'unsalted butter': 'Manteiga',
  'cream': 'Creme de leite', 'double cream': 'Creme de leite', 'heavy cream': 'Creme de leite',
  'sour cream': 'Creme azedo', 'whipped cream': 'Chantilly', 'cream cheese': 'Cream cheese',
  'cheese': 'Queijo', 'cheddar cheese': 'Queijo cheddar', 'parmesan': 'Queijo parmesão',
  'parmesan cheese': 'Queijo parmesão', 'mozzarella': 'Mussarela', 'feta': 'Queijo feta',
  'yogurt': 'Iogurte', 'yoghurt': 'Iogurte', 'greek yogurt': 'Iogurte grego',

  // Despensa
  'flour': 'Farinha de trigo', 'plain flour': 'Farinha de trigo', 'all-purpose flour': 'Farinha de trigo',
  'self-raising flour': 'Farinha de trigo com fermento', 'cornflour': 'Amido de milho',
  'cornstarch': 'Amido de milho', 'cornmeal': 'Fubá', 'polenta': 'Fubá', 'cassava flour': 'Farinha de mandioca',
  'manioc flour': 'Farinha de mandioca', 'tapioca flour': 'Polvilho', 'tapioca starch': 'Polvilho',
  'breadcrumbs': 'Farinha de rosca', 'bread': 'Pão', 'baking powder': 'Fermento em pó',
  'baking soda': 'Bicarbonato de sódio', 'bicarbonate of soda': 'Bicarbonato de sódio', 'yeast': 'Fermento biológico',
  'rice': 'Arroz', 'white rice': 'Arroz', 'basmati rice': 'Arroz', 'pasta': 'Macarrão', 'spaghetti': 'Espaguete',
  'noodles': 'Macarrão', 'oats': 'Aveia', 'quinoa': 'Quinoa',
  'olive oil': 'Azeite', 'extra virgin olive oil': 'Azeite', 'vegetable oil': 'Óleo', 'oil': 'Óleo',
  'sunflower oil': 'Óleo de girassol', 'palm oil': 'Azeite de dendê', 'dende oil': 'Azeite de dendê',
  'vinegar': 'Vinagre', 'white wine vinegar': 'Vinagre', 'apple cider vinegar': 'Vinagre de maçã',
  'soy sauce': 'Molho shoyu', 'worcestershire sauce': 'Molho inglês', 'mustard': 'Mostarda',
  'ketchup': 'Ketchup', 'mayonnaise': 'Maionese', 'tomato ketchup': 'Ketchup',
  'stock': 'Caldo', 'vegetable stock': 'Caldo de legumes', 'water': 'Água',
  'white wine': 'Vinho branco', 'red wine': 'Vinho tinto', 'beer': 'Cerveja', 'cachaca': 'Cachaça',
  'coffee': 'Café', 'orange juice': 'Suco de laranja',
};

// Normaliza todas as chaves uma vez
const DICT = new Map<string, string>();
for (const [k, v] of Object.entries(EN_TO_PT)) DICT.set(normalizeText(k), v);

export function translateIngredient(nameEn: string): string {
  const raw = (nameEn || '').trim();
  if (!raw) return raw;

  const key = normalizeText(raw);

  // 1) match exato
  const exact = DICT.get(key);
  if (exact) return exact;

  // 2) singular simples (tomatoes -> tomato, onions -> onion)
  const singular = key.replace(/ies$/, 'y').replace(/es$/, '').replace(/s$/, '');
  const sing = DICT.get(singular);
  if (sing) return sing;

  // 3) contém uma chave conhecida (ex: "large onion" -> onion)
  let best: { k: string; v: string } | null = null;
  for (const [k, v] of DICT) {
    if (key.includes(k) && (!best || k.length > best.k.length)) best = { k, v };
  }
  if (best) return best.v;

  // 4) não traduzido: mantém original (vai aparecer, mas sem match)
  return raw;
}
