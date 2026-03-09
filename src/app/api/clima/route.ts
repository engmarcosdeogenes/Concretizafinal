import { NextRequest, NextResponse } from "next/server"

// API de clima usando Open-Meteo (gratuita, sem chave)
// Geocodificação via Nominatim (OpenStreetMap, gratuita)

type GeoResult = {
  lat: string
  lon: string
  display_name: string
}

type ClimaResult = {
  clima: string        // "sol" | "nublado" | "chuva" | "vento"
  tempMin: number
  tempMax: number
  chuva: boolean
  descricao: string
}

// Mapeia WMO weather codes para os valores do sistema
function wmoToClima(code: number, precipitacao: number): ClimaResult["clima"] {
  if (precipitacao > 1) return "chuva"
  if (code === 0 || code === 1) return "sol"
  if (code >= 2 && code <= 3) return "nublado"
  if (code >= 51 && code <= 82) return "chuva"
  if (code >= 95) return "chuva"
  return "nublado"
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const cidade  = searchParams.get("cidade")
  const estado  = searchParams.get("estado")

  if (!cidade) {
    return NextResponse.json({ error: "Parâmetro cidade é obrigatório" }, { status: 400 })
  }

  try {
    // 1. Geocodificar cidade via Nominatim
    const query  = encodeURIComponent(`${cidade}, ${estado ?? ""}, Brasil`)
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { "User-Agent": "Concretiza/1.0 (gestao@concretiza.app)" } }
    )

    const geoData: GeoResult[] = await geoRes.json()
    if (!geoData.length) {
      return NextResponse.json({ error: "Cidade não encontrada" }, { status: 404 })
    }

    const { lat, lon } = geoData[0]

    // 2. Buscar clima atual e previsão de hoje via Open-Meteo
    const climaRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode` +
      `&current_weather=true&timezone=America/Sao_Paulo&forecast_days=1`
    )

    const climaData = await climaRes.json()

    const daily       = climaData.daily
    const current     = climaData.current_weather
    const tempMax     = Math.round(daily.temperature_2m_max[0])
    const tempMin     = Math.round(daily.temperature_2m_min[0])
    const precip      = daily.precipitation_sum[0]
    const wmoCode     = current?.weathercode ?? daily.weathercode[0]
    const climaLabel  = wmoToClima(wmoCode, precip)
    const chuva       = precip > 1

    const result: ClimaResult = {
      clima:    climaLabel,
      tempMin,
      tempMax,
      chuva,
      descricao: geoData[0].display_name,
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "s-maxage=1800" }, // cache 30 min
    })
  } catch (err) {
    console.error("Erro ao buscar clima:", err)
    return NextResponse.json({ error: "Erro ao buscar dados climáticos" }, { status: 500 })
  }
}
