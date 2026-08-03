import type { Hotel, InsertReview } from "@workspace/db";

const REVIEWERS = [
  { name: "James T.", country: "Australia" },
  { name: "Sarah M.", country: "United Kingdom" },
  { name: "Lena K.", country: "Germany" },
  { name: "Marco B.", country: "Italy" },
  { name: "Chen W.", country: "China" },
  { name: "Fatima A.", country: "UAE" },
  { name: "Tom H.", country: "United States" },
  { name: "Priya S.", country: "India" },
  { name: "Akira Y.", country: "Japan" },
  { name: "Emma L.", country: "France" },
  { name: "Carlos G.", country: "Spain" },
  { name: "Olga N.", country: "Russia" },
  { name: "David K.", country: "South Korea" },
  { name: "Sophie W.", country: "Netherlands" },
  { name: "Michael R.", country: "Canada" },
  { name: "Mei F.", country: "Taiwan" },
  { name: "Andreas P.", country: "Greece" },
  { name: "Amara D.", country: "Nigeria" },
  { name: "Lars E.", country: "Sweden" },
  { name: "Isabela C.", country: "Brazil" },
];

const STAY_TYPES = ["Leisure trip", "Business trip", "Couple", "Solo traveller", "Family with children", "Group of friends"];

const POSITIVE_COMMENTS = {
  "Olympic Hotel Paddington": [
    { text: "Excellent location near Paddington station, easy transport access to city. Room was clean and comfortable with great natural light.", positives: "Location, cleanliness, natural light", negatives: null, topics: ["location", "cleanliness", "transport"] },
    { text: "Charming heritage building with modern amenities. Staff were incredibly welcoming and helpful throughout our stay.", positives: "Heritage charm, staff friendliness", negatives: "Thin walls in older wing", topics: ["staff", "atmosphere", "facilities"] },
    { text: "Perfect base for exploring Sydney. Walking distance to great cafes and restaurants. Bed was extremely comfortable.", positives: "Location, bed comfort, local amenities nearby", negatives: null, topics: ["location", "comfort", "neighbourhood"] },
    { text: "Spotlessly clean room. The breakfast was fresh and well-presented. Staff went above and beyond to help with restaurant recommendations.", positives: "Cleanliness, breakfast quality, staff helpfulness", negatives: "Parking a little expensive", topics: ["cleanliness", "breakfast", "staff", "parking"] },
  ],
  "Venus Potts Point": [
    { text: "Absolutely stunning location in Potts Point. Walking distance to amazing restaurants and nightlife. Modern decor throughout.", positives: "Location, nightlife access, modern decor", negatives: null, topics: ["location", "nightlife", "decor"] },
    { text: "Loved the boutique feel of the hotel. Rooms are stylish and well-appointed. Staff very attentive and professional.", positives: "Boutique style, room quality, staff", negatives: "Room was a bit small", topics: ["atmosphere", "decor", "staff", "room size"] },
    { text: "Great value for such a prime Sydney location. The pool area is beautiful. Check-in was smooth and efficient.", positives: "Value, pool, check-in experience", negatives: "A/C was a little noisy at night", topics: ["value", "pool", "check-in"] },
    { text: "Stylish property with excellent attention to detail. Loved the local art on the walls. Breakfast buffet was extensive.", positives: "Style, local artwork, breakfast variety", negatives: null, topics: ["decor", "art", "breakfast"] },
  ],
  "Venus Surry Hills": [
    { text: "Perfect location in Surry Hills — surrounded by the best cafes and restaurants in Sydney. Staff are fantastic.", positives: "Location, food scene, staff", negatives: null, topics: ["location", "food", "staff"] },
    { text: "Trendy neighbourhood boutique hotel. Rooms are thoughtfully designed with high-quality linens. Very quiet despite being on a busy street.", positives: "Design, linen quality, noise insulation", negatives: "Limited parking nearby", topics: ["room design", "comfort", "noise", "parking"] },
    { text: "Great spot to experience inner-city Sydney life. Friendly and knowledgeable staff who know the area well.", positives: "Location, staff knowledge, local experience", negatives: null, topics: ["location", "staff", "local tips"] },
    { text: "Modern rooms with great amenities. Superfast WiFi was essential for my work trip. Breakfast was excellent.", positives: "Modern amenities, WiFi, breakfast", negatives: "No gym on site", topics: ["wifi", "amenities", "breakfast", "facilities"] },
  ],
  "Chateau de Venus": [
    { text: "Spectacular Darling Harbour views from our room. The waterfront location makes this hotel extraordinary. Excellent service throughout.", positives: "Harbour views, waterfront location, service", negatives: null, topics: ["view", "location", "service"] },
    { text: "Outstanding hotel with impeccable service. The harbour-view room was breathtaking, especially at night. Highly recommend.", positives: "Views, service, room quality", negatives: "Premium pricing", topics: ["view", "service", "value", "room"] },
    { text: "Perfect for a special occasion. Staff arranged a complimentary bottle of champagne for our anniversary. Simply wonderful.", positives: "Special occasion service, staff effort, atmosphere", negatives: null, topics: ["service", "special occasions", "staff", "atmosphere"] },
    { text: "Restaurant on-site was excellent — some of the best seafood I've had in Sydney. Room was luxuriously appointed.", positives: "Restaurant, food quality, room luxury", negatives: "Spa was under renovation during our stay", topics: ["restaurant", "food", "room", "spa"] },
  ],
};

const NEGATIVE_COMMENTS = {
  "Olympic Hotel Paddington": [
    { text: "Room was smaller than expected from the photos. The bathroom needed some renovation work — tiles were cracked. Staff were polite but slow to respond to requests.", positives: "Polite staff", negatives: "Small room, aging bathroom, slow response time", topics: ["room size", "bathroom", "maintenance", "staff responsiveness"] },
    { text: "Very disappointing stay. The air conditioning unit was noisy and kept us awake. The breakfast was limited and overpriced for what was offered.", positives: "Good location", negatives: "Noisy A/C, limited breakfast", topics: ["noise", "air conditioning", "breakfast", "value"] },
    { text: "Check-in took over 30 minutes despite booking online. No apology from reception staff. Room had a musty smell.", positives: null, negatives: "Slow check-in, unfriendly reception, room smell", topics: ["check-in", "reception", "cleanliness", "odour"] },
  ],
  "Venus Potts Point": [
    { text: "The room had a dirty carpet that clearly hadn't been cleaned properly. Complained to reception who were dismissive. Won't return.", positives: "Nice location", negatives: "Dirty carpet, poor reception response", topics: ["cleanliness", "carpet", "reception", "staff attitude"] },
    { text: "Construction noise next door started at 7am every morning. Hotel staff acknowledged the issue but offered no compensation or quieter rooms.", positives: "Convenient location", negatives: "Construction noise, no compensation offered", topics: ["noise", "construction", "communication", "value"] },
    { text: "Overpriced for what you get. WiFi kept dropping throughout our stay despite multiple calls to reception. Breakfast was mediocre.", positives: null, negatives: "Overpriced, WiFi issues, mediocre breakfast", topics: ["wifi", "value", "breakfast", "connectivity"] },
  ],
  "Venus Surry Hills": [
    { text: "Arrived to find our room hadn't been cleaned from the previous guest — bed was unmade, used towels on floor. Unacceptable.", positives: null, negatives: "Room not cleaned, unhygienic conditions", topics: ["cleanliness", "housekeeping", "hygiene", "room preparation"] },
    { text: "Street noise was terrible. Despite asking for a quiet room, we were given one facing the main road. Couldn't sleep.", positives: "Great food options nearby", negatives: "Noise, room allocation failure", topics: ["noise", "room allocation", "sleep quality", "street noise"] },
    { text: "Bathroom tap was dripping non-stop. Reported it on day 1, fixed on day 3. Staff apologised but the delay was unacceptable.", positives: "Staff were apologetic", negatives: "Maintenance delay, dripping tap", topics: ["maintenance", "plumbing", "responsiveness", "room quality"] },
  ],
  "Chateau de Venus": [
    { text: "Restaurant service was extremely slow. We waited 45 minutes for mains that were lukewarm when they arrived. A shame given the prime location.", positives: "Stunning location, beautiful room", negatives: "Slow restaurant service, food temperature", topics: ["restaurant", "service speed", "food quality", "dining"] },
    { text: "The room we booked advertised harbour views but we faced the car park. Management were unresponsive to our complaint.", positives: "Good facilities", negatives: "Misleading room description, unresponsive management", topics: ["misleading description", "room allocation", "management", "views"] },
    { text: "Valet parking took 40 minutes both drop-off and retrieval. At these prices, that's completely unacceptable. Won't be returning.", positives: "Beautiful property", negatives: "Terrible valet service", topics: ["parking", "valet", "service speed", "value"] },
  ],
};

const NEUTRAL_COMMENTS = {
  "Olympic Hotel Paddington": [
    { text: "Decent hotel in a convenient location. Nothing particularly stood out — rooms were clean enough, staff were fine, breakfast was average. Good value for Sydney.", positives: "Location, value", negatives: "Nothing exceptional", topics: ["location", "value", "cleanliness"] },
  ],
  "Venus Potts Point": [
    { text: "Average stay. Room was functional but not exciting. The location is excellent for nightlife but can be noisy. Reasonable value.", positives: "Location", negatives: "Noise on weekends, average room", topics: ["location", "noise", "room quality", "value"] },
  ],
  "Venus Surry Hills": [
    { text: "Solid mid-range hotel in a great neighbourhood. Everything worked as expected. Good for a short business trip but wouldn't choose it for a special occasion.", positives: "Convenient location, functional", negatives: "Lacks character", topics: ["location", "business travel", "atmosphere"] },
  ],
  "Chateau de Venus": [
    { text: "Beautiful setting but service didn't match the price tag. Room was lovely, food was good but not exceptional. Expected a little more at this price point.", positives: "Room quality, views", negatives: "Service inconsistency, value for money", topics: ["service", "value", "room", "food"] },
  ],
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomDate(daysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d.toISOString().split("T")[0];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateReviews(hotel: Hotel, count: number): InsertReview[] {
  const reviews: InsertReview[] = [];
  const hotelName = hotel.name;

  // Determine sentiment mix based on hotel (adds character differentiation)
  const sentimentMixes: Record<string, { positive: number; neutral: number; negative: number }> = {
    "Olympic Hotel Paddington": { positive: 0.62, neutral: 0.18, negative: 0.20 },
    "Venus Potts Point": { positive: 0.70, neutral: 0.16, negative: 0.14 },
    "Venus Surry Hills": { positive: 0.58, neutral: 0.20, negative: 0.22 },
    "Chateau de Venus": { positive: 0.75, neutral: 0.12, negative: 0.13 },
  };

  const mix = sentimentMixes[hotelName] ?? { positive: 0.65, neutral: 0.18, negative: 0.17 };

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let sentiment: "positive" | "neutral" | "negative";
    let rating: number;
    let commentPool: Array<{ text: string; positives: string | null; negatives: string | null; topics: string[] }>;

    if (rand < mix.positive) {
      sentiment = "positive";
      rating = randomBetween(7.5, 10);
      commentPool = POSITIVE_COMMENTS[hotelName as keyof typeof POSITIVE_COMMENTS] ?? POSITIVE_COMMENTS["Olympic Hotel Paddington"];
    } else if (rand < mix.positive + mix.neutral) {
      sentiment = "neutral";
      rating = randomBetween(5.0, 7.4);
      commentPool = NEUTRAL_COMMENTS[hotelName as keyof typeof NEUTRAL_COMMENTS] ?? NEUTRAL_COMMENTS["Olympic Hotel Paddington"];
    } else {
      sentiment = "negative";
      rating = randomBetween(1.0, 4.9);
      commentPool = NEGATIVE_COMMENTS[hotelName as keyof typeof NEGATIVE_COMMENTS] ?? NEGATIVE_COMMENTS["Olympic Hotel Paddington"];
    }

    const comment = pickRandom(commentPool);
    const reviewer = pickRandom(REVIEWERS);
    const stayType = pickRandom(STAY_TYPES);

    // Spread reviews over last 18 months
    const reviewDate = randomDate(540);

    reviews.push({
      hotelId: hotel.id,
      reviewerName: reviewer.name,
      reviewerCountry: reviewer.country,
      rating: Math.round(rating * 10) / 10,
      sentiment,
      text: comment.text,
      positives: comment.positives,
      negatives: comment.negatives,
      stayType,
      topics: comment.topics,
      reviewDate,
      externalId: `${hotel.slug}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  return reviews;
}
