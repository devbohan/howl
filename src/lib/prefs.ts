import { createContext, useContext } from 'react'
import type { Currency } from './types'

export const CurrencyContext = createContext<Currency>('JPY')
export const useCurrency = () => useContext(CurrencyContext)
