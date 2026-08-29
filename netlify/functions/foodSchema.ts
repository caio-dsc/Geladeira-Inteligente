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
              "other",
            ],
          },

          quantity: {
            type: "number",
            minimum: 0,
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

          state: {
            type: "string",
            enum: [
              "fresh",
              "attention",
              "expiring_soon",
              "frozen",
            ],
          },

          location: {
            type: "string",
            enum: [
              "geladeira",
              "freezer",
              "gaveta_legumes",
              "porta",
              "despensa",
            ],
          },

          confidence: {
            type: "number",
            minimum: 0,
            maximum: 1,
          },

          expiryDate: {
            type: ["string", "null"],
          },

          expirySource: {
            type: ["string", "null"],
            enum: ["image", null],
          },
        },

        required: [
          "name",
          "category",
          "quantity",
          "unit",
          "state",
          "location",
          "confidence",
          "expiryDate",
          "expirySource",
        ],
      },
    },
  },

  required: ["items"],
};
