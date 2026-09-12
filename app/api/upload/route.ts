import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder") || "kickslab/products";
    const { data } = await req.json(); // base64 image string
    const result = await cloudinary.uploader.upload(data, {
      folder:         "kickslab/products",
      transformation: [
        { width: 800, height: 800, crop: "limit", quality: "auto" },
      ],
    });
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json(
      { error: "Upload failed." }, { status: 500 }
    );
  }
}
