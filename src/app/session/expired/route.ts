import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "../../lib/api";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(
    new URL("/login?session=expired", request.url),
  );
  response.cookies.delete(AUTH_COOKIE);
  return response;
}
