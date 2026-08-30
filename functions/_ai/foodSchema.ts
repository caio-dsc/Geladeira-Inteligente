export const foodDetectionSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    items: {
      type: "array",

      items: {
        type: "object",
        additionalProperties: false,

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
            minimum: 1,
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
      },
    },
  },

  required: ["items"],
};
