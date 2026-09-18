export const examProfile = {
  version: 'AP-SI-2026.1',
  title: 'AP Police Sub Inspector 2026',
  notificationDate: '2026-09-16',
  checkedOn: '2026-09-19',
  officialUrl: 'https://slprb.ap.gov.in/2026_PDFS/SLPRB_AP_SI_Notification_2026.pdf',
  boardUrl: 'https://slprb.ap.gov.in/',
  prelims: [
    { paper: 'Paper I', subject: 'Arithmetic + reasoning', questions: 100, marks: 100, minutes: 180 },
    { paper: 'Paper II', subject: 'General studies', questions: 100, marks: 100, minutes: 180 },
  ],
  final: [
    { paper: 'Paper I', subject: 'English descriptive', marks: 100, minutes: 180, qualifying: true },
    { paper: 'Paper II', subject: 'Telugu / Urdu descriptive', marks: 100, minutes: 180, qualifying: true },
    { paper: 'Paper III', subject: 'Arithmetic + reasoning', marks: 200, minutes: 180, qualifying: false },
    { paper: 'Paper IV', subject: 'General studies', marks: 200, minutes: 180, qualifying: false },
  ],
} as const

export const readinessBenchmarks: Record<string, number> = {
  'OC / EWS': 72, 'BC-A': 68, 'BC-B': 68, 'BC-C': 68,
  'BC-D': 68, 'BC-E': 68, SC: 60, ST: 60,
}
