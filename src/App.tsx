import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/providers/theme-provider'
import { AppLayout } from '@/components/layout/app-layout'
import { OverviewPage } from '@/pages/overview'
import { XLCPage } from '@/pages/xlc'
import { GSFPage } from '@/pages/gsf'
import { MerchantPage } from '@/pages/merchant'
import { WOPage } from '@/pages/wo'
import { EXPOPage } from '@/pages/expo'
import { XLSatuPage } from '@/pages/xlsatu'
import { ELITEPage } from '@/pages/elite'
import { PromotorPage } from '@/pages/promotor'
import { TargetPage } from '@/pages/target'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<OverviewPage />} />
            <Route path="/xlc" element={<XLCPage />} />
            <Route path="/gsf" element={<GSFPage />} />
            <Route path="/merchant" element={<MerchantPage />} />
            <Route path="/wo" element={<WOPage />} />
            <Route path="/expo" element={<EXPOPage />} />
            <Route path="/xlsatu" element={<XLSatuPage />} />
            <Route path="/elite" element={<ELITEPage />} />
            <Route path="/promotor" element={<PromotorPage />} />
            <Route path="/target" element={<TargetPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
