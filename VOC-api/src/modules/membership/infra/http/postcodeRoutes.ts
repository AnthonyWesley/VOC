import { Router, Request, Response } from "express";

const router = Router();

router.get("/:postcode", async (req: Request, res: Response) => {
  const rawPostcode = req.params.postcode;
  const postcode = Array.isArray(rawPostcode) ? rawPostcode[0] : rawPostcode;

  if (!postcode || postcode.length < 5) {
    return res.status(400).json({ error: "Invalid postcode" });
  }

  try {
    const response = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`,
    );
    const data = await response.json();

    if (!data.result) {
      return res.json({
        address: "",
        postcode: postcode.toUpperCase(),
        country: null,
        region: null,
        adminDistrict: null,
      });
    }

    const parts: string[] = [];
    if (data.result.parish) parts.push(data.result.parish);
    if (data.result.admin_district)
      parts.push(data.result.admin_district);
    if (data.result.region) parts.push(data.result.region);

    return res.json({
      address: parts.join(", "),
      postcode: data.result.postcode,
      country: data.result.country ?? null,
      region: data.result.region ?? null,
      adminDistrict: data.result.admin_district ?? null,
    });
  } catch {
    return res.status(502).json({ error: "Postcode lookup failed" });
  }
});

export { router as postcodeRoutes };
