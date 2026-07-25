export type Product = {
  name: string;
  price_jpy: number;
  description: string;
  story: string;
};

export type Method = {
  name: string;
  steps: string[];
  sensory_cues: string[];
  secrets: string[];
};

export type ShopCodex = {
  shop: { name: string; location: string; founded: string; story: string };
  owner: { name: string; age: string; voice_tone: string; greeting_style: string };
  products: Product[];
  methods: Method[];
  suppliers: string[];
  regulars: string[];
  rules: string[];
  gaps: string[];
};

export function emptyCodex(): ShopCodex {
  return {
    shop: { name: "", location: "", founded: "", story: "" },
    owner: { name: "", age: "", voice_tone: "", greeting_style: "" },
    products: [],
    methods: [],
    suppliers: [],
    regulars: [],
    rules: [],
    gaps: [],
  };
}

export function parseCodex(raw: string): ShopCodex {
  if (!raw.trim()) return emptyCodex();
  try {
    return JSON.parse(raw);
  } catch {
    return emptyCodex();
  }
}
