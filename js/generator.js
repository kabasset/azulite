// SPDX-FileCopyrightText: Copyright (C) 2026, Antoine Basset (CNES), Rollin Gimenez (CNES)
// SPDX-License-Identifier: Apache-2.0

const maxSize = 50000000;

/**
 * Control pane generation buttons.
 */
export class Generator {
  constructor(survey, previewImg) {
    this.survey = survey;
    this.previewImg = previewImg;
  }

  /**
   * Generate and display the preview image.
   */
  preview(ra, dec, radius) {
    this.previewImg.setAttribute("src", "");
    const extent = this.previewImg.parentElement.clientWidth;
    const url = this.imageUrl(ra, dec, radius, extent);
    if (url) {
      this.previewImg.setAttribute("src", url);
    }
  }

  /**
   * Generate and open the image in a new tab.
   */
  generate(ra, dec, radius) {
    const url = this.imageUrl(ra, dec, radius);
    if (url) {
      window.open(url, "_blank");
    }
  }

  /**
   * Open HiPS2FITS in a new tab.
   */
  details(ra, dec, radius) {
    window.open(this.hips2FitsUrl(ra, dec, radius), "_blank");
  }

  /**
   * Generate the image URL.
   */
  imageUrl(ra, dec, radius, extent = null) {
    extent = extent ? extent : Math.ceil(radius * 36000); // MER resolution
    if (extent * extent > maxSize) {
      if (confirm("Full-resolution image too large.\nScale down?")) {
        extent = Math.floor(Math.sqrt(maxSize));
      } else {
        return;
      }
    }
    const params = {
      hips: this.survey,
      width: extent,
      height: extent,
      projection: "SIN",
      fov: radius * 2,
      ra: ra,
      dec: dec,
      coordsys: "icrs",
      rotation_angle: 0,
      format: "png",
    };
    return rest(
      "https://alasky.cds.unistra.fr/hips-image-services/hips2fits",
      params,
    );
  }

  /**
   * Generate the HiPS2FITS URL.
   */
  hips2FitsUrl(ra, dec, radius) {
    const params = {
      hips: this.survey,
      fov: radius * 2, // diameter
      ra: ra,
      dec: dec,
    };
    return rest(
      "https://alasky.cds.unistra.fr/hips-image-services/hips2fits",
      params,
      "#",
    );
  }
}

/**
 * Generate a REST URL.
 */
function rest(endpoint, params, delim = "?") {
  let chunks = [];
  for (const p in params)
    chunks.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
  return endpoint + delim + chunks.join("&");
}
