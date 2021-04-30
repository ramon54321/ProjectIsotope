import { clamp, inverseLerp, lerp } from './utils'

export function getKeneticEnergy(
  projectileMass: number,
  barrelLength: number,
  barrelLengthMin?: number,
  barrelLengthMax?: number,
  projectileVelocityMin?: number,
  projectileVelocityMax?: number,
): number {
  const velocity = getMuzzleVelocity(barrelLength, barrelLengthMin, barrelLengthMax, projectileVelocityMin, projectileVelocityMax)
  return (projectileMass / 2) * velocity * velocity
}

function getMuzzleVelocity(
  barrelLength: number,
  barrelLengthMin: number = 0.08,
  barrelLengthMax: number = 0.66,
  velocityMin: number = 125,
  velocityMax: number = 600,
): number {
  const barrelT = inverseLerp(barrelLengthMin, barrelLengthMax, clamp(barrelLengthMin, barrelLengthMax, barrelLength))
  return lerp(velocityMin, velocityMax, barrelT)
}
