export const foodDetectionSchema = {
  type: "object",

  properties: {
    items: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
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
          },

          quantity: {
            type: "number",
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
          },
        },

        required: [
          "name",
          "category",
          "quantity",
          "unit",
        ],

        additionalProperties: false,
      },
    },
  },

  required: ["items"],

  additionalProperties: false,
};
