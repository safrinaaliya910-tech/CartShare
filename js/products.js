/**
 * @file products.js
 * @description Curated "The Stalls" product catalogue for CartShare.
 * Contains 38 realistic everyday grocery items across 7 categories.
 * All prices stored in integer paise (1 Rupee = 100 Paise).
 */

export const CATEGORIES = [
  "All Stalls",
  "Fruits & Veg",
  "Dairy & Eggs",
  "Bakery",
  "Pantry & Grains",
  "Snacks",
  "Beverages",
  "Household & Care"
];

export const CATEGORY_META = {
  "All Stalls":       { icon: "bi-shop-window", emoji: "🧺", accent: "#7A1F2B" },
  "Fruits & Veg":     { icon: "bi-apple",       emoji: "🥭", accent: "#2D6A4F" },
  "Dairy & Eggs":     { icon: "bi-droplet-half",emoji: "🥛", accent: "#1D4E89" },
  "Bakery":           { icon: "bi-Croissant",   emoji: "🥐", accent: "#9C5221" },
  "Pantry & Grains":  { icon: "bi-basket3",     emoji: "🌾", accent: "#8C5E1A" },
  "Snacks":           { icon: "bi-cookie",      emoji: "🥜", accent: "#A43820" },
  "Beverages":        { icon: "bi-cup-hot",     emoji: "☕", accent: "#4A3525" },
  "Household & Care": { icon: "bi-stars",       emoji: "🌿", accent: "#386641" }
};

export const PRODUCTS = [
  // --- 1. Fruits & Veg ---
  {
    id: "p_alphonso_mangoes_1kg",
    name: "Ratnagiri Alphonso Mangoes",
    category: "Fruits & Veg",
    unit: "1 kg (approx 4–5 pcs)",
    badge: "GI Tagged Orchard",
    priceInPaise: 42000, // ₹420
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=700&q=80",
    backupImage: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?auto=format&fit=crop&w=700&q=80",
    featured: true
  },
  {
    id: "p_shimla_apples_1kg",
    name: "Crisp Shimla Royal Apples",
    category: "Fruits & Veg",
    unit: "1 kg (4 pcs)",
    badge: "Himachal Harvest",
    priceInPaise: 18000, // ₹180
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_robusta_bananas_1dz",
    name: "Organic Robusta Bananas",
    category: "Fruits & Veg",
    unit: "1 Dozen",
    badge: "Naturally Ripened",
    priceInPaise: 7500, // ₹75
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_farm_spinach_250g",
    name: "Hydroponic Baby Spinach",
    category: "Fruits & Veg",
    unit: "250 g bunch",
    badge: "Pesticide-Free",
    priceInPaise: 4500, // ₹45
    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_red_onions_2kg",
    name: "Nashik Red Onions",
    category: "Fruits & Veg",
    unit: "2 kg mesh bag",
    badge: "Farm Direct",
    priceInPaise: 9000, // ₹90
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_vine_tomatoes_1kg",
    name: "Vine Ripe Country Tomatoes",
    category: "Fruits & Veg",
    unit: "1 kg",
    badge: "Heirloom Vine",
    priceInPaise: 5500, // ₹55
    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=700&q=80"
  },

  // --- 2. Dairy & Eggs ---
  {
    id: "p_organic_cow_milk_1l",
    name: "Farm Fresh A2 Cow Milk",
    category: "Dairy & Eggs",
    unit: "1 Litre glass bottle",
    badge: "Morning Milking",
    priceInPaise: 8500, // ₹85
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_free_range_eggs_6pk",
    name: "Pasture-Raised Brown Eggs",
    category: "Dairy & Eggs",
    unit: "Pack of 6",
    badge: "Free-Range",
    priceInPaise: 9500, // ₹95
    image: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_artisanal_paneer_200g",
    name: "Malai Paneer Block",
    category: "Dairy & Eggs",
    unit: "200 g vacuum pack",
    badge: "Freshly Pressed",
    priceInPaise: 11000, // ₹110
    image: "assets/images/malai_panner.png",
    backupImage: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=700&q=80",
    featured: true
  },
  {
    id: "p_salted_butter_500g",
    name: "Table Salted Cultured Butter",
    category: "Dairy & Eggs",
    unit: "500 g",
    badge: "Slow Churned",
    priceInPaise: 27500, // ₹275
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_greek_yogurt_400g",
    name: "Natural Strained Greek Yogurt",
    category: "Dairy & Eggs",
    unit: "400 g clay-style tub",
    badge: "High Protein",
    priceInPaise: 16000, // ₹160
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_mozzarella_block_200g",
    name: "Fresh Mozzarella Cheese",
    category: "Dairy & Eggs",
    unit: "200 g",
    badge: "Artisanal Curd",
    priceInPaise: 19500, // ₹195
    image: "https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=700&q=80"
  },

  // --- 3. Bakery ---
  {
    id: "p_sourdough_boule",
    name: "Artisan Sourdough Boule",
    category: "Bakery",
    unit: "450 g crusty loaf",
    badge: "36h Fermented",
    priceInPaise: 22000, // ₹220
    image: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_multigrain_pav_6pk",
    name: "Soft Multigrain Pav Buns",
    category: "Bakery",
    unit: "Pack of 6",
    badge: "7-Seed Crust",
    priceInPaise: 5000, // ₹50
    image: "assets/images/Soft Multigrain Pav Buns.png",
    backupImage: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_butter_croissant_2pk",
    name: "French Butter Croissants",
    category: "Bakery",
    unit: "Pack of 2",
    badge: "All-Butter Laminated",
    priceInPaise: 15000, // ₹150
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_whole_wheat_bagels_4pk",
    name: "Toasted Sesame Bagels",
    category: "Bakery",
    unit: "Pack of 4",
    badge: "Kettle Boiled",
    priceInPaise: 14000, // ₹140
    image: "assets/images/Toasted Sesame Bagels.png",
    backupImage: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_honey_almond_granola_350g",
    name: "Toasted Honey Almond Granola",
    category: "Bakery",
    unit: "350 g glass jar",
    badge: "Wildflower Honey",
    priceInPaise: 32000, // ₹320
    image: "assets/images/toasted alomnd.png",
    backupImage: "https://images.unsplash.com/photo-1517673400267-0251440c45dc?auto=format&fit=crop&w=700&q=80",
    featured: true
  },

  // --- 4. Pantry & Grains ---
  {
    id: "p_daawat_basmati_1kg",
    name: "Traditional Aged Basmati Rice",
    category: "Pantry & Grains",
    unit: "1 kg cloth bag",
    badge: "2-Year Aged",
    priceInPaise: 19500, // ₹195
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_mustard_oil_1l",
    name: "Cold-Pressed Kachi Ghani Mustard Oil",
    category: "Pantry & Grains",
    unit: "1 Litre glass bottle",
    badge: "Wood Pressed",
    priceInPaise: 21000, // ₹210
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_toor_dal_1kg",
    name: "Organic Unpolished Toor Dal",
    category: "Pantry & Grains",
    unit: "1 kg",
    badge: "Unpolished Heirloom",
    priceInPaise: 16500, // ₹165
    image: "assets/images/Organic Unpolished Toor Dal.png",
    backupImage: "https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_sharbati_atta_5kg",
    name: "Stone-Ground Sharbati Atta",
    category: "Pantry & Grains",
    unit: "5 kg sack",
    badge: "MP Sehore Wheat",
    priceInPaise: 31000, // ₹310
    image: "https://images.unsplash.com/photo-1627485937980-221c88ac04f9?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_kashmiri_saffron_1g",
    name: "Pure Kashmiri Mongra Saffron",
    category: "Pantry & Grains",
    unit: "1 g brass tin",
    badge: "Pampore Grade A+",
    priceInPaise: 49000, // ₹490
    image: "assets/images/Pure Kashmiri Mongra Saffron.png",
    backupImage: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_pink_salt_1kg",
    name: "Coarse Himalayan Pink Salt",
    category: "Pantry & Grains",
    unit: "1 kg jar",
    badge: "Mineral Rich",
    priceInPaise: 8000, // ₹80
    image: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=700&q=80"
  },

  // --- 5. Snacks ---
  {
    id: "p_roasted_makhana_100g",
    name: "Himalayan Salt Roasted Makhana",
    category: "Snacks",
    unit: "100 g pouch",
    badge: "Mithila Foxnuts",
    priceInPaise: 14000, // ₹140
    image: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_kerala_banana_chips_200g",
    name: "Coconut Oil Banana Chips",
    category: "Snacks",
    unit: "200 g pack",
    badge: "Kozhikode Batch",
    priceInPaise: 11000, // ₹110
    image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_masala_cashews_150g",
    name: "Pepper Roasted Goan Cashews",
    category: "Snacks",
    unit: "150 g tin canister",
    badge: "Whole W240 Grade",
    priceInPaise: 29000, // ₹290
    image: "assets/images/pepper roasted.png",
    backupImage: "https://images.unsplash.com/photo-1626056087728-05c3d180911a?auto=format&fit=crop&w=700&q=80",
    featured: true
  },
  {
    id: "p_dark_chocolate_80g",
    name: "70% Single Origin Idukki Dark Chocolate",
    category: "Snacks",
    unit: "80 g craft bar",
    badge: "Bean-to-Bar",
    priceInPaise: 22500, // ₹225
    image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_roasted_pistachios_200g",
    name: "Lightly Salted California Pistachios",
    category: "Snacks",
    unit: "200 g pouch",
    badge: "Small-Batch Roast",
    priceInPaise: 35000, // ₹350
    image: "assets/images/Lightly Salted California Pistachios.png",
    backupImage: "https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=700&q=80"
  },

  // --- 6. Beverages ---
  {
    id: "p_assam_tea_250g",
    name: "Single-Estate CTC Assam Tea",
    category: "Beverages",
    unit: "250 g caddy tin",
    badge: "Second Flush",
    priceInPaise: 24000, // ₹240
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_arabica_filter_coffee_250g",
    name: "Chikmagalur Arabica Roast Ground",
    category: "Beverages",
    unit: "250 g valve pack",
    badge: "80:20 Blend",
    priceInPaise: 28000, // ₹280
    image: "assets/images/Chikmagalur Arabica Roast Ground.png",
    backupImage: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_tender_coconut_water_1l",
    name: "Raw Tender Coconut Water",
    category: "Beverages",
    unit: "1 Litre chilled bottle",
    badge: "Pollachi Groves",
    priceInPaise: 13500, // ₹135
    image: "assets/images/Raw Tender Coconut Water.png",
    backupImage: "https://images.unsplash.com/photo-1544860707-c352cc5a92e3?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_sparkling_lemon_soda_330ml",
    name: "Handcrafted Ginger Lemon Fizz",
    category: "Beverages",
    unit: "4 × 330 ml glass bottles",
    badge: "Real Ginger Root",
    priceInPaise: 16000, // ₹160
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_spiced_masala_chai_mix_200g",
    name: "Whole Spice Masala Chai Blend",
    category: "Beverages",
    unit: "200 g tin",
    badge: "6-Spice Mortar",
    priceInPaise: 19500, // ₹195
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=700&q=80"
  },

  // --- 7. Household & Care ---
  {
    id: "p_neem_dish_soap_500ml",
    name: "Neem & Citrus Liquid Dish Wash",
    category: "Household & Care",
    unit: "500 ml pump bottle",
    badge: "Plant-Derived",
    priceInPaise: 12500, // ₹125
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=80",
    backupImage: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_bamboo_toothbrushes_4pk",
    name: "Biodegradable Bamboo Toothbrushes",
    category: "Household & Care",
    unit: "Family Pack of 4",
    badge: "Zero Plastic",
    priceInPaise: 18000, // ₹180
    image: "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_eucalyptus_cleaner_1l",
    name: "Natural Pine & Eucalyptus Floor Cleaner",
    category: "Household & Care",
    unit: "1 Litre bottle",
    badge: "Nilgiri Essential Oil",
    priceInPaise: 16500, // ₹165
    image: "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=700&q=80",
    backupImage: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_coir_scrubbers_3pk",
    name: "Natural Coconut Fiber Coir Scrubbers",
    category: "Household & Care",
    unit: "Pack of 3",
    badge: "Handspun Coir",
    priceInPaise: 8500, // ₹85
    image: "assets/images/Natural Coconut Fiber Coir Scrubbers.png",
    backupImage: "https://images.unsplash.com/photo-1671640368654-292b95f3c22d?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "p_recycled_paper_napkins_100s",
    name: "Unbleached Bamboo Table Napkins",
    category: "Household & Care",
    unit: "Pack of 100",
    badge: "Chlorine-Free",
    priceInPaise: 9500, // ₹95
    image: "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?auto=format&fit=crop&w=700&q=80",
    backupImage: "https://images.unsplash.com/photo-1502945015378-0e284ca1a5be?auto=format&fit=crop&w=700&q=80"
  }
];

/**
 * Filter and sort products according to user controls
 * @param {string} query 
 * @param {string} category 
 * @param {string} sortBy 
 * @returns {Array<any>}
 */
export function filterProducts(query = '', category = 'All Stalls', sortBy = 'featured') {
  const q = query.trim().toLowerCase();
  
  return PRODUCTS.filter(item => {
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      (item.badge && item.badge.toLowerCase().includes(q));
    const matchesCat = category === 'All Stalls' || item.category === category;
    return matchesSearch && matchesCat;
  }).sort((a, b) => {
    if (sortBy === 'price-low') {
      return a.priceInPaise - b.priceInPaise;
    }
    if (sortBy === 'price-high') {
      return b.priceInPaise - a.priceInPaise;
    }
    if (sortBy === 'name-az') {
      return a.name.localeCompare(b.name);
    }
    // Default: featured first, then original list order
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
  });
}

/**
 * Look up a product by stable product ID
 * @param {string} id 
 * @returns {any|null}
 */
export function getProductById(id) {
  return PRODUCTS.find(p => p.id === id) || null;
}