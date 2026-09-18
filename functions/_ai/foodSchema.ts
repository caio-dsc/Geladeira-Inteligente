export const foodDetectionSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    items: {
      type: "array",

      description:
        "Lista dos alimentos e bebidas realmente identificáveis na imagem.",

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          name: {
            type: "string",
            description:
              "Nome específico do alimento visualmente identificado. Nunca usar termos genéricos como alimento, comida, item, fruta, vegetal ou produto quando for possível identificar o alimento.",
          },

          category: {
            type: "string",

            enum: [
              "vegetables",
              "fruits",
              "dairy",
              "proteins",
              "drinks",
              "pantry",
              "condiments",
              "bakery",
            ],

            description:
              "Categoria do alimento identificado.",
          },

          quantity: {
            type: "number",
            minimum: 1,
            description:
              "Quantidade visualmente identificável. Use 1 quando a quantidade exata não puder ser determinada.",
          },

          unit: {
            type: "string",

            enum: [
              "un",
              "kg",
              "g",
              "L",
              "ml",
              "pct",
              "fatias",
            ],

            description:
              "Unidade correspondente à quantidade.",
          },
        },

        required: [
          "name",
          "category",
          "quantity",
          "unit",
        ],
      },
    },
  },

  required: ["items"],
};
