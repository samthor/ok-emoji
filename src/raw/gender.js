/**
 * @fileoverview Contains extra built-in data for genders.
 */

/**
 * @type {!Array<number>} contains sequences of three emoji: female, male, neutral
 */
export const extraGenderList = [
  0x1f467, 0x1f466, 0x1f9d2,  // girl, boy, child
  0x1f475, 0x1f474, 0x1f9d3,  // old {woman,man,adult}
  0x1f483, 0x1f57a, 0,        // dancers
  0x1f478, 0x1f934, 0,        // princess, prince

  // TODO: not really a gender
//  0x1f6ba, 0x1f6b9, 0x1f6bb,  // woman's room, men's room, restroom

  // TODO: this might now be caught by expandos
  0x1f46d, 0x1f46c, 0x1f46b,  // women/men holding hands; note this has 'f/m' for neutral
];