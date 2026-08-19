import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const NIFTY_SMALLCAP_50_SCALPER_WATCHLIST = [
  { symbol: 'AEGISCHEM.NS', name: 'Aegis Logistics Ltd' },
  { symbol: 'AFFLE.NS', name: 'Affle (India) Ltd' },
  { symbol: 'ARE&M.NS', name: 'Amara Raja Energy & Mobility Ltd' },
  { symbol: 'AMBER.NS', name: 'Amber Enterprises India Ltd' },
  { symbol: 'ANANDRATHI.NS', name: 'Anand Rathi Wealth Ltd' },
  { symbol: 'ANGELONE.NS', name: 'Angel One Ltd' },
  { symbol: 'ASTERDM.NS', name: 'Aster DM Healthcare Ltd' },
  { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank Ltd' },
  { symbol: 'CASTROLIND.NS', name: 'Castrol India Ltd' },
  { symbol: 'CDSL.NS', name: 'Central Depository Services (India) Ltd' },
  { symbol: 'CUB.NS', name: 'City Union Bank Ltd' },
  { symbol: 'COHANCE.NS', name: 'Cohance Lifesciences Ltd' },
  { symbol: 'CAMS.NS', name: 'Computer Age Management Services Ltd (CAMS)' },
  { symbol: 'CROMPTON.NS', name: 'Crompton Greaves Consumer Electricals Ltd' },
  { symbol: 'DELHIVERY.NS', name: 'Delhivery Ltd' },
  { symbol: 'LALPATHLAB.NS', name: 'Dr. Lal PathLabs Ltd' },
  { symbol: 'FIVESTAR.NS', name: 'Five-Star Business Finance Ltd' },
  { symbol: 'GLAND.NS', name: 'Gland Pharma Ltd' },
  { symbol: 'HSCL.NS', name: 'Himadri Speciality Chemical Ltd' },
  { symbol: 'HINDCOPPER.NS', name: 'Hindustan Copper Ltd' },
  { symbol: 'IIFL.NS', name: 'IIFL Finance Ltd' },
  { symbol: 'IGL.NS', name: 'Indraprastha Gas Ltd' },
  { symbol: 'INOXWIND.NS', name: 'Inox Wind Ltd' },
  { symbol: 'KARURVYSYA.NS', name: 'Karur Vysya Bank Ltd' },
  { symbol: 'KAYNES.NS', name: 'Kaynes Technology India Ltd' },
  { symbol: 'KEC.NS', name: 'KEC International Ltd' },
  { symbol: 'KFINTECH.NS', name: 'KFin Technologies Ltd' },
  { symbol: 'MANAPPURAM.NS', name: 'Manappuram Finance Ltd' },
  { symbol: 'NH.NS', name: 'Narayana Hrudayalaya Ltd' },
  { symbol: 'NATCOPHARM.NS', name: 'Natco Pharma Ltd' },
  { symbol: 'NAVINFLUOR.NS', name: 'Navin Fluorine International Ltd' },
  { symbol: 'NBCC.NS', name: 'NBCC (India) Ltd' },
  { symbol: 'NEULANDLAB.NS', name: 'Neuland Laboratories Ltd' },
  { symbol: 'PGEL.NS', name: 'PG Electroplast Ltd' },
  { symbol: 'PPLPHARMA.NS', name: 'Piramal Pharma Ltd' },
  { symbol: 'PNBHOUSING.NS', name: 'PNB Housing Finance Ltd' },
  { symbol: 'POONAWALLA.NS', name: 'Poonawalla Fincorp Ltd' },
  { symbol: 'RBLBANK.NS', name: 'RBL Bank Ltd' },
  { symbol: 'REDINGTON.NS', name: 'Redington Ltd' },
  { symbol: 'SAILIFE.NS', name: 'Sai Life Sciences Ltd' },
  { symbol: 'SONACOMS.NS', name: 'Sona BLW Precision Forgings Ltd' },
  { symbol: 'SYNGENE.NS', name: 'Syngene International Ltd' },
  { symbol: 'TATACHEM.NS', name: 'Tata Chemicals Ltd' },
  { symbol: 'TATATECH.NS', name: 'Tata Technologies Ltd' },
  { symbol: 'WELCORP.NS', name: 'Welspun Corp Ltd' },
  { symbol: 'WOCKPHARMA.NS', name: 'Wockhardt Ltd' },
  { symbol: 'ZENSARTECH.NS', name: 'Zensar Technologies Ltd' },
];

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('scalper_watchlist')
      .select('id, symbol, name, active')
      .order('symbol');

    if (error || !data || data.length === 0) {
      // Auto-seed if database watchlist is empty or inaccessible
      return NextResponse.json(NIFTY_SMALLCAP_50_SCALPER_WATCHLIST.map(item => ({ ...item, active: true })));
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching scalper watchlist:', error);
    return NextResponse.json(NIFTY_SMALLCAP_50_SCALPER_WATCHLIST.map(item => ({ ...item, active: true })));
  }
}

export async function POST() {
  try {
    const rowsToUpsert = NIFTY_SMALLCAP_50_SCALPER_WATCHLIST.map(item => ({
      symbol: item.symbol,
      name: item.name,
      active: true,
    }));

    const { data, error } = await supabaseAdmin
      .from('scalper_watchlist')
      .upsert(rowsToUpsert, { onConflict: 'symbol' })
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || rowsToUpsert.length, items: data });
  } catch (error: any) {
    console.error('Error seeding scalper watchlist:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed scalper watchlist' }, { status: 500 });
  }
}
