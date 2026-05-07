export const ART_FORMS = ['Traditional Dance', 'Classical Music', 'Pottery', 'Folk Painting', 'Traditional Theatre', 'Weaving', 'Wood Carving', 'Sculpture', 'Embroidery', 'Puppetry', 'Folk Music']
export const LOCATIONS = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Jaipur', 'Lucknow', 'Hyderabad', 'Pune', 'Ahmedabad', 'Bhopal']
export const STATES = ['Maharashtra', 'Madhya Pradesh', 'Karnataka', 'Chhattisgarh', 'Andra Pradesh', 'Telangana', 'Others']
export const ARTIST_PORTAL_STATES = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'West Bengal', 'Rajasthan', 'Uttar Pradesh', 'Telangana', 'Gujarat', 'Punjab', 'Madhya Pradesh']
export const AREA_TYPES = ['Urban', 'Semi-Urban', 'Rural']
export const FY_OPTIONS = ['2024-25', '2023-24', '2022-23']
export const EDU_QUALS = ['10th', '12th', 'Diploma', "Undergraduate (Bachelor's Degree)", "Postgraduate (Master's Degree)", 'Doctorate (PhD)', 'None', 'Other']
export const ART_QUALS = ['Self-taught', 'Formal Training (Institute)', 'Guru/Shishya Training', 'Certified Course', 'Workshop / Short-term Training', 'Other']
export const CASTES = ['General (Open)', 'OBC (Other Backward Classes)', 'SC (Scheduled Castes)', 'ST (Scheduled Tribes)', 'Other']
export const EVENT_CATEGORIES = ['Performing', 'Workshops']

export const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
