import { NextResponse } from "next/server"
import { getExchangeRates } from "@/lib/currency"

export const revalidate = 300 // 5-minute cache

export async function GET() {
  try {
    const rates = await getExchangeRates()
    return NextResponse.json({ rates })
  } catch {
    return NextResponse.json({ rates: {} })
  }
}
