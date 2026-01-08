/**
 * Airport Data
 */

export const AIRPORTS = {
    // Europe
    MAD: { id: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'ES', lat: 40.4719, lon: -3.5626, pop: 6.6, runway: 4100 },
    LHR: { id: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.4700, lon: -0.4543, pop: 9.0, runway: 3900 },
    CDG: { id: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'FR', lat: 49.0097, lon: 2.5479, pop: 12.2, runway: 4200 },
    FRA: { id: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'DE', lat: 50.0379, lon: 8.5622, pop: 5.8, runway: 4000 },
    AMS: { id: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'NL', lat: 52.3105, lon: 4.7683, pop: 2.4, runway: 3800 },

    // North America
    JFK: { id: 'JFK', name: 'John F. Kennedy', city: 'New York', country: 'US', lat: 40.6413, lon: -73.7781, pop: 18.8, runway: 4400 },
    LAX: { id: 'LAX', name: 'Los Angeles Intl', city: 'Los Angeles', country: 'US', lat: 33.9416, lon: -118.4085, pop: 12.4, runway: 3900 },
    ORD: { id: 'ORD', name: 'O\'Hare Intl', city: 'Chicago', country: 'US', lat: 41.9742, lon: -87.9073, pop: 8.8, runway: 3900 },
    YYZ: { id: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'CA', lat: 43.6777, lon: -79.6248, pop: 6.2, runway: 3300 },
    MEX: { id: 'MEX', name: 'Mexico City Intl', city: 'Mexico City', country: 'MX', lat: 19.4361, lon: -99.0719, pop: 21.0, runway: 3900 },

    // South America
    GRU: { id: 'GRU', name: 'Guarulhos', city: 'Sao Paulo', country: 'BR', lat: -23.4356, lon: -46.4731, pop: 22.0, runway: 3700 },
    EZE: { id: 'EZE', name: 'Ezeiza Intl', city: 'Buenos Aires', country: 'AR', lat: -34.8150, lon: -58.5348, pop: 15.0, runway: 3300 },
    BOG: { id: 'BOG', name: 'El Dorado', city: 'Bogota', country: 'CO', lat: 4.7016, lon: -74.1469, pop: 10.0, runway: 3800 },

    // Asia/Pacific
    HND: { id: 'HND', name: 'Haneda', city: 'Tokyo', country: 'JP', lat: 35.5494, lon: 139.7798, pop: 37.0, runway: 3300 },
    DXB: { id: 'DXB', name: 'Dubai Intl', city: 'Dubai', country: 'AE', lat: 25.2532, lon: 55.3657, pop: 3.3, runway: 4000 },
    SIN: { id: 'SIN', name: 'Changi', city: 'Singapore', country: 'SG', lat: 1.3644, lon: 103.9915, pop: 5.7, runway: 4000 },
    SYD: { id: 'SYD', name: 'Kingsford Smith', city: 'Sydney', country: 'AU', lat: -33.9399, lon: 151.1753, pop: 5.3, runway: 3900 },
    HKG: { id: 'HKG', name: 'Hong Kong Intl', city: 'Hong Kong', country: 'HK', lat: 22.3080, lon: 113.9185, pop: 7.5, runway: 3800 }
};

export class Airport {
    constructor(id) {
        const data = AIRPORTS[id];
        if (!data) throw new Error("Invalid Airport ID");
        Object.assign(this, data);
    }
}
