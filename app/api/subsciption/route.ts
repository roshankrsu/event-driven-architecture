import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { error } from "console";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  //capture payment

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 401 });
    }

    const subscriptionEnds = new Date();
    subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        IsSubscribed: true,
        subscriptionEnds: subscriptionEnds,
      },
    });

    return NextResponse.json({
      message: "Subscription successfully",
      subscriptionEnds: updatedUser.subscriptionEnds,
    });
  } catch (err) {
    console.error("Error updating subcrption", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        IsSubscribed: true,
        subscriptionEnds: true,
      },
    });
    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 401 });
    }

    const now = new Date();

    if (user.subscriptionEnds && user.subscriptionEnds < now) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          IsSubscribed: false,
          subscriptionEnds: null,
        },
      });
      return NextResponse.json({
        IsSubscribed: false,
        subscriptionEnds: null,
      });
    }
    return NextResponse.json({
      IsSubscribed: user.IsSubscribed,
      subscriptionEnds: user.subscriptionEnds,
    });
  } catch (err) {
    console.error("Error updating subcrption", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
