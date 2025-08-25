// Scoring logic for drivers and guides
// Score = weighted sum of: Rating, Penalty, Active, Banned, NewDriver, First10Rides

function calculateScore({ Rating, Penalty, Active, Banned, NewDriver, First10Rides }) {
  // Normalize values
  const rating = Math.max(0, Math.min(5, Number(Rating)));
  const penalty = Math.max(0, Math.min(100, Number(Penalty)));
  const active = Number(Active) === 1 ? 1 : 0;
  const banned = Number(Banned) === 1 ? 1 : 0;
  const newDriver = Number(NewDriver) === 1 ? 1 : 0;
  const first10 = Math.max(1, Math.min(10, Number(First10Rides)));

  // Weights (tune as needed)
  const w = {
    rating: 0.5,
    penalty: 0.2,
    active: 0.15,
    banned: 0.1,
    newDriver: 0.05,
    first10: 0.05
  };

  // Score calculation
  let score = 0;
  score += w.rating * (rating / 5); // 0-1
  score += w.penalty * (1 - penalty / 100); // 1 is best, 0 is worst
  score += w.active * active;
  score -= w.banned * banned;
  score -= w.newDriver * newDriver * 0.5; // new drivers get a small penalty
  score += w.first10 * (first10 / 10);

  // Scale to 0-100
  return Math.round(score * 100);
}

module.exports = { calculateScore };
