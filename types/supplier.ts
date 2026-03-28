export interface SupplierCategory {
  id: string
  name: string
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  description: string | null
  logo_path: string | null
  website: string | null
  category_id: string | null
  country: string | null
  address: string | null
  sponsored: boolean
  created_at: string
  category?: SupplierCategory | null
}
