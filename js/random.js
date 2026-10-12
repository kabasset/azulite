// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

const nearby_galaxies = [
  "PGC 2693358",
  "PGC 061140",
  "PGC 061111",
  "ESO 418-006",
  "UGC 10953",
  "PGC 130364",
  "ESO 250-014",
  "PGC 014737",
  "PGC 013076",
  "PGC 129576",
  "PGC 061099",
  "UGC 11005",
  "PGC 2663324",
  "ESO 482-009",
  "PGC 2684483",
  "PGC 2682190",
  "PGC 2707955",
  "PGC 142464",
  "PGC 129507",
  "PGC 2678618",
  "UGC 11169",
  "PGC 177183",
  "PGC 738890",
  "PGC 140797",
  "PGC 482810",
  "PGC 177125",
  "PGC 512142",
  "PGC 2679728",
];

export function randomChoice(choices) {
  var index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

export function randomGalaxy() {
  return randomChoice(nearby_galaxies);
}
