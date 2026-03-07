import type { Profile } from "./profile"

export type ProductType = "mold" | "course"
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded"

export interface Purchase {
  id: string
  user_id: string
  product_type: ProductType
  product_id: string
  price: number
  payment_status: PaymentStatus
  payment_reference: string | null
  created_at: string
  user?: Profile | null
}
