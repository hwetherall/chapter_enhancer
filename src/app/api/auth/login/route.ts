import { NextResponse } from "next/server";

const VALID_PASSWORD = "InnoveraDem0";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === VALID_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  return NextResponse.json({ success: false, error: "Invalid password" }, { status: 401 });
}
