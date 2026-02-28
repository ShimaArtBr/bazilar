/**
 * BAZILAR — Timezone & Geocoding Module
 * Uses: OpenStreetMap Nominatim (free, no API key)
 *       Intl API for DST (browser built-in IANA database)
 */

const GeoModule = (() => {

  // Major IANA timezones with display names and offsets
  // Used for the timezone selector dropdown
  const TIMEZONES = [
    { tz: 'Pacific/Apia',           label: 'UTC−11  Samoa, Midway' },
    { tz: 'Pacific/Honolulu',       label: 'UTC−10  Honolulu, Hawaii' },
    { tz: 'America/Anchorage',      label: 'UTC−9   Alaska' },
    { tz: 'America/Los_Angeles',    label: 'UTC−8   Los Angeles, Vancouver' },
    { tz: 'America/Denver',         label: 'UTC−7   Denver, Phoenix' },
    { tz: 'America/Chicago',        label: 'UTC−6   Chicago, Mexico City' },
    { tz: 'America/New_York',       label: 'UTC−5   New York, Toronto, Bogotá' },
    { tz: 'America/Halifax',        label: 'UTC−4   Halifax, Caracas' },
    { tz: 'America/Sao_Paulo',      label: 'UTC−3   São Paulo, Rio, Buenos Aires' },
    { tz: 'America/Noronha',        label: 'UTC−2   Fernando de Noronha' },
    { tz: 'Atlantic/Azores',        label: 'UTC−1   Açores, Cabo Verde' },
    { tz: 'Europe/London',          label: 'UTC±0   Londres, Lisboa, Dublin' },
    { tz: 'Europe/Paris',           label: 'UTC+1   Paris, Berlim, Roma, Madrid' },
    { tz: 'Europe/Athens',          label: 'UTC+2   Atenas, Cairo, Joanesburgo' },
    { tz: 'Europe/Moscow',          label: 'UTC+3   Moscou, Nairobi, Bagdá' },
    { tz: 'Asia/Dubai',             label: 'UTC+4   Dubai, Baku, Tbilisi' },
    { tz: 'Asia/Karachi',           label: 'UTC+5   Karachi, Islamabad, Tashkent' },
    { tz: 'Asia/Kolkata',           label: 'UTC+5:30 Mumbai, Nova Delhi, Calcutá' },
    { tz: 'Asia/Dhaka',             label: 'UTC+6   Dhaka, Almaty, Omsk' },
    { tz: 'Asia/Rangoon',           label: 'UTC+6:30 Yangon' },
    { tz: 'Asia/Bangkok',           label: 'UTC+7   Bangkok, Hanói, Jacarta' },
    { tz: 'Asia/Shanghai',          label: 'UTC+8   Pequim, Shanghai, Taipei, Singapura, KL' },
    { tz: 'Asia/Hong_Kong',         label: 'UTC+8   Hong Kong, Macau' },
    { tz: 'Asia/Tokyo',             label: 'UTC+9   Tóquio, Seoul, Pyongyang' },
    { tz: 'Australia/Sydney',       label: 'UTC+10  Sydney, Melbourne, Port Moresby' },
    { tz: 'Pacific/Noumea',         label: 'UTC+11  Nova Caledônia, Vladivostok' },
    { tz: 'Pacific/Auckland',       label: 'UTC+12  Auckland, Fiji, Wellington' },
    // Additional important timezones
    { tz: 'America/Manaus',         label: 'UTC−4   Manaus, Cuiabá' },
    { tz: 'America/Fortaleza',      label: 'UTC−3   Fortaleza, Recife, Salvador' },
    { tz: 'America/Belem',          label: 'UTC−3   Belém (sem horário de verão)' },
    { tz: 'America/Bahia',          label: 'UTC−3   Bahia' },
    { tz: 'America/Boa_Vista',      label: 'UTC−4   Boa Vista, RR' },
    { tz: 'America/Porto_Velho',    label: 'UTC−4   Porto Velho, RO' },
    { tz: 'America/Rio_Branco',     label: 'UTC−5   Rio Branco, AC' },
    { tz: 'America/Argentina/Buenos_Aires', label: 'UTC−3 Buenos Aires' },
    { tz: 'America/Lima',           label: 'UTC−5   Lima, Bogotá, Quito' },
    { tz: 'America/Santiago',       label: 'UTC−4   Santiago' },
    { tz: 'America/Mexico_City',    label: 'UTC−6   Cidade do México' },
    { tz: 'Asia/Taipei',            label: 'UTC+8   Taipei' },
    { tz: 'Asia/Singapore',         label: 'UTC+8   Singapura' },
    { tz: 'Asia/Kuala_Lumpur',      label: 'UTC+8   Kuala Lumpur' },
    { tz: 'Asia/Seoul',             label: 'UTC+9   Seoul' },
    { tz: 'Asia/Calcutta',          label: 'UTC+5:30 Kolkata (Calcutá)' },
    { tz: 'Africa/Cairo',           label: 'UTC+2   Cairo' },
    { tz: 'Africa/Johannesburg',    label: 'UTC+2   Joanesburgo' },
    { tz: 'Africa/Lagos',           label: 'UTC+1   Lagos, Abuja' },
    { tz: 'Australia/Perth',        label: 'UTC+8   Perth' },
    { tz: 'Australia/Darwin',       label: 'UTC+9:30 Darwin' },
    { tz: 'Australia/Adelaide',     label: 'UTC+9:30 Adelaide' },
    { tz: 'Europe/Lisbon',          label: 'UTC±0   Lisboa, Funchal' },
    { tz: 'Atlantic/Canary',        label: 'UTC±0   Ilhas Canárias' },
    { tz: 'Europe/Amsterdam',       label: 'UTC+1   Amsterdã, Bruxelas' },
    { tz: 'Europe/Warsaw',          label: 'UTC+1   Varsóvia, Praga, Viena' },
    { tz: 'Europe/Bucharest',       label: 'UTC+2   Bucareste, Sofia, Helsinki' },
    { tz: 'Europe/Kiev',            label: 'UTC+2   Kiev' },
    { tz: 'Asia/Beirut',            label: 'UTC+2   Beirute, Damasco, Amã' },
    { tz: 'Asia/Jerusalem',         label: 'UTC+2   Tel Aviv, Jerusalém' },
    { tz: 'Asia/Tehran',            label: 'UTC+3:30 Teerã' },
    { tz: 'Asia/Riyadh',            label: 'UTC+3   Riade, Kuwait, Bagdá' },
    { tz: 'Asia/Kabul',             label: 'UTC+4:30 Cabul' },
    { tz: 'Asia/Colombo',           label: 'UTC+5:30 Colombo' },
    { tz: 'Asia/Kathmandu',         label: 'UTC+5:45 Katmandu' },
    { tz: 'Asia/Yangon',            label: 'UTC+6:30 Yangon (Rangum)' },
    { tz: 'Asia/Ho_Chi_Minh',       label: 'UTC+7   Ho Chi Minh, Hanói' },
    { tz: 'Asia/Jakarta',           label: 'UTC+7   Jacarta' },
    { tz: 'Asia/Makassar',          label: 'UTC+8   Makassar' },
    { tz: 'Asia/Jayapura',          label: 'UTC+9   Papua Ocidental' },
    { tz: 'Pacific/Guam',           label: 'UTC+10  Guam, Saipan' },
    { tz: 'Pacific/Port_Moresby',   label: 'UTC+10  Port Moresby' },
    { tz: 'Pacific/Fiji',           label: 'UTC+12  Fiji' },
    { tz: 'Pacific/Tongatapu',      label: 'UTC+13  Tonga' },
  ].sort((a, b) => a.label.localeCompare(b.label));

  // Detect timezone from longitude (heuristic fallback)
  function guessTimezoneFromLongitude(lon) {
    const offsetHours = Math.round(lon / 15);
    const guesses = {
      '-11': 'Pacific/Apia',
      '-10': 'Pacific/Honolulu',
      '-9':  'America/Anchorage',
      '-8':  'America/Los_Angeles',
      '-7':  'America/Denver',
      '-6':  'America/Chicago',
      '-5':  'America/New_York',
      '-4':  'America/Sao_Paulo',
      '-3':  'America/Sao_Paulo',
      '-2':  'America/Noronha',
      '-1':  'Atlantic/Azores',
       '0':  'Europe/London',
       '1':  'Europe/Paris',
       '2':  'Europe/Athens',
       '3':  'Europe/Moscow',
       '4':  'Asia/Dubai',
       '5':  'Asia/Karachi',
       '6':  'Asia/Dhaka',
       '7':  'Asia/Bangkok',
       '8':  'Asia/Shanghai',
       '9':  'Asia/Tokyo',
      '10':  'Australia/Sydney',
      '11':  'Pacific/Noumea',
      '12':  'Pacific/Auckland',
    };
    return guesses[String(offsetHours)] || 'UTC';
  }

  // Nominatim geocoding
  async function searchCity(query) {
    if (!query || query.length < 3) return [];
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&featuretype=city&addressdetails=1`;
    try {
      const resp = await fetch(url, {
        headers: { 'Accept-Language': 'pt-BR,pt,en', 'User-Agent': 'Bazilar/1.0 BaZi Calculator' }
      });
      const data = await resp.json();
      return data.map(r => ({
        name: r.display_name,
        shortName: r.address?.city || r.address?.town || r.address?.village || r.name,
        country: r.address?.country,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        tz: guessTimezoneFromLongitude(parseFloat(r.lon)),
      }));
    } catch (e) {
      console.warn('Geocoding failed:', e);
      return [];
    }
  }

  // Attempt to get timezone via timeapi.io (free, no key)
  async function getTimezoneForCoords(lat, lon) {
    try {
      const url = `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lon}`;
      const resp = await fetch(url);
      const data = await resp.json();
      if (data.timeZone) return data.timeZone;
    } catch (e) {}
    return guessTimezoneFromLongitude(lon);
  }

  return { TIMEZONES, searchCity, getTimezoneForCoords, guessTimezoneFromLongitude };

})();
