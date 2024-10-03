/**
 * The model holding a date and a value for the cart.
 */
export interface DateData {
  date: string
  value?: number
}

export namespace Utils {
  export const calculateMovingAverage = (
    data: DateData[],
    window: number,
    factor = 1,
  ): DateData[] => {
    // Clone the input dates but set the price to undefined.
    const out: DateData[] = Object.values(structuredClone(data)).map(
      (entry) => {
        return { date: entry.date, price: undefined }
      },
    )
    if (data.length < window || window <= 0) {
      return out
    }
    let sum = 0
    for (let i = 0; i < window; i++) {
      sum += data[i].value ?? 0
    }
    out[window - 1].value = (sum / window) * factor
    for (let i = window; i < data.length; i++) {
      sum += (data[i].value ?? 0) - (data[i - window].value ?? 0)
      out[i].value = (sum / window) * factor
    }
    return out
  }
}
