// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

export class Model {
  constructor(radec, radius) {
    this.ra = radec.ra;
    this.dec = radec.dec;
    this.radius = radius;
  }
}
