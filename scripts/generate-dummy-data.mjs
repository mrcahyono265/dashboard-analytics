import XLSX from 'xlsx'

const months = ['Jan-24', 'Feb-24', 'Mar-24', 'Apr-24', 'May-24', 'Jun-24']
const rsms = ['Budi Santoso', 'Siti Rahayu', 'Taufik Hidayat', 'Anita Wulandari', 'Dedi Kurniawan']
const sms = ['Andi Prasetyo', 'Maya Sari', 'Rizki Pratama', 'Dewi Lestari', 'Fajar Nugroho']
const stores = ['XL Center Kelapa Gading', 'XL Center Grand Indonesia', 'XL Center Margonda', 'XL Center BSD City', 'XL Center Ciputra Mall', 'XL Center Pluit Village', 'XL Center Mall Taman Anggrek', 'XL Center Summarecon Mall', 'XL Center Lippo Mall Puri', 'XL Center Central Park']
const packages = ['PRIO PLATINUM', 'PRIO DIAMOND', 'PRIO GOLD', 'PRIO SILVER', 'PRIO BASIC']
const pricePlans = [150000, 200000, 250000, 300000, 350000, 500000, 100000]
const agents = ['Agent_A01', 'Agent_A02', 'Agent_B01', 'Agent_B02', 'Agent_C01', 'Agent_C02', 'Agent_D01']
const crrs = ['CRR_Alfa', 'CRR_Beta', 'CRR_Gamma', 'CRR_Delta', 'CRR_Epsilon']
const woAgents = ['WO_Andi', 'WO_Budi', 'WO_Citra', 'WO_Dian', 'WO_Eka', 'WO_Fajar']
const leaders = ['Leader_01', 'Leader_02', 'Leader_03']
const expoNames = ['Expo_Jakarta', 'Expo_Bandung', 'Expo_Surabaya', 'Expo_Semarang', 'Expo_Yogyakarta']
const promotors = ['Promotor_01', 'Promotor_02', 'Promotor_03', 'Promotor_04', 'Promotor_05']
const offices = ['Office_JKT', 'Office_BDG', 'Office_SBY', 'Office_SMG', 'Office_JOG']
const operators = ['Telkomsel', 'Indosat', 'Tri', 'Smartfren', 'XL']
const events = ['Payment', 'Top Up', 'Transfer', 'Withdrawal', 'Bill Payment']

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randomBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randomMSISDN() { return '628' + String(randomBetween(1000000000, 9999999999)) }
function randomDate(month) {
  const m = months.indexOf(month)
  const day = randomBetween(1, 28)
  return `${day}/${m + 1}/2024, ${randomBetween(7, 20)}.${String(randomBetween(0, 59)).padStart(2, '0')}`
}

// ─── XLC Sheet ───────────────────────────────
function generateXLC() {
  const rows = []
  for (let i = 1; i <= 200; i++) {
    const month = randomFrom(months)
    rows.push({
      'No.': i,
      'Bulan': month,
      'Tanggal': randomDate(month),
      'MSISDN': randomMSISDN(),
      'Package Plan': randomFrom(packages),
      'Price Plan': randomFrom(pricePlans),
      'Store Name': randomFrom(stores),
      'Username Agent': randomFrom(agents),
      'Nama CRR': randomFrom(crrs),
      'RSM': randomFrom(rsms),
      'SM': randomFrom(sms),
      'New/Migrate': Math.random() > 0.4 ? 'New' : 'Migrate',
    })
  }
  return rows
}

// ─── GSF Sheet ───────────────────────────────
function generateGSF() {
  const rows = []
  for (let i = 1; i <= 150; i++) {
    const month = randomFrom(months)
    const amount = randomBetween(50000, 5000000)
    rows.push({
      'Galeri': randomFrom(stores),
      'Bulan': month,
      'Tanggal': randomDate(month),
      'CASH_CYCLE_ID': randomBetween(1000, 9999),
      'OPERATION': randomFrom(['Payment', 'Top Up', 'Transfer']),
      'OPERATION_TIME': randomDate(month),
      'OPERATION_SERIAL': `SN${randomBetween(100000, 999999)}`,
      'CURRENCY_TYPE': 'IDR',
      'PRE_BALANCE': amount + randomBetween(100000, 1000000),
      'AMOUNT': amount,
      'NEXT_BALANCE': randomBetween(100000, 5000000),
      'PAYMENT_CATEGORY': randomFrom(['Postpaid', 'Prepaid', 'Broadband']),
      'PAYMENT_METHOD': randomFrom(['Cash', 'Card', 'E-Wallet']),
      'TRANSACTION_TYPE': 'Normal',
      'OFFICE': randomFrom(offices),
      'OPERATOR': randomFrom(operators),
      'EVENT_NAME': randomFrom(events),
      'CUSTOMER/RELATED_OPERATOR': randomFrom(operators),
      'TRANSACTION_NUMBER/ORDER_NUMBER': `TXN${randomBetween(100000, 999999)}`,
      'RECEIPT_NUMBER': `RCP${randomBetween(100000, 999999)}`,
      'ACCOUNT_NUMBER': randomMSISDN(),
      'SERVICES_NUMBER': randomMSISDN(),
      'REMARKS': '',
    })
  }
  return rows
}

// ─── Merchant Sheet ──────────────────────────
function generateMerchant() {
  const rows = []
  for (let i = 1; i <= 80; i++) {
    const month = randomFrom(months)
    rows.push({
      'No.': i,
      'Bulan': month,
      'Tanggal': randomDate(month),
      'MSISDN': randomMSISDN(),
      'Package Plan': randomFrom(packages),
      'Price Plan': randomFrom(pricePlans),
      'Store Name': randomFrom(stores),
      'Username Agent': randomFrom(agents),
      'Nama CRR': randomFrom(crrs),
      'RSM': randomFrom(rsms),
      'SM': randomFrom(sms),
      'New/Migrate': Math.random() > 0.3 ? 'New' : 'Migrate',
    })
  }
  return rows
}

// ─── WO Sheet ────────────────────────────────
function generateWO() {
  const rows = []
  for (let i = 1; i <= 60; i++) {
    const month = randomFrom(months)
    rows.push({
      'No.': i,
      'Bulan': month,
      'Tanggal': randomDate(month),
      'MSISDN': randomMSISDN(),
      'Package Plan': randomFrom(packages),
      'Price Plan': randomFrom(pricePlans),
      'XLC Name': randomFrom(stores),
      'Username Agent': randomFrom(agents),
      'Agent WO': randomFrom(woAgents),
      'RSM': randomFrom(rsms),
      'Leader': randomFrom(leaders),
      'New/Migrate': Math.random() > 0.5 ? 'New' : 'Migrate',
    })
  }
  return rows
}

// ─── EXPO Sheet ──────────────────────────────
function generateEXPO() {
  const rows = []
  for (let i = 1; i <= 100; i++) {
    const month = randomFrom(months)
    rows.push({
      'No.': i,
      'Bulan': month,
      'Tanggal': randomDate(month),
      'MSISDN': randomMSISDN(),
      'Package Plan': randomFrom(packages),
      'Price Plan': randomFrom(pricePlans),
      'Expo Name': randomFrom(expoNames),
      'Username Agent': randomFrom(agents),
      'Nama Promotor': randomFrom(promotors),
      'RSM': randomFrom(rsms),
      'Leader': randomFrom(leaders),
      'New/Migrate': Math.random() > 0.4 ? 'New' : 'Migrate',
    })
  }
  return rows
}

// ─── XLSatu Sheet ────────────────────────────
function generateXLSatu() {
  const rows = []
  for (let i = 1; i <= 30; i++) {
    const month = randomFrom(months)
    rows.push({
      'No.': i,
      'Bulan': month,
      'Tanggal': randomDate(month),
      'No. SO': randomBetween(10000, 99999),
      'Package Plan': randomFrom(['XL Satu Home', 'XL Satu Pro', 'XL Satu Max']),
      'Price Plan': randomFrom([200000, 300000, 500000, 750000]),
      'Store Name': randomFrom(stores),
      'Username Agent': randomFrom(agents),
      'Nama CRR': randomFrom(crrs),
      'RSM': randomFrom(rsms),
      'SM': randomFrom(sms),
    })
  }
  return rows
}

// ─── ELITE Sheet ─────────────────────────────
function generateELITE() {
  return [
    ['OPERATOR', 'New Connection', 'Prepaid to Postpaid', 'Grand Total'],
    ['Telkomsel', randomBetween(100, 500), randomBetween(50, 200), 0],
    ['Indosat', randomBetween(80, 400), randomBetween(30, 150), 0],
    ['Tri', randomBetween(60, 300), randomBetween(20, 100), 0],
    ['Smartfren', randomBetween(40, 200), randomBetween(10, 80), 0],
  ].map((row, i) => {
    if (i === 0) return row
    const total = row[1] + row[2]
    return [row[0], row[1], row[2], total]
  })
}

// ─── Promotor Sheet ──────────────────────────
function generatePromotor() {
  const headers = ['Nama Promotor', ...promotors]
  const rows = [headers]
  const packages2 = ['PRIO PLATINUM', 'PRIO DIAMOND', 'PRIO GOLD', 'PRIO SILVER']
  for (const pkg of packages2) {
    const row = [pkg]
    for (let j = 0; j < promotors.length; j++) {
      row.push(randomBetween(5, 50))
    }
    rows.push(row)
  }
  // Fix: first column should be package names, header row has promotors
  // Actually the format is: Nama Promotor | pkg1 | pkg2 | ...
  // And rows are: promotor_name | val1 | val2 | ...
  return [
    ['Nama Promotor', ...packages2],
    ...promotors.map(p => [p, ...packages2.map(() => randomBetween(5, 50))])
  ]
}

// ─── Build workbook ──────────────────────────
const wb = XLSX.utils.book_new()

const xlcData = generateXLC()
const wsXLC = XLSX.utils.json_to_sheet(xlcData)
XLSX.utils.book_append_sheet(wb, wsXLC, 'XLC')

const gsfData = generateGSF()
const wsGSF = XLSX.utils.json_to_sheet(gsfData)
XLSX.utils.book_append_sheet(wb, wsGSF, 'GSF')

const merchantData = generateMerchant()
const wsMerchant = XLSX.utils.json_to_sheet(merchantData)
XLSX.utils.book_append_sheet(wb, wsMerchant, 'Merchant')

const woData = generateWO()
const wsWO = XLSX.utils.json_to_sheet(woData)
XLSX.utils.book_append_sheet(wb, wsWO, 'WO')

const expoData = generateEXPO()
const wsEXPO = XLSX.utils.json_to_sheet(expoData)
XLSX.utils.book_append_sheet(wb, wsEXPO, 'EXPO')

const xlsatuData = generateXLSatu()
const wsXLSatu = XLSX.utils.json_to_sheet(xlsatuData)
XLSX.utils.book_append_sheet(wb, wsXLSatu, 'XLSatu')

const eliteData = generateELITE()
const wsELITE = XLSX.utils.aoa_to_sheet(eliteData)
XLSX.utils.book_append_sheet(wb, wsELITE, 'ELITE')

const promotorData = generatePromotor()
const wsPromotor = XLSX.utils.aoa_to_sheet(promotorData)
XLSX.utils.book_append_sheet(wb, wsPromotor, 'Promotor')

XLSX.writeFile(wb, 'public/data/Achievement Prio.xlsx')
console.log('✅ Dummy Excel created: public/data/Achievement Prio.xlsx')
console.log(`   XLC: ${xlcData.length} rows`)
console.log(`   GSF: ${gsfData.length} rows`)
console.log(`   Merchant: ${merchantData.length} rows`)
console.log(`   WO: ${woData.length} rows`)
console.log(`   EXPO: ${expoData.length} rows`)
console.log(`   XLSatu: ${xlsatuData.length} rows`)
console.log(`   ELITE: ${eliteData.length - 1} rows`)
console.log(`   Promotor: ${promotorData.length - 1} rows`)
