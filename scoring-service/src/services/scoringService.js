// Scoring logic for drivers and guides
// Score = weighted sum of: Rating, Penalty, Active, Banned, NewDriver, First10Rides

function calculateScore(driver) {
  console.log('[SCORING SERVICE] Calculating score for driver object:', driver);
  
  // Handle both Pascal case and lowercase column names
  const Rating = driver.Rating || driver.rating;
  const Penalty = driver.Penalty || driver.penalty;
  const Active = driver.Active || driver.active;
  const Banned = driver.Banned || driver.banned;
  const NewDriver = driver.NewDriver || driver.newdriver;
  const First10Rides = driver.First10Rides || driver.first10rides;
  
  console.log('[SCORING SERVICE] Extracted values - Rating:', Rating, 'Penalty:', Penalty, 'Active:', Active, 'Banned:', Banned, 'NewDriver:', NewDriver, 'First10Rides:', First10Rides);
  
  // Normalize values
  const rating = Math.max(0, Math.min(5, Number(Rating)));
  const penalty = Math.max(0, Math.min(100, Number(Penalty)));
  const active = Number(Active) === 1 ? 1 : 0;
  const banned = Number(Banned) === 1 ? 1 : 0;
  const newDriver = Number(NewDriver) === 1 ? 1 : 0;
  const first10 = Math.max(1, Math.min(10, Number(First10Rides)));

  console.log('[SCORING SERVICE] Normalized values - rating:', rating, 'penalty:', penalty, 'active:', active, 'banned:', banned, 'newDriver:', newDriver, 'first10:', first10);

  // Weights (tune as needed)
  const w = {
    rating: 0.5,
    penalty: 0.2,
    active: 0.15,
    banned: 0.1,
    newDriver: 0.05,
    first10: 0.05
  };

  console.log('[SCORING SERVICE] Using weights:', w);

  // Score calculation
  let score = 0;
  const ratingScore = w.rating * (rating / 5); // 0-1
  const penaltyScore = w.penalty * (1 - penalty / 100); // 1 is best, 0 is worst
  const activeScore = w.active * active;
  const bannedPenalty = w.banned * banned;
  const newDriverPenalty = w.newDriver * newDriver * 0.5; // new drivers get a small penalty
  const experienceScore = w.first10 * (first10 / 10);

  console.log('[SCORING SERVICE] Component scores - rating:', ratingScore, 'penalty:', penaltyScore, 'active:', activeScore, 'bannedPenalty:', bannedPenalty, 'newDriverPenalty:', newDriverPenalty, 'experience:', experienceScore);

  score += ratingScore;
  score += penaltyScore;
  score += activeScore;
  score -= bannedPenalty;
  score -= newDriverPenalty;
  score += experienceScore;

  console.log('[SCORING SERVICE] Raw score before scaling:', score);

  // Scale to 0-100
  const finalScore = Math.round(score * 100);
  console.log('[SCORING SERVICE] Final scaled score:', finalScore);
  
  return finalScore;
}

module.exports = { calculateScore };
