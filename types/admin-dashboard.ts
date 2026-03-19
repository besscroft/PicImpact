export type AdminDashboardSummary = {
  totalImages: number
  publicImages: number
}

export type AdminDashboardCoverage = {
  publicRatio: number
  featuredOnHome: number
  geoTaggedImages: number
  taggedImages: number
}

export type AdminDashboardRecentUpload = {
  id: string
  title: string | null
  imageName: string | null
  url: string | null
  preview_url: string | null
  width: number
  height: number
  show: number
  createdAt: Date | string
  albumNames: string
}

export type AdminDashboardAlbumBreakdownItem = {
  name: string
  albumValue: string
  total: number
  publicCount: number
}

export type AdminDashboardEquipmentBreakdownItem = {
  camera: string
  lens: string
  count: number
}

export type AdminDashboardData = {
  summary: AdminDashboardSummary
  coverage: AdminDashboardCoverage
  recentUploads: AdminDashboardRecentUpload[]
  albumBreakdown: AdminDashboardAlbumBreakdownItem[]
  equipmentBreakdown: AdminDashboardEquipmentBreakdownItem[]
}
