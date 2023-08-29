import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createErrorResponse } from "@/lib/utils";
import { ProductFormValidator } from "@/lib/validators/productForm";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const body = await req.json();
    const { name, image, description, category, brand, price, tags } =
      ProductFormValidator.parse(body);

    const res = await prisma.product.create({
      data: {
        name,
        image: image || "",
        description,
        price,
        category: { connect: { id: category } },
        brand: { connect: { id: brand } },
        tags: {
          create: tags.map((tag) => ({
            tag: { connect: { id: tag } },
          })),
        },
      },
    });

    console.log("Res after creating product: ", res);

    return new Response("Product created successfully!");
  } catch (err) {
    console.error("Error while sending req: ", err);
    if (err instanceof z.ZodError)
      return new Response(err.message, {
        status: 422,
      });

    return new Response("Could not create product", { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getAuthSession();
  if (!session?.user) {
    return createErrorResponse(
      "You are Unauthorized. Please login to your account",
      401
    );
  }

  const { searchParams } = new URL(req.url);
  const id = await searchParams.get("id");

  if (id) {
    const product = await prisma.product.findFirst({
      where: {
        id,
      },
    });

    const successResponse = JSON.stringify({
      success: true,
      message: "Product fetched successfully!",
      data: product,
    });

    return new Response(successResponse, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } else {
    try {
      const products = await prisma.product.findMany();

      const successResponse = JSON.stringify({
        success: true,
        message: "Products fetched successfully!",
        data: products,
      });
      return new Response(successResponse, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.log("Unable to fetch products", err);
      return createErrorResponse("Unable to fetch products", 422);
    }
  }
}
